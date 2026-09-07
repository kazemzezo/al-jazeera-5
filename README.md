# الجزيره خمسه

سوق الخردة الإلكتروني - الرصيف البحري وساحة الجزيره.

## المرحلة الحالية (1 من 7)
- الهيكل الأساسي للمشروع (React + Vite)
- تسجيل الدخول عبر جوجل (Firebase Authentication)
- نظام الصلاحيات: أدمن، مشرف الموقع، تاجر موثق، تاجر عادي، 3 سائقي معدات
- تاجر غير موثق يشاهد الأدوات لكن لا يقدر يحجز، ويقدر يبعت طلب توثيق للأدمن

باقي المراحل (الرصيف البحري/ساحة الجزيره، أداة الحساب، المعدات والعمال،
الفاتورة، لوحة الإدمن الكاملة، التصميم النهائي) هتُبنى تباعًا.

## التشغيل محليًا

يحتاج جهازك [Node.js](https://nodejs.org) (نسخة 18 أو أحدث).

```bash
npm install
npm run dev
```

هيفتحلك التطبيق على `http://localhost:5173`.

## قواعد أمان Firestore

بعد إنشاء قاعدة البيانات، انسخ محتوى ملف `firestore.rules` والصقه في
Firebase Console > Firestore Database > Rules، ثم اضغط Publish.

## الرفع على GitHub Pages

1. تأكد أن اسم الريبو على GitHub هو نفسه المكتوب في `vite.config.js`
   (السطر `base: "/al-jazeera-5/"`). لو غيّرت اسم الريبو، عدّل السطر ده.
2. ادفع الكود إلى الريبو (`git push`).
3. شغّل أمر النشر:

```bash
npm run build
npm run deploy
```

هيتم نشر مجلد `dist` تلقائيًا على فرع `gh-pages`. بعدها فعّل GitHub Pages
من إعدادات الريبو (Settings > Pages) واختر الفرع `gh-pages`.

4. **مهم:** في Firebase Console > Authentication > Settings > Authorized
   domains، أضف نطاق GitHub Pages بتاعك (مثلاً
   `username.github.io`) حتى يعمل تسجيل الدخول بجوجل من هناك.

## بنية المشروع

```
src/
  lib/
    firebase.js      إعداد الاتصال بـ Firebase
    roles.js          تعريف الأدوار والصلاحيات
    verification.js   طلب التوثيق للتجار غير الموثقين
  context/
    AuthContext.jsx    حالة تسجيل الدخول والدور الحالي
  components/
    ProtectedRoute.jsx حماية الصفحات حسب تسجيل الدخول/الدور
    AppLayout.jsx       الهيكل العام (الهيدر والتنقل)
  pages/
    Login.jsx           صفحة تسجيل الدخول
    Home.jsx             الرئيسية (الرصيف البحري/ساحة الجزيره - قادم)
    Calculator.jsx       أداة الحساب (قادم)
    AdminPanel.jsx        لوحة الإدمن (قادم)
    SupervisorPanel.jsx   لوحة مشرف الموقع (قادم)
    DriverPanel.jsx       حالة معدة السائق (قادم)
```
