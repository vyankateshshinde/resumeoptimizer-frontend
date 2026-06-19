import { Link } from "react-router-dom";
import { UploadCloud, BarChart3 } from "lucide-react";

const DashboardHeader = () => {
  return (
    <div style={styles.wrapper}>
      <div>
        <p style={styles.badge}>AI Resume Intelligence</p>
        <h1 style={styles.title}>Dashboard Overview</h1>
        <p style={styles.subtitle}>
          Track resumes, ATS scores, skill gaps and optimization progress.
        </p>
      </div>

      <div style={styles.actions}>
        <Link to="/upload-resume" style={styles.primaryBtn}>
          <UploadCloud size={16} />
          Upload Resume
        </Link>

        <Link to="/ats-analysis" style={styles.secondaryBtn}>
          <BarChart3 size={16} />
          ATS Analysis
        </Link>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "22px",
    flexWrap: "wrap",
  },
  badge: {
    margin: 0,
    color: "#a78bfa",
    fontSize: "12px",
    fontWeight: 900,
  },
  title: {
    margin: "5px 0 0",
    fontSize: "clamp(24px, 4vw, 34px)",
    color: "#fff",
    fontWeight: 950,
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "7px 0 0",
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: 1.6,
    maxWidth: "620px",
  },
  actions: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
  },
  primaryBtn: {
    height: "40px",
    padding: "0 14px",
    borderRadius: "12px",
    background: "linear-gradient(90deg,#8b5cf6,#4f46e5)",
    color: "#fff",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontWeight: 900,
    fontSize: "13px",
  },
  secondaryBtn: {
    height: "40px",
    padding: "0 14px",
    borderRadius: "12px",
    background: "rgba(15,23,42,.9)",
    border: "1px solid rgba(139,92,246,.22)",
    color: "#fff",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontWeight: 900,
    fontSize: "13px",
  },
};

export default DashboardHeader;