import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Brain,
  LayoutDashboard,
  UploadCloud,
  BarChart3,
  Sparkles,
  FileText,
  LogOut,
  Menu,
  History,
  X,
  Hammer,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const AppLayout = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const resize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const isMobile = width <= 900;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Resume Builder", path: "/resume-builder", icon: Hammer },
    { name: "Upload Resume", path: "/upload-resume", icon: UploadCloud },
    { name: "ATS Analysis", path: "/ats-analysis", icon: BarChart3 },
    { name: "ATS History", path: "/ats-history", icon: History },
    { name: "AI Recommendations", path: "/ai-recommendations", icon: Sparkles },
    { name: "Resume Versions", path: "/resume-versions", icon: FileText },
  ];

  const styles = {
    page: {
      minHeight: "100vh",
      width: "100%",
      background: "#020617",
      color: "#ffffff",
      fontFamily: "Inter, system-ui, sans-serif",
    },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.6)",
      zIndex: 20,
      display: isMobile && open ? "block" : "none",
    },
    sidebar: {
      width: "260px",
      minHeight: "100vh",
      background: "rgba(15,23,42,.98)",
      borderRight: "1px solid rgba(139,92,246,.18)",
      padding: "22px",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 30,
      boxSizing: "border-box",
      transform: isMobile ? (open ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
      transition: "0.25s ease",
    },
    logoBox: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "30px",
    },
    logoIcon: {
      width: "44px",
      height: "44px",
      borderRadius: "14px",
      background: "linear-gradient(135deg,#8b5cf6,#4f46e5)",
      display: "grid",
      placeItems: "center",
    },
    logoTitle: {
      margin: 0,
      fontSize: "18px",
      fontWeight: 900,
    },
    logoSub: {
      margin: "2px 0 0",
      color: "#a78bfa",
      fontSize: "13px",
      fontWeight: 800,
    },
    closeBtn: {
      marginLeft: "auto",
      display: isMobile ? "grid" : "none",
      placeItems: "center",
      width: "34px",
      height: "34px",
      borderRadius: "10px",
      border: "1px solid rgba(139,92,246,.22)",
      background: "rgba(30,41,59,.7)",
      color: "#fff",
      cursor: "pointer",
    },
    nav: {
      display: "grid",
      gap: "9px",
    },
    navLink: {
      display: "flex",
      alignItems: "center",
      gap: "11px",
      padding: "12px 13px",
      borderRadius: "13px",
      color: "#cbd5e1",
      textDecoration: "none",
      fontWeight: 750,
      fontSize: "14px",
    },
    navLinkActive: {
      background: "linear-gradient(90deg, rgba(139,92,246,.22), rgba(79,70,229,.16))",
      color: "#ffffff",
      border: "1px solid rgba(139,92,246,.28)",
    },
    logoutBtn: {
      marginTop: "auto",
      height: "46px",
      border: "1px solid rgba(239,68,68,.25)",
      borderRadius: "13px",
      background: "rgba(239,68,68,.10)",
      color: "#fecaca",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      fontWeight: 850,
      cursor: "pointer",
    },
    main: {
      marginLeft: isMobile ? 0 : "260px",
      width: isMobile ? "100%" : "calc(100% - 260px)",
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top right, rgba(124,58,237,.16), transparent 30%), #020617",
      boxSizing: "border-box",
    },
    header: {
      minHeight: isMobile ? "74px" : "86px",
      borderBottom: "1px solid rgba(139,92,246,.16)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "14px",
      padding: isMobile ? "14px 16px" : "0 28px",
      background: "rgba(2,6,23,.78)",
      backdropFilter: "blur(18px)",
      position: "sticky",
      top: 0,
      zIndex: 10,
      boxSizing: "border-box",
    },
    menuBtn: {
      display: isMobile ? "grid" : "none",
      placeItems: "center",
      border: "none",
      background: "rgba(15,23,42,.9)",
      color: "#ffffff",
      borderRadius: "12px",
      width: "42px",
      height: "42px",
      cursor: "pointer",
      flexShrink: 0,
    },
    headerText: {
      minWidth: 0,
      flex: 1,
    },
    headerTitle: {
      margin: 0,
      fontSize: isMobile ? "16px" : "21px",
      fontWeight: 900,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    headerSub: {
      margin: "4px 0 0",
      color: "#94a3b8",
      fontSize: isMobile ? "12px" : "13px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    ctaBtn: {
      height: "40px",
      padding: "0 14px",
      borderRadius: "12px",
      background: "linear-gradient(90deg,#8b5cf6,#4f46e5)",
      color: "#ffffff",
      textDecoration: "none",
      display: isMobile ? "none" : "flex",
      alignItems: "center",
      fontWeight: 850,
      fontSize: "13px",
      flexShrink: 0,
    },
    content: {
      padding: isMobile ? "16px" : "26px",
      boxSizing: "border-box",
      width: "100%",
      maxWidth: "100%",
      overflowX: "hidden",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay} onClick={() => setOpen(false)} />

      <aside style={styles.sidebar}>
        <div style={styles.logoBox}>
          <div style={styles.logoIcon}>
            <Brain size={24} />
          </div>

          <div>
            <h2 style={styles.logoTitle}>AI Resume</h2>
            <p style={styles.logoSub}>Optimizer</p>
          </div>

          <button style={styles.closeBtn} onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                })}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <button style={styles.menuBtn} onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>

          <div style={styles.headerText}>
            <h1 style={styles.headerTitle}>Resume Intelligence Platform</h1>
            <p style={styles.headerSub}>Analyze, optimize and improve resumes with AI.</p>
          </div>

          <Link to="/resume-builder" style={styles.ctaBtn}>
            Build Resume
          </Link>
        </header>

        <section style={styles.content}>{children}</section>
      </main>
    </div>
  );
};

export default AppLayout;