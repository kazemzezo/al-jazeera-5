import { useEffect, useMemo, useState } from "react";
import {
  subscribeAllUsers,
  changeUserRole,
  toggleUserSuspended,
  getRoleLabel,
  roleBadgeStyle,
  ROLE_OPTIONS,
} from "../lib/users";

export default function AdminUsersTab({ adminUid }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [pendingRole, setPendingRole] = useState("");

  useEffect(() => {
    const unsub = subscribeAllUsers(setUsers, (err) => {
      console.error("فشل تحميل المستخدمين:", err);
      setError("تعذر تحميل المستخدمين.");
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.phone || "").includes(q) ||
          (u.company || "").toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    }
    return list;
  }, [users, search, roleFilter]);

  const counts = useMemo(() => {
    const c = { all: users.length };
    ROLE_OPTIONS.forEach((r) => {
      c[r.value] = users.filter((u) => u.role === r.value).length;
    });
    return c;
  }, [users]);

  async function handleRoleChange(u) {
    if (!pendingRole || pendingRole === u.role) {
      setEditingRoleId(null);
      return;
    }
    setBusyId(u.id);
    setError("");
    setSuccess("");
    try {
      await changeUserRole(u.id, pendingRole, adminUid);
      setSuccess(`تم تحديث دور ${u.name || u.email}`);
      setEditingRoleId(null);
      setPendingRole("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "تعذر تحديث الدور");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleSuspend(u) {
    const action = u.suspended ? "تفعيل" : "تعليق";
    if (!window.confirm(`${action} حساب ${u.name || u.email}؟`)) return;
    setBusyId(u.id);
    setError("");
    setSuccess("");
    try {
      await toggleUserSuspended(u.id, !u.suspended, adminUid);
      setSuccess(`تم ${action} الحساب`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "تعذر تحديث الحساب");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div
        style={{
          background: "var(--crane-light)",
          border: "1px solid var(--crane)",
          borderRadius: "var(--radius)",
          padding: "10px 14px",
          marginBottom: 14,
          fontSize: 12.5,
          lineHeight: 1.7,
        }}
      >
        🔐 تاب مخصص للأدمن الأساسي فقط.
      </div>

      {error && (
        <div
          style={{
            fontSize: 13,
            color: "var(--danger)",
            background: "var(--danger-light)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            fontSize: 13,
            color: "var(--kabbash)",
            background: "var(--kabbash-light)",
            border: "1px solid var(--kabbash)",
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            marginBottom: 12,
          }}
        >
          ✅ {success}
        </div>
      )}

      <input
        className="input"
        placeholder="ابحث بالاسم أو الإيميل أو الهاتف أو الشركة..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn"
          style={{
            fontSize: 12,
            padding: "5px 12px",
            background: roleFilter === "all" ? "var(--ink)" : "transparent",
            color: roleFilter === "all" ? "var(--paper)" : "var(--ink)",
            borderColor: roleFilter === "all" ? "var(--ink)" : "var(--line)",
          }}
          onClick={() => setRoleFilter("all")}
        >
          الكل ({counts.all})
        </button>
        {ROLE_OPTIONS.map((r) => (
          <button
            key={r.value}
            className="btn"
            style={{
              fontSize: 12,
              padding: "5px 12px",
              background:
                roleFilter === r.value ? "var(--ink)" : "transparent",
              color: roleFilter === r.value ? "var(--paper)" : "var(--ink)",
              borderColor:
                roleFilter === r.value ? "var(--ink)" : "var(--line)",
            }}
            onClick={() => setRoleFilter(r.value)}
          >
            {r.label} ({counts[r.value] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--steel)" }}>
          {search.trim() || roleFilter !== "all"
            ? "لا توجد نتائج مطابقة."
            : "لا يوجد مستخدمين بعد."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((u) => {
            const isEditing = editingRoleId === u.id;
            const isBusy = busyId === u.id;

            return (
              <div
                key={u.id}
                style={{
                  background: "var(--paper-raised)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  padding: 14,
                  opacity: u.suspended ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 220, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {u.name || "بدون اسم"}
                      </p>
                      <span style={roleBadgeStyle(u.role)}>
                        {getRoleLabel(u.role)}
                      </span>
                      {u.suspended && (
                        <span
                          className="badge badge-danger"
                          style={{ fontSize: 11 }}
                        >
                          معلق
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12.5,
                        color: "var(--steel)",
                      }}
                    >
                      {u.email}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        marginTop: 6,
                        fontSize: 12,
                        color: "var(--steel)",
                      }}
                    >
                      {u.phone && <span>📞 {u.phone}</span>}
                      {u.governorate && <span>📍 {u.governorate}</span>}
                      {u.company && <span>🏢 {u.company}</span>}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    {!isEditing && (
                      <button
                        className="btn"
                        style={{
                          fontSize: 12,
                          padding: "5px 12px",
                          color: "var(--kabbash)",
                          borderColor: "var(--kabbash)",
                        }}
                        onClick={() => {
                          setEditingRoleId(u.id);
                          setPendingRole(u.role || "");
                        }}
                        disabled={isBusy}
                      >
                        تغيير الدور
                      </button>
                    )}

                    <button
                      className="btn"
                      style={{
                        fontSize: 12,
                        padding: "5px 12px",
                        color: u.suspended ? "var(--kabbash)" : "var(--danger)",
                        borderColor: u.suspended
                          ? "var(--kabbash)"
                          : "var(--danger)",
                      }}
                      onClick={() => handleToggleSuspend(u)}
                      disabled={isBusy}
                    >
                      {u.suspended ? "تفعيل الحساب" : "تعليق الحساب"}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px dashed var(--line)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      اختر الدور الجديد:
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <button
                          key={r.value}
                          className="btn"
                          style={{
                            fontSize: 12,
                            padding: "5px 12px",
                            background:
                              pendingRole === r.value
                                ? "var(--kabbash)"
                                : "transparent",
                            color:
                              pendingRole === r.value
                                ? "#fff"
                                : "var(--ink)",
                            borderColor:
                              pendingRole === r.value
                                ? "var(--kabbash)"
                                : "var(--line)",
                          }}
                          onClick={() => setPendingRole(r.value)}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: 13 }}
                        onClick={() => handleRoleChange(u)}
                        disabled={isBusy || !pendingRole}
                      >
                        {isBusy ? "جاري الحفظ..." : "تأكيد التغيير"}
                      </button>
                      <button
                        className="btn"
                        style={{ fontSize: 13 }}
                        onClick={() => {
                          setEditingRoleId(null);
                          setPendingRole("");
                        }}
                        disabled={isBusy}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
