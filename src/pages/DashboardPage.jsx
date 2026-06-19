import { Link } from "react-router-dom";
import {
  FileText,
  BarChart3,
  Trophy,
  TrendingUp,
  UploadCloud,
  History,
  Sparkles,
} from "lucide-react";

const DashboardPage = () => {
  const dashboard = {
    totalResumes: 0,
    totalAnalyses: 0,
    bestScore: 0,
    averageScore: 0,
  };

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <p style={styles.badge}>AI Resume Intelligence Platform</p>

          <h1 style={styles.title}>
            Welcome Back 👋
          </h1>

          <p style={styles.subtitle}>
            Track your resumes, ATS scores and AI recommendations from one place.
          </p>
        </div>

        <Link to="/upload-resume" style={styles.uploadBtn}>
          <UploadCloud size={18} />
          Upload Resume
        </Link>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          title="Total Resumes"
          value={dashboard.totalResumes}
          icon={<FileText size={22} />}
        />

        <StatCard
          title="ATS Analyses"
          value={dashboard.totalAnalyses}
          icon={<BarChart3 size={22} />}
        />

        <StatCard
          title="Best Score"
          value={`${dashboard.bestScore}%`}
          icon={<Trophy size={22} />}
        />

        <StatCard
          title="Average Score"
          value={`${dashboard.averageScore}%`}
          icon={<TrendingUp size={22} />}
        />
      </div>

      <div style={styles.quickGrid}>
        <Link to="/upload-resume" style={styles.actionCard}>
          <UploadCloud size={28} />
          <h3 style={styles.actionTitle}>Upload Resume</h3>
          <p style={styles.actionText}>
            Upload a resume for ATS analysis.
          </p>
        </Link>

        <Link to="/ats-analysis" style={styles.actionCard}>
          <BarChart3 size={28} />
          <h3 style={styles.actionTitle}>ATS Analysis</h3>
          <p style={styles.actionText}>
            Compare resume against job description.
          </p>
        </Link>

        <Link to="/ats-history" style={styles.actionCard}>
          <History size={28} />
          <h3 style={styles.actionTitle}>ATS History</h3>
          <p style={styles.actionText}>
            View previous ATS results.
          </p>
        </Link>

        <div style={styles.actionCard}>
          <Sparkles size={28} />
          <h3 style={styles.actionTitle}>AI Recommendations</h3>
          <p style={styles.actionText}>
            Coming in next phase.
          </p>
        </div>
      </div>

      <div style={styles.aiCard}>
        <p style={styles.aiBadge}>AI INSIGHT</p>

        <h2 style={styles.aiTitle}>
          Improve ATS Match Score
        </h2>

        <p style={styles.aiText}>
          Upload your resume and analyze it against a job description to
          identify missing skills, keyword gaps and optimization opportunities.
        </p>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTop}>
        <div>
          <p style={styles.statTitle}>{title}</p>
          <h2 style={styles.statValue}>{value}</h2>
        </div>

        <div style={styles.iconBox}>{icon}</div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    width: "100%",
    color: "#fff",
    boxSizing: "border-box",
  },

  hero: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: "24px",
  },

  badge: {
    margin: 0,
    color: "#a78bfa",
    fontWeight: 900,
    fontSize: "13px",
  },

  title: {
    margin: "8px 0 0",
    fontSize: "clamp(28px,4vw,42px)",
    fontWeight: 950,
    lineHeight: 1.1,
  },

  subtitle: {
    color: "#94a3b8",
    marginTop: "10px",
    fontSize: "14px",
    lineHeight: 1.7,
  },

  uploadBtn: {
    height: "46px",
    padding: "0 18px",
    borderRadius: "14px",
    background: "linear-gradient(90deg,#8b5cf6,#4f46e5)",
    color: "#fff",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 800,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "16px",
  },

  statCard: {
    background: "rgba(15,23,42,.85)",
    border: "1px solid rgba(139,92,246,.18)",
    borderRadius: "20px",
    padding: "20px",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statTitle: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "13px",
  },

  statValue: {
    margin: "8px 0 0",
    fontSize: "32px",
    fontWeight: 950,
  },

  iconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#8b5cf6,#4f46e5)",
    display: "grid",
    placeItems: "center",
  },

  quickGrid: {
    marginTop: "24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
    gap: "16px",
  },

  actionCard: {
    background: "rgba(15,23,42,.85)",
    border: "1px solid rgba(139,92,246,.18)",
    borderRadius: "20px",
    padding: "22px",
    textDecoration: "none",
    color: "#fff",
  },

  actionTitle: {
    marginTop: "14px",
    marginBottom: "6px",
    fontSize: "18px",
    fontWeight: 900,
  },

  actionText: {
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  aiCard: {
    marginTop: "24px",
    background:
      "linear-gradient(135deg, rgba(139,92,246,.20), rgba(79,70,229,.10))",
    border: "1px solid rgba(139,92,246,.22)",
    borderRadius: "24px",
    padding: "28px",
  },

  aiBadge: {
    margin: 0,
    color: "#c4b5fd",
    fontWeight: 900,
    fontSize: "12px",
  },

  aiTitle: {
    marginTop: "12px",
    fontSize: "32px",
    fontWeight: 950,
  },

  aiText: {
    marginTop: "12px",
    color: "#cbd5e1",
    lineHeight: 1.8,
    maxWidth: "700px",
  },
};

export default DashboardPage;