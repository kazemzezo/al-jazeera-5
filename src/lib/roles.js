// أدوار المستخدمين في التطبيق
export const ROLES = {
  ADMIN: "admin",
  SUPERVISOR: "supervisor", // مشرف الموقع
  VERIFIED_TRADER: "verified_trader", // تاجر موثق
  TRADER: "trader", // تاجر عادي (غير موثق) - الافتراضي لأي حساب جديد
  DRIVER_KABBASH: "driver_kabbash", // سائق الكباش
  DRIVER_CRAWLER_CRANE: "driver_crawler_crane", // سائق الرافعة المجنزرة
  DRIVER_FORKLIFT: "driver_forklift", // سائق الرافعة الشوكية
};

// البريد الإلكتروني الأساسي للأدمن - له كل الصلاحيات ولا يمكن حذفه أو تعليقه أبدًا
export const PRIMARY_ADMIN_EMAIL = "popofloop@gmail.com";

export const DRIVER_ROLES = [
  ROLES.DRIVER_KABBASH,
  ROLES.DRIVER_CRAWLER_CRANE,
  ROLES.DRIVER_FORKLIFT,
];

export function isAdmin(role, email) {
  return role === ROLES.ADMIN || email === PRIMARY_ADMIN_EMAIL;
}

export function canReserve(role) {
  return role === ROLES.VERIFIED_TRADER || role === ROLES.ADMIN;
}

export function isSupervisor(role) {
  return role === ROLES.SUPERVISOR;
}

export function isDriver(role) {
  return DRIVER_ROLES.includes(role);
}
