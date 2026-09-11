// التحقق من اكتمال بيانات الملف الشخصي
// المطلوب: name (الاسم الكامل)، phone (الهاتف)، governorate (المحافظة)

export function isProfileComplete(profile) {
  if (!profile) return false;
  return !!(
    profile.name?.trim() &&
    profile.phone?.trim() &&
    profile.governorate?.trim()
  );
}

// الحقول الناقصة (للعرض في البانر)
export function missingProfileFields(profile) {
  const missing = [];
  if (!profile?.name?.trim()) missing.push("الاسم الكامل");
  if (!profile?.phone?.trim()) missing.push("رقم الهاتف");
  if (!profile?.governorate?.trim()) missing.push("المحافظة");
  return missing;
}

// التحقق من صيغة رقم الهاتف المصري
// يقبل: 010xxxxxxx / 011xxxxxxx / 012xxxxxxx / 015xxxxxxx
export function isValidEgyptianPhone(phone) {
  const cleaned = String(phone || "").replace(/\s+/g, "");
  return /^01[0125][0-9]{8}$/.test(cleaned);
}

// تنسيق الرقم للعرض (اختياري)
export function formatPhone(phone) {
  if (!phone) return "—";
  return String(phone).trim();
}
