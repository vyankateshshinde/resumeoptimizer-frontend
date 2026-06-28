import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Brain,
  Mail,
  Lock,
  FileSearch,
  WandSparkles,
  BarChart3,
  Eye,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { purgeLegacySharedWorkspaceCache } from "../utils/userStorage.js";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const resize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const isMobile = width <= 640;
  const isTablet = width <= 1024;
  const isShort = height <= 740;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post("/api/auth/login", form);
      purgeLegacySharedWorkspaceCache();
      login(response.data.token);
      toast.success("Login successful");
      navigate("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    }
  };

  const styles = {
    page: {
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      background: "#020617",
      color: "#ffffff",
      fontFamily: "Inter, system-ui, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "14px" : isTablet ? "22px" : "36px 64px",
      position: "relative",
    },
    bg: {
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 10% 20%, rgba(124,58,237,.32), transparent 34%), radial-gradient(circle at 90% 80%, rgba(79,70,229,.28), transparent 38%)",
    },
    container: {
      width: "100%",
      maxWidth: "1280px",
      height: "100%",
      maxHeight: isMobile ? "none" : "760px",
      display: "grid",
      gridTemplateColumns: isTablet ? "1fr" : "1.08fr 0.92fr",
      gap: isMobile ? "12px" : isTablet ? "22px" : "64px",
      alignItems: "center",
      position: "relative",
      zIndex: 1,
    },
    left: {
      display: isMobile ? "block" : "block",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: isMobile ? "12px" : isShort ? "22px" : "44px",
    },
    logoIcon: {
      width: isMobile ? "38px" : "50px",
      height: isMobile ? "38px" : "50px",
      borderRadius: isMobile ? "12px" : "16px",
      background: "linear-gradient(135deg,#8b5cf6,#4f46e5)",
      display: "grid",
      placeItems: "center",
      boxShadow: "0 14px 35px rgba(124,58,237,.35)",
      flexShrink: 0,
    },
    logoTitle: {
      fontSize: isMobile ? "15px" : "20px",
      fontWeight: 900,
      lineHeight: 1.05,
    },
    logoSubtitle: {
      color: "#a78bfa",
      fontSize: isMobile ? "12px" : "15px",
      fontWeight: 800,
      marginTop: "3px",
    },
    heroTitle: {
      margin: 0,
      fontSize: isMobile ? "30px" : isTablet ? "42px" : isShort ? "54px" : "66px",
      lineHeight: 1.06,
      fontWeight: 950,
      letterSpacing: "-1.6px",
      maxWidth: "760px",
    },
    gradientText: {
      background: "linear-gradient(90deg,#a78bfa,#818cf8)",
      WebkitBackgroundClip: "text",
      color: "transparent",
    },
    desc: {
      marginTop: isMobile ? "10px" : isShort ? "16px" : "24px",
      color: "#cbd5e1",
      fontSize: isMobile ? "13px" : "17px",
      lineHeight: isMobile ? 1.45 : 1.7,
      maxWidth: "650px",
    },
    features: {
      marginTop: isMobile ? "12px" : isShort ? "20px" : "34px",
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(2, 1fr)",
      gap: isMobile ? "8px" : "14px",
      maxWidth: "680px",
    },
    feature: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? "7px" : "12px",
      padding: isMobile ? "8px 9px" : "14px 16px",
      borderRadius: isMobile ? "12px" : "18px",
      background: "rgba(15,23,42,.62)",
      border: "1px solid rgba(139,92,246,.18)",
      color: "#e2e8f0",
      fontWeight: 700,
      fontSize: isMobile ? "11.5px" : "15px",
      minWidth: 0,
    },
    featureIcon: {
      width: isMobile ? "24px" : "34px",
      height: isMobile ? "24px" : "34px",
      borderRadius: "999px",
      background: "rgba(139,92,246,.20)",
      color: "#a78bfa",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
    },
    cardWrapper: {
      width: "100%",
      display: "flex",
      justifyContent: isTablet ? "center" : "flex-end",
    },
    card: {
      width: "100%",
      maxWidth: isMobile ? "100%" : "500px",
      background: "rgba(15,23,42,.88)",
      border: "1px solid rgba(139,92,246,.25)",
      backdropFilter: "blur(24px)",
      borderRadius: isMobile ? "20px" : "32px",
      padding: isMobile ? "18px" : isShort ? "30px" : "44px",
      boxShadow: "0 25px 80px rgba(76,29,149,.38)",
    },
    cardTitle: {
      margin: 0,
      fontSize: isMobile ? "23px" : "34px",
      fontWeight: 900,
      lineHeight: 1.1,
    },
    cardSubtitle: {
      color: "#94a3b8",
      marginTop: isMobile ? "6px" : "12px",
      fontSize: isMobile ? "12.5px" : "16px",
    },
    form: {
      marginTop: isMobile ? "16px" : "32px",
      display: "grid",
      gap: isMobile ? "12px" : "22px",
    },
    label: {
      color: "#cbd5e1",
      fontSize: isMobile ? "12px" : "15px",
      marginBottom: isMobile ? "6px" : "10px",
      display: "block",
    },
    inputBox: {
      height: isMobile ? "42px" : "58px",
      display: "flex",
      alignItems: "center",
      background: "rgba(30,41,59,.92)",
      border: "1px solid #334155",
      borderRadius: isMobile ? "12px" : "16px",
      padding: isMobile ? "0 12px" : "0 18px",
    },
    input: {
      width: "100%",
      background: "transparent",
      border: "none",
      outline: "none",
      color: "#ffffff",
      fontSize: isMobile ? "13px" : "16px",
      marginLeft: "12px",
      minWidth: 0,
    },
    forgot: {
      textAlign: "right",
      color: "#a78bfa",
      fontSize: isMobile ? "12px" : "14px",
      marginTop: isMobile ? "6px" : "10px",
    },
    button: {
      width: "100%",
      height: isMobile ? "44px" : "58px",
      border: "none",
      borderRadius: isMobile ? "12px" : "16px",
      color: "#ffffff",
      fontSize: isMobile ? "15px" : "18px",
      fontWeight: 900,
      cursor: "pointer",
      background: "linear-gradient(90deg,#8b5cf6,#4f46e5)",
      boxShadow: "0 18px 40px rgba(124,58,237,.38)",
    },
    register: {
      textAlign: "center",
      color: "#94a3b8",
      marginTop: isMobile ? "14px" : "28px",
      fontSize: isMobile ? "12.5px" : "15px",
    },
    registerLink: {
      color: "#a78bfa",
      fontWeight: 900,
      textDecoration: "none",
    },
  };

  const Feature = ({ icon, text }) => (
    <div style={styles.feature}>
      <div style={styles.featureIcon}>{icon}</div>
      <span>{text}</span>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.bg}></div>

      <main style={styles.container}>
        <section style={styles.left}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <Brain size={isMobile ? 22 : 28} />
            </div>

            <div>
              <div style={styles.logoTitle}>AI Resume</div>
              <div style={styles.logoSubtitle}>Optimizer</div>
            </div>
          </div>

          <h1 style={styles.heroTitle}>
            Optimize Your Resume.
            <br />
            <span style={styles.gradientText}>Get Your Dream Job.</span>
          </h1>

          <p style={styles.desc}>
            AI-powered resume analysis, ATS scoring, skill gap detection and
            personalized recommendations to help you stand out.
          </p>

          <div style={styles.features}>
            <Feature icon={<FileSearch size={isMobile ? 13 : 17} />} text="ATS Score Analysis" />
            <Feature icon={<WandSparkles size={isMobile ? 13 : 17} />} text="AI Recommendations" />
            <Feature icon={<BarChart3 size={isMobile ? 13 : 17} />} text="Skill Gap Analysis" />
            <Feature icon={<Lock size={isMobile ? 13 : 17} />} text="Secure Login" />
          </div>
        </section>

        <section style={styles.cardWrapper}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Welcome Back!</h2>
            <p style={styles.cardSubtitle}>Sign in to continue your account</p>

            <form onSubmit={handleLogin} style={styles.form}>
              <div>
                <label style={styles.label}>Email</label>
                <div style={styles.inputBox}>
                  <Mail size={isMobile ? 15 : 18} color="#64748b" />
                  <input
                    name="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={form.email}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Password</label>
                <div style={styles.inputBox}>
                  <Lock size={isMobile ? 15 : 18} color="#64748b" />
                  <input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                  <Eye size={isMobile ? 15 : 17} color="#64748b" />
                </div>

                <div style={styles.forgot}>Forgot Password?</div>
              </div>

              <button type="submit" style={styles.button}>
                Sign In
              </button>
            </form>

            <div style={styles.register}>
              Don&apos;t have an account?{" "}
              <Link to="/register" style={styles.registerLink}>
                Register
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;