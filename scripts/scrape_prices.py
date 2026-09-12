"""
سكربت سحب أسعار الخردة المصرية
يشتغل من GitHub Actions يومياً
"""

import json
import os
import re
from datetime import datetime, timezone

# ═══════════════════════════════════════════════════════
# المصادر (بترتيب الأولوية)
# ═══════════════════════════════════════════════════════
SOURCES = [
    {
        "name": "الصباح اليوم",
        "url": "https://www.alsabahalyoum.com/أسعار-الخردة-اليوم-الجمعة-في-مصر-الحديد-والألومنيوم-والصفيح-والبلاستيك",
        "type": "article",
    },
    {
        "name": "فيتو",
        "url": "https://www.vetogate.com/keyword/0/wordpress/0",
        "type": "article",
    },
    {
        "name": "إيجبتكِ",
        "url": "https://www.egyptke.com/keyword/176152",
        "type": "article",
    },
]

# بيانات احتياطية (لو كل المصادر فشلت)
FALLBACK_PRICES = [
    {"material": "حديد خردة (خليط)", "price": 18000, "unit": "ج/طن", "pricePerKg": 18},
    {"material": "حديد خردة (مميز)", "price": 20000, "unit": "ج/طن", "pricePerKg": 20},
    {"material": "نحاس أحمر خردة", "price": 450000, "unit": "ج/طن", "pricePerKg": 450},
    {"material": "نحاس أصفر خردة", "price": 290000, "unit": "ج/طن", "pricePerKg": 290},
    {"material": "ألومنيوم خردة", "price": 108000, "unit": "ج/طن", "pricePerKg": 90},
    {"material": "صاج خردة", "price": 16000, "unit": "ج/طن", "pricePerKg": 16},
    {"material": "صفيح خردة", "price": 16000, "unit": "ج/طن", "pricePerKg": 16},
    {"material": "بلاستيك خردة", "price": 25000, "unit": "ج/طن", "pricePerKg": 25},
]

OUTPUT_FILE = "public/scraped-prices.json"


def extract_prices_from_text(text):
    """
    يستخرج الأسعار من نص المقال باستخدام أنماط regex
    """
    prices = []
    lines = text.split("\n")
    
    # أنماط للبحث عنها
    patterns = {
        "حديد خردة (خليط)": [
            r"الحديد\s*الخردة\s*الخليط[:\s]*(\d+)\s*جنيه.*للكيلو",
            r"خردة\s*الحديد.*?(\d+)\s*جنيه.*كيلو",
        ],
        "حديد خردة (مميز)": [
            r"الحديد\s*الخردة\s*المميز[:\s]*(\d+)\s*جنيه.*للكيلو",
        ],
        "نحاس أحمر خردة": [
            r"النحاس\s*الأحمر\s*الخردة[:\s]*(\d+).*?(\d+)\s*جنيه",
            r"نحاس\s*أحمر.*?(\d+)\s*جنيه",
        ],
        "نحاس أصفر خردة": [
            r"النحاس\s*الأصفر\s*الخردة[:\s]*(\d+).*?(\d+)\s*جنيه",
            r"نحاس\s*أصفر.*?(\d+)\s*جنيه",
        ],
        "ألومنيوم خردة": [
            r"الألومنيوم\s*الخردة[:\s]*(\d+).*?(\d+)\s*جنيه.*للكيلو",
            r"ألومنيوم.*?(\d+).*?(\d+)\s*جنيه",
        ],
        "صاج خردة": [
            r"الصاج\s*الخردة[:\s]*(\d+).*?(\d+)\s*جنيه",
        ],
        "صفيح خردة": [
            r"الصفيح\s*الخردة[:\s]*(\d+).*?(\d+)\s*جنيه",
        ],
        "بلاستيك خردة": [
            r"البلاستيك\s*الخردة[:\s]*(\d+).*?(\d+)\s*جنيه",
        ],
    }
    
    for material, regex_list in patterns.items():
        for pattern in regex_list:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                # خد آخر رقم (لأن النطاقات بتكون "من X إلى Y")
                nums = [int(g) for g in match.groups() if g and g.isdigit()]
                if nums:
                    price_per_kg = max(nums)
                    price_per_ton = price_per_kg * 1000
                    prices.append({
                        "material": material,
                        "price": price_per_ton,
                        "unit": "ج/طن",
                        "pricePerKg": price_per_kg,
                    })
                    break
    
    return prices


def scrape_source(source):
    """يحاول يسحب من مصدر واحد"""
    try:
        import requests
        from bs4 import BeautifulSoup

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "ar,en;q=0.9",
        }

        print(f"→ محاولة سحب من: {source['name']}")
        response = requests.get(source["url"], headers=headers, timeout=30)

        if response.status_code != 200:
            print(f"  ❌ فشل الاتصال: {response.status_code}")
            return None

        soup = BeautifulSoup(response.text, "html.parser")

        # شيل السكريبتات والستايلات
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        text = soup.get_text(separator="\n", strip=True)
        prices = extract_prices_from_text(text)

        if prices:
            print(f"  ✅ تم سحب {len(prices)} سعر")
            return prices
        else:
            print(f"  ⚠️ مفيش أسعار صالحة في النص")
            return None

    except Exception as e:
        print(f"  ❌ خطأ: {e}")
        return None


def main():
    print("=" * 60)
    print("🤖 سكربت سحب أسعار الخردة المصرية")
    print("=" * 60)

    result = None
    used_source = "بيانات احتياطية"

    for source in SOURCES:
        result = scrape_source(source)
        if result:
            used_source = source["name"]
            break

    if not result:
        print("\n⚠️ كل المصادر فشلت — استخدام البيانات الاحتياطية")
        result = FALLBACK_PRICES

    output = {
        "lastUpdate": datetime.now(timezone.utc).isoformat(),
        "source": used_source,
        "status": "success" if used_source != "بيانات احتياطية" else "fallback",
        "prices": result,
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ تم الحفظ في: {OUTPUT_FILE}")
    print(f"📊 عدد الأسعار: {len(result)}")


if __name__ == "__main__":
    main()
