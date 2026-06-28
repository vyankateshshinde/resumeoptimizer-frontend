import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Brain,
  FilePenLine,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Resume Builder", path: "/resume-builder", icon: FilePenLine },
  { label: "Upload Resume", path: "/upload-resume", icon: UploadCloud },
  { label: "AI ATS Analysis", path: "/ats-analysis", icon: Sparkles },
  { label: "ATS History", path: "/ats-history", icon: History },
  { label: "Resume Versions", path: "/resume-versions", icon: FileText },
];

const AppLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <style>{styles}</style>
      <button className="app-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
        <Menu size={22} />
      </button>

      {mobileOpen && <button className="app-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <aside className={`app-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="app-brand">
          <div className="app-brand-icon"><Brain size={27} /></div>
          <div><strong>AI Resume</strong><span>Optimizer</span></div>
          <button className="app-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <nav className="app-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `app-nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={21} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button className="app-logout" onClick={handleLogout}>
          <LogOut size={21} /> Logout
        </button>
      </aside>

      <div className="app-main-wrap">
        <header className="app-topbar">
          <div>
            <h1>Resume Intelligence Platform</h1>
            <p>Analyze, optimize and improve resumes with AI.</p>
          </div>
          <button className="app-build-button" onClick={() => navigate("/resume-builder")}>
            <Sparkles size={17} /> Build Resume
          </button>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
};

const styles = `
  * { box-sizing: border-box; }
  .app-shell { min-height: 100vh; display: flex; background: #020617; color: #f8fafc; font-family: Inter, system-ui, sans-serif; }
  .app-sidebar { position: fixed; inset: 0 auto 0 0; width: 336px; z-index: 30; display: flex; flex-direction: column; padding: 28px; background: #0f172a; border-right: 1px solid rgba(148,163,184,.15); }
  .app-brand { display: flex; align-items: center; gap: 14px; margin: 0 0 38px; }
  .app-brand-icon { width: 57px; height: 57px; display: grid; place-items: center; color: white; border-radius: 17px; background: linear-gradient(135deg,#8b5cf6,#4f46e5); }
  .app-brand strong { display: block; font-size: 22px; letter-spacing: -.5px; }
  .app-brand span { display: block; color: #a78bfa; font-weight: 850; margin-top: 2px; }
  .app-close, .app-mobile-menu { display: none; }
  .app-nav { display: grid; gap: 10px; }
  .app-nav-item { display: flex; align-items: center; gap: 15px; min-height: 54px; padding: 0 16px; color: #cbd5e1; text-decoration: none; border-radius: 16px; font-weight: 800; transition: .18s ease; }
  .app-nav-item:hover { background: rgba(71,85,105,.3); color: white; }
  .app-nav-item.active { color: white; background: linear-gradient(135deg,rgba(109,40,217,.32),rgba(79,70,229,.18)); border: 1px solid rgba(139,92,246,.38); }
  .app-logout { margin-top: auto; min-height: 58px; display: flex; align-items: center; justify-content: center; gap: 11px; border-radius: 16px; color: #fecaca; background: rgba(127,29,29,.15); border: 1px solid rgba(239,68,68,.32); font: inherit; font-weight: 900; cursor: pointer; }
  .app-main-wrap { width: calc(100% - 336px); min-height: 100vh; margin-left: 336px; background: radial-gradient(circle at 75% 0%,rgba(124,58,237,.16),transparent 34%), #020617; }
  .app-topbar { min-height: 110px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 22px 36px; border-bottom: 1px solid rgba(148,163,184,.13); background: rgba(2,6,23,.5); }
  .app-topbar h1 { margin: 0; color: #f8fafc; font-size: clamp(23px,3vw,31px); letter-spacing: -.8px; }
  .app-topbar p { margin: 7px 0 0; color: #94a3b8; }
  .app-build-button { min-height: 51px; border: 0; border-radius: 15px; padding: 0 18px; color: white; background: linear-gradient(135deg,#8b5cf6,#4f46e5); display: inline-flex; align-items: center; gap: 8px; font: inherit; font-weight: 900; cursor: pointer; box-shadow: 0 14px 28px rgba(79,70,229,.22); }
  .app-content { padding: 28px 36px 46px; }
  @media (max-width: 900px) {
    .app-sidebar { transform: translateX(-101%); width: min(336px,86vw); transition: transform .2s ease; box-shadow: 20px 0 70px rgba(0,0,0,.4); }
    .app-sidebar.open { transform: translateX(0); }
    .app-main-wrap { width: 100%; margin-left: 0; }
    .app-mobile-menu { display: grid; place-items: center; position: fixed; z-index: 20; left: 14px; top: 14px; width: 42px; height: 42px; color: white; border: 1px solid rgba(148,163,184,.23); border-radius: 12px; background: #0f172a; cursor: pointer; }
    .app-overlay { position: fixed; z-index: 25; inset: 0; border: 0; background: rgba(2,6,23,.6); }
    .app-close { display: grid; place-items: center; margin-left: auto; color: #cbd5e1; background: transparent; border: 0; cursor: pointer; }
    .app-topbar { padding-left: 68px; }
  }
  @media (max-width: 620px) {
    .app-topbar { align-items: flex-start; flex-direction: column; padding: 18px 18px 18px 68px; }
    .app-content { padding: 18px; }
  }
`;

export default AppLayout;
