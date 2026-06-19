import { Link } from "react-router-dom";
import {
  Sparkles,
  Target,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

const AiRecommendationsPage = () => {
  const latestResult = JSON.parse(
    localStorage.getItem("latestAtsResult") || "null"
  );

  const score = latestResult?.finalScore ?? 0;
  const matchedSkills = latestResult?.matchedSkills || [];
  const missingSkills = latestResult?.missingSkills || [];
  const feedback =
    latestResult?.feedback ||
    "Run ATS analysis first to receive personalized AI recommendations.";

  const roadmapSkills =
    missingSkills.length > 0 ? missingSkills : ["AWS", "Docker", "CI/CD"];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p style={styles.badge}>AI Recommendations</p>
        <h1 style={styles.title}>Resume Improvement Roadmap</h1>
        <p style={styles.subtitle}>
          Recommendations are generated from your latest ATS analysis result.
        </p>
      </div>

      {!latestResult && (
        <div style={styles.emptyBox}>
          <Sparkles size={24} color="#c4b5fd" />
          <div>
            <h3 style={styles.emptyTitle}>No ATS analysis found</h3>
            <p style={styles.emptyText}>
              Run ATS analysis first to generate personalized recommendations.
            </p>
            <Link to="/ats-analysis" style={styles.button}>
              Run ATS Analysis <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        <div style={styles.scoreCard}>
          <Target size={26} color="#a78bfa" />
          <h2 style={styles.score}>{score}%</h2>
          <p style={styles.scoreText}>Latest ATS Match Score</p>

          <Link to="/ats-analysis" style={styles.button}>
            Run New Analysis <ArrowRight size={16} />
          </Link>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <CheckCircle2 size={20} color="#86efac" />
            Matched Skills
          </h3>

          <div style={styles.chips}>
            {matchedSkills.length > 0 ? (
              matchedSkills.map((skill) => (
                <span key={skill} style={styles.greenChip}>
                  {skill}
                </span>
              ))
            ) : (
              <span style={styles.emptyChip}>No matched skills yet</span>
            )}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <XCircle size={20} color="#fca5a5" />
            Missing Skills
          </h3>

          <div style={styles.chips}>
            {missingSkills.length > 0 ? (
              missingSkills.map((skill) => (
                <span key={skill} style={styles.redChip}>
                  {skill}
                </span>
              ))
            ) : (
              <span style={styles.greenChip}>No missing skills found</span>
            )}
          </div>
        </div>
      </div>

      <div style={styles.bottomGrid}>
        <div style={styles.largeCard}>
          <h3 style={styles.cardTitle}>
            <Sparkles size={20} color="#c4b5fd" />
            AI Resume Recommendations
          </h3>

          <p style={styles.feedbackText}>{feedback}</p>

          {missingSkills.length > 0 && (
            <ul style={styles.list}>
              <li>
                Add practical resume bullets around{" "}
                <b>{missingSkills.slice(0, 3).join(", ")}</b>.
              </li>
              <li>
                Improve keyword alignment by adding missing skills only if you
                can justify them through real project experience.
              </li>
              <li>
                Add measurable outcomes such as performance improvement,
                reduced response time, deployment impact, or automation benefits.
              </li>
            </ul>
          )}
        </div>

        <div style={styles.largeCard}>
          <h3 style={styles.cardTitle}>
            <BookOpen size={20} color="#c4b5fd" />
            Learning Roadmap
          </h3>

          <div style={styles.roadmap}>
            <RoadmapItem
              title="Priority 1"
              text={`Learn ${roadmapSkills[0]} and implement it in a practical project.`}
            />
            <RoadmapItem
              title="Priority 2"
              text={`Practice ${roadmapSkills[1]} with hands-on implementation.`}
            />
            <RoadmapItem
              title="Priority 3"
              text={`Add ${roadmapSkills[2]} to resume only after real implementation.`}
            />
          </div>
        </div>
      </div>

      <div style={styles.tipCard}>
        <Lightbulb size={22} color="#facc15" />
        <div>
          <h3 style={styles.tipTitle}>Next Best Action</h3>
          <p style={styles.tipText}>
            Run ATS analysis for your latest resume, improve missing keywords,
            then analyze again to increase your score.
          </p>
        </div>
      </div>
    </div>
  );
};

const RoadmapItem = ({ title, text }) => (
  <div style={styles.roadmapItem}>
    <h4 style={styles.roadmapTitle}>{title}</h4>
    <p style={styles.roadmapText}>{text}</p>
  </div>
);

const styles = {
  page: {
    width: "100%",
    color: "#fff",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "22px",
  },
  badge: {
    margin: 0,
    color: "#a78bfa",
    fontSize: "13px",
    fontWeight: 900,
  },
  title: {
    margin: "7px 0 0",
    fontSize: "clamp(24px, 4vw, 36px)",
    fontWeight: 950,
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: 1.6,
    maxWidth: "760px",
  },
  emptyBox: {
    marginBottom: "18px",
    display: "flex",
    gap: "14px",
    background: "rgba(139,92,246,.10)",
    border: "1px solid rgba(139,92,246,.22)",
    borderRadius: "22px",
    padding: "20px",
    boxSizing: "border-box",
  },
  emptyTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "17px",
    fontWeight: 900,
  },
  emptyText: {
    margin: "6px 0 12px",
    color: "#cbd5e1",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },
  scoreCard: {
    background:
      "linear-gradient(135deg, rgba(139,92,246,.22), rgba(79,70,229,.12))",
    border: "1px solid rgba(139,92,246,.25)",
    borderRadius: "22px",
    padding: "22px",
    boxSizing: "border-box",
  },
  score: {
    margin: "14px 0 0",
    fontSize: "44px",
    fontWeight: 950,
  },
  scoreText: {
    margin: "6px 0 0",
    color: "#cbd5e1",
    fontSize: "13px",
  },
  button: {
    marginTop: "18px",
    height: "40px",
    padding: "0 14px",
    borderRadius: "12px",
    background: "linear-gradient(90deg,#8b5cf6,#4f46e5)",
    color: "#fff",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 900,
    fontSize: "13px",
  },
  card: {
    background: "rgba(15,23,42,.88)",
    border: "1px solid rgba(139,92,246,.18)",
    borderRadius: "22px",
    padding: "22px",
    boxSizing: "border-box",
  },
  cardTitle: {
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontSize: "17px",
    fontWeight: 900,
  },
  chips: {
    marginTop: "16px",
    display: "flex",
    flexWrap: "wrap",
    gap: "9px",
  },
  greenChip: {
    padding: "8px 11px",
    borderRadius: "999px",
    background: "rgba(34,197,94,.12)",
    border: "1px solid rgba(34,197,94,.25)",
    color: "#86efac",
    fontSize: "12px",
    fontWeight: 800,
  },
  redChip: {
    padding: "8px 11px",
    borderRadius: "999px",
    background: "rgba(239,68,68,.12)",
    border: "1px solid rgba(239,68,68,.25)",
    color: "#fca5a5",
    fontSize: "12px",
    fontWeight: 800,
  },
  emptyChip: {
    padding: "8px 11px",
    borderRadius: "999px",
    background: "rgba(148,163,184,.10)",
    border: "1px solid rgba(148,163,184,.20)",
    color: "#cbd5e1",
    fontSize: "12px",
    fontWeight: 800,
  },
  bottomGrid: {
    marginTop: "18px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  largeCard: {
    background: "rgba(15,23,42,.88)",
    border: "1px solid rgba(139,92,246,.18)",
    borderRadius: "22px",
    padding: "22px",
    boxSizing: "border-box",
  },
  feedbackText: {
    margin: "16px 0 0",
    color: "#cbd5e1",
    fontSize: "13px",
    lineHeight: 1.8,
  },
  list: {
    margin: "16px 0 0",
    paddingLeft: "20px",
    color: "#cbd5e1",
    fontSize: "13px",
    lineHeight: 1.8,
  },
  roadmap: {
    marginTop: "16px",
    display: "grid",
    gap: "12px",
  },
  roadmapItem: {
    background: "rgba(30,41,59,.65)",
    border: "1px solid rgba(148,163,184,.12)",
    borderRadius: "16px",
    padding: "14px",
  },
  roadmapTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "14px",
    fontWeight: 900,
  },
  roadmapText: {
    margin: "6px 0 0",
    color: "#94a3b8",
    fontSize: "12.5px",
    lineHeight: 1.6,
  },
  tipCard: {
    marginTop: "18px",
    display: "flex",
    gap: "14px",
    background: "rgba(250,204,21,.08)",
    border: "1px solid rgba(250,204,21,.22)",
    borderRadius: "22px",
    padding: "20px",
    boxSizing: "border-box",
  },
  tipTitle: {
    margin: 0,
    color: "#fef3c7",
    fontSize: "16px",
    fontWeight: 900,
  },
  tipText: {
    margin: "6px 0 0",
    color: "#fde68a",
    fontSize: "13px",
    lineHeight: 1.6,
  },
};

export default AiRecommendationsPage;