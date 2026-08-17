import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { cockpit, school } from "./school";

export type Role = "校長" | "主任" | "教師";

const RoleCtx = createContext<{ role: Role; setRole: (r: Role) => void }>({
  role: "校長",
  setRole: () => {},
});

export function useRole() {
  return useContext(RoleCtx);
}

const NAV: { to: string; label: string; roles: Role[] }[] = [
  { to: "/", label: "今日", roles: ["校長", "主任", "教師"] },
  { to: "/classes", label: "班級", roles: ["校長", "主任", "教師"] },
  { to: "/students", label: "學生", roles: ["校長", "主任", "教師"] },
  { to: "/teachers", label: "教師", roles: ["校長", "主任"] },
  { to: "/approvals", label: "待批准", roles: ["校長", "主任"] },
  { to: "/admissions", label: "招生", roles: ["校長", "主任"] },
  { to: "/advancement", label: "升學", roles: ["校長", "主任", "教師"] },
  { to: "/policy", label: "策略", roles: ["校長", "主任"] },
  { to: "/reports", label: "報表", roles: ["校長", "主任", "教師"] },
  { to: "/resources", label: "科組資源", roles: ["校長", "主任", "教師"] },
];

export function Shell({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("校長");
  const items = useMemo(() => NAV.filter((n) => n.roles.includes(role)), [role]);

  return (
    <RoleCtx.Provider value={{ role, setRole }}>
      <div className="shell">
        <aside className="side">
          <Link to="/" className="side-brand">
            廣大中學
          </Link>
          <p className="side-sub">
            {school.students.length} 名學生 · {school.teachers.length} 位教師 · {school.classes.length} 班
          </p>
          <nav className="side-nav">
            {items.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === "/"} className={({ isActive }) => (isActive ? "on" : "")}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <label className="role-box">
            以誰進入
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option>校長</option>
              <option>主任</option>
              <option>教師</option>
            </select>
          </label>
        </aside>
        <div className="shell-main">
          <header className="nav">
            <span className="nav-title">{role}檢視</span>
            <span className="nav-meta">{cockpit.dateLabel}</span>
          </header>
          <main className="wrap">{children}</main>
        </div>
      </div>
    </RoleCtx.Provider>
  );
}
