import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Brain,
  Mail,
  Lock,
  Eye,
  EyeOff,
  FileSearch,
  Sparkles,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [screen, setScreen] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const resize = () => {
      setScreen({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const isMobile = screen.width <= 640;
  const isTablet = screen.width <= 1024;
  const isShort = screen.height <= 760;

  const showHero = !isTablet && screen.height >= 720;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await axiosInstance.post("/api/auth/login", form);
      login(response.data.token);
      toast.success("Login successful");
      navigate("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      height: "100vh",
      width: "100vw",
      background: "#020617",
      color: "#ffffff",
      fontFamily: "Inter, system-ui, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? "12px" : "20px",
      position: "relative",
      overflow: "hidden",
      boxSizing: "border-box",
    },
    bg: {
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 12% 20%, rgba(124,58,237,.32), transparent 34%), radial-gradient(circle at 88% 82%, rgba(79,70,229,.25), transparent 38%)",
    },
    container: {
      width: "100%",
      maxWidth: showHero ? "1060px" : "400px",
      display: "grid",
      gridTemplateColumns: showHero ? "1fr 400px" : "1fr",
      gap: showHero ? "44px" : "0",
      alignItems: "center",
      position: "relative",
      zIndex: 1,
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: showHero ? "24px" : "14px",
      justifyContent: showHero ? "flex-start" : "center",
    },
    logoIcon: {
      width: showHero ? "44px" : "38px",
      height: showHero ? "44px" : "38px",
      borderRadius: "13px",
      background: "linear-gradient(135deg,#8b5cf6,#4f46e5)",
      display: "grid",
      placeItems: "center",
      boxShadow: "0 12px 30px rgba(124,58,237,.35)",
      flexShrink: 0,
    },
    logoTitle: {
      fontSize: showHero ? "18px" : "16px",
      fontWeight: 900,
      lineHeight: 1.05,
    },
    logoSubtitle: {
      color: "#a78bfa",
      fontSize: "12px",
      fontWeight: 800,
      marginTop: "2px",
    },
    heroTitle: {
      margin: 0,
      fontSize: isShort ? "42px" : "50px",
      lineHeight: 1.05,
      fontWeight: 950,
      letterSpacing: "-1.3px",
      maxWidth: "600px",
    },
    gradientText: {
      background: "linear-gradient(90deg,#a78bfa,#818cf8)",
      WebkitBackgroundClip: "text",
      color: "transparent",
    },
    desc: {
      marginTop: "14px",
      color: "#cbd5e1",
      fontSize: "14px",
      lineHeight: 1.6,
      maxWidth: "520px",
    },
    features: {
      marginTop: "20px",
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "10px",
      maxWidth: "540px",
    },
    feature: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 12px",
      borderRadius: "14px",
      background: "rgba(15,23,42,.62)",
      border: "1px solid rgba(139,92,246,.18)",
      color: "#e2e8f0",
      fontWeight: 700,
      fontSize: "13px",
    },
    featureIcon: {
      width: "28px",
      height: "28px",
      borderRadius: "999px",
      background: "rgba(139,92,246,.20)",
      color: "#a78bfa",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
    },
    card: {
      width: "100%",
      background: "rgba(15,23,42,.92)",
      border: "1px solid rgba(139,92,246,.25)",
      backdropFilter: "blur(24px)",
      borderRadius: isMobile ? "20px" : "24px",
      padding: isMobile ? "18px" : "24px",
      boxShadow: "0 22px 70px rgba(76,29,149,.34)",
      boxSizing: "border-box",
    },
    cardLogo: {
      display: showHero ? "none" : "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      marginBottom: "14px",
    },
    cardTitle: {
      margin: 0,
      fontSize: isMobile ? "24px" : "28px",
      fontWeight: 900,
      lineHeight: 1.1,
      textAlign: showHero ? "left" : "center",
    },
    cardSubtitle: {
      color: "#94a3b8",
      marginTop: "6px",
      fontSize: isMobile ? "12.5px" : "13.5px",
      lineHeight: 1.45,
      textAlign: showHero ? "left" : "center",
    },
    form: {
      marginTop: "18px",
      display: "grid",
      gap: "11px",
    },
    label: {
      color: "#cbd5e1",
      fontSize: "12px",
      marginBottom: "5px",
      display: "block",
      fontWeight: 800,
    },
    inputBox: {
      height: isMobile ? "40px" : "44px",
      display: "flex",
      alignItems: "center",
      background: "rgba(30,41,59,.92)",
      border: "1px solid #334155",
      borderRadius: "12px",
      padding: "0 12px",
    },
    input: {
      width: "100%",
      background: "transparent",
      border: "none",
      outline: "none",
      color: "#ffffff",
      fontSize: "13px",
      marginLeft: "9px",
      minWidth: 0,
    },
    eyeBtn: {
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: "#94a3b8",
      display: "flex",
      alignItems: "center",
      padding: 0,
    },
    forgot: {
      textAlign: "right",
      color: "#a78bfa",
      fontSize: "12px",
      marginTop: "5px",
      fontWeight: 850,
      cursor: "pointer",
    },
    button: {
      width: "100%",
      height: isMobile ? "42px" : "46px",
      border: "none",
      borderRadius: "12px",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 900,
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.7 : 1,
      background: "linear-gradient(90deg,#8b5cf6,#4f46e5)",
      boxShadow: "0 15px 35px rgba(124,58,237,.30)",
      marginTop: "2px",
    },
    registerText: {
      textAlign: "center",
      color: "#94a3b8",
      marginTop: "12px",
      fontSize: "12.5px",
    },
    link: {
      color: "#a78bfa",
      fontWeight: 900,
      textDecoration: "none",
    },
    footerNote: {
      marginTop: "12px",
      padding: "9px",
      borderRadius: "12px",
      background: "rgba(139,92,246,.10)",
      border: "1px solid rgba(139,92,246,.18)",
      color: "#cbd5e1",
      fontSize: "12px",
      lineHeight: 1.4,
      textAlign: "center",
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
        {showHero && (
          <section>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>
                <Brain size={24} />
              </div>

              <div>
                <div style={styles.logoTitle}>AI Resume</div>
                <div style={styles.logoSubtitle}>Optimizer</div>
              </div>
            </div>

            <h1 style={styles.heroTitle}>
              Optimize your resume.
              <br />
              <span style={styles.gradientText}>Land better jobs.</span>
            </h1>

            <p style={styles.desc}>
              Analyze resumes against job descriptions, calculate ATS scores,
              detect missing skills and get AI-powered recommendations.
            </p>

            <div style={styles.features}>
              <Feature icon={<FileSearch size={13} />} text="ATS Score Analysis" />
              <Feature icon={<Sparkles size={13} />} text="AI Recommendations" />
              <Feature icon={<BarChart3 size={13} />} text="Skill Gap Detection" />
              <Feature icon={<ShieldCheck size={13} />} text="Secure JWT Access" />
            </div>
          </section>
        )}

        <section style={styles.card}>
          <div style={styles.cardLogo}>
            <div style={styles.logoIcon}>
              <Brain size={21} />
            </div>

            <div>
              <div style={styles.logoTitle}>AI Resume</div>
              <div style={styles.logoSubtitle}>Optimizer</div>
            </div>
          </div>

          <h2 style={styles.cardTitle}>Welcome Back</h2>
          <p style={styles.cardSubtitle}>
            Access ATS reports and AI resume recommendations.
          </p>

          <form onSubmit={handleLogin} style={styles.form}>
            <div>
              <label style={styles.label}>Email</label>
              <div style={styles.inputBox}>
                <Mail size={14} color="#64748b" />
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
                <Lock size={14} color="#64748b" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <div style={styles.forgot}>Forgot Password?</div>
            </div>

            <button type="submit" style={styles.button}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div style={styles.registerText}>
            Don&apos;t have an account?{" "}
            <Link to="/register" style={styles.link}>
              Register
            </Link>
          </div>

          <div style={styles.footerNote}>
            Built for developers to improve ATS visibility.
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;