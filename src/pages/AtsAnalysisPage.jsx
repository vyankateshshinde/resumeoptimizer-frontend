import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  CheckCircle2,
  FileSearch,
  FileText,
  Loader2,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import {
  getUserStorageItem,
  setUserStorageItem,
} from "../utils/userStorage";

const AI_ATS_STATE_KEY = "aiAtsAnalysisState";

const safeJsonParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const clampScore = (value) => {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map((item) => String(item).replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|,/)
      .map((item) => item.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeAiResult = (data, selectedResumeId) => ({
  ...data,
  resumeId: Number(data?.resumeId ?? selectedResumeId),
  atsScore: clampScore(data?.atsScore ?? data?.finalScore ?? 0),
  matchedSkills: normalizeArray(data?.matchedSkills),
  missingSkills: normalizeArray(data?.missingSkills),
  strengths: normalizeArray(data?.strengths),
  weaknesses: normalizeArray(data?.weaknesses),
  recommendations: normalizeArray(data?.recommendations),
});

const AtsAnalysisPage = () => {
  const savedState = useMemo(
    () => safeJsonParse(getUserStorageItem(AI_ATS_STATE_KEY), {}),
    []
  );

  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState(savedState?.resumeId || "");
  const [jobDescription, setJobDescription] = useState(
    savedState?.jobDescription || getUserStorageItem("latestJobDescription") || ""
  );
  const [aiResult, setAiResult] = useState(
    savedState?.aiResult
      ? normalizeAiResult(savedState.aiResult, savedState.resumeId)
      : null
  );
  const [loading, setLoading] = useState(false);
  const [resumesLoading, setResumesLoading] = useState(false);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setResumesLoading(true);

        const response = await axiosInstance.get("/api/resume/my-resumes");
        const list = Array.isArray(response.data) ? response.data : [];
        setResumes(list);

        const selectedResume = safeJsonParse(
          getUserStorageItem("selectedResume")
        );
        const requestedId = Number(resumeId || selectedResume?.id || 0);
        const exists = list.some(
          (resume) => Number(resume.id) === requestedId
        );

        if (exists) {
          setResumeId(requestedId);
        } else if (list.length) {
          setResumeId(list[0].id);
          setUserStorageItem("selectedResume", JSON.stringify(list[0]));
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load uploaded resumes");
      } finally {
        setResumesLoading(false);
      }
    };

    fetchResumes();
  }, []);

  useEffect(() => {
    setUserStorageItem(
      AI_ATS_STATE_KEY,
      JSON.stringify({ resumeId, jobDescription, aiResult })
    );
  }, [resumeId, jobDescription, aiResult]);

  const handleResumeChange = (event) => {
    const nextId = Number(event.target.value);
    setResumeId(nextId);
    setAiResult(null);

    const selectedResume = resumes.find(
      (resume) => Number(resume.id) === nextId
    );

    if (selectedResume) {
      setUserStorageItem("selectedResume", JSON.stringify(selectedResume));
    }
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();

    if (!resumeId) {
      toast.error("Please select an uploaded resume");
      return;
    }

    if (!jobDescription.trim()) {
      toast.error("Please paste a job description");
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post("/api/ai-ats/analyze", {
        resumeId: Number(resumeId),
        jobDescription: jobDescription.trim(),
      });

      const normalized = normalizeAiResult(response.data, resumeId);
      setAiResult(normalized);
      setUserStorageItem("latestAiAtsResult", JSON.stringify(normalized));
      setUserStorageItem("latestAtsResult", JSON.stringify(normalized));
      setUserStorageItem("latestJobDescription", jobDescription.trim());
      toast.success("AI ATS analysis completed");
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data ||
          "AI ATS analysis failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedResume = resumes.find(
    (resume) => Number(resume.id) === Number(resumeId)
  );
  const displayScore = clampScore(aiResult?.atsScore);

  return (
    <div style={styles.page}>
      <section style={styles.header}>
        <p style={styles.badge}>AI-POWERED RESUME ANALYSIS</p>
        <h1 style={styles.title}>AI ATS Analysis</h1>
        <p style={styles.subtitle}>
          Analyze your resume against a job description using the AI engine. The
          result focuses on genuine matches, missing requirements, strengths,
          gaps, and practical improvements.
        </p>
      </section>

      <section style={styles.formCard}>
        <div style={styles.formHeading}>
          <div style={styles.iconBox}>
            <Sparkles size={22} />
          </div>
          <div>
            <h2 style={styles.cardTitle}>Analyze with AI</h2>
            <p style={styles.cardText}>
              Select a resume and paste the target job description.
            </p>
          </div>
        </div>

        <form onSubmit={handleAnalyze} style={styles.formGrid}>
          <label style={styles.field}>
            <span>
              <FileText size={15} /> Uploaded Resume
            </span>
            <select
              value={resumeId}
              onChange={handleResumeChange}
              disabled={resumesLoading || !resumes.length}
              style={styles.select}
            >
              <option value="">Select uploaded resume</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.fileName || `Resume #${resume.id}`}
                </option>
              ))}
            </select>
            {selectedResume && (
              <small style={styles.helpText}>
                Selected: {selectedResume.fileName}
              </small>
            )}
          </label>

          <label style={{ ...styles.field, gridColumn: "1 / -1" }}>
            <span>
              <FileSearch size={15} /> Target Job Description
            </span>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the complete job description here..."
              style={styles.textarea}
            />
          </label>

          <button
            type="submit"
            disabled={loading || !resumeId}
            style={styles.button}
          >
            {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
            {loading ? "AI is analyzing..." : "Run AI ATS Analysis"}
          </button>
        </form>
      </section>

      {aiResult ? (
        <section style={styles.results}>
          <div style={styles.scoreCard}>
            <div>
              <p style={styles.cardEyebrow}>ATS MATCH SCORE</p>
              <h2 style={styles.cardTitle}>Target-role readiness</h2>
              <p style={styles.cardText}>
                Score is calculated from matched requirements divided by all
                identified matched and missing requirements.
              </p>
            </div>
            <div
              style={{
                ...styles.scoreCircle,
                background: `conic-gradient(#a78bfa 0 ${displayScore}%, rgba(148,163,184,.18) ${displayScore}% 100%)`,
              }}
              aria-label={`ATS match score ${displayScore}%`}
            >
              <strong>{displayScore}%</strong>
              <span>match</span>
            </div>
          </div>

          <div style={styles.grid}>
            <InsightCard
              icon={<CheckCircle2 size={19} color="#86efac" />}
              title="Matched Requirements"
              items={aiResult.matchedSkills}
              empty="No matched requirements returned."
              tone="green"
            />
            <InsightCard
              icon={<XCircle size={19} color="#fca5a5" />}
              title="Missing Requirements"
              items={aiResult.missingSkills}
              empty="No important missing requirements returned."
              tone="red"
            />
            <InsightCard
              icon={<Target size={19} color="#93c5fd" />}
              title="Strengths"
              items={aiResult.strengths}
              empty="No strengths returned."
            />
            <InsightCard
              icon={<BarChart3 size={19} color="#fcd34d" />}
              title="Improvement Areas"
              items={aiResult.weaknesses}
              empty="No improvement areas returned."
            />
          </div>

          <div style={styles.recommendationCard}>
            <h3 style={styles.insightTitle}>
              <Sparkles size={19} color="#c4b5fd" /> AI Recommendations
            </h3>
            <BulletList
              items={aiResult.recommendations}
              empty="No recommendations returned."
            />
          </div>
        </section>
      ) : (
        <section style={styles.emptyState}>
          <Sparkles size={28} color="#a78bfa" />
          <h2>AI ATS results will appear here</h2>
          <p>
            Run the analysis to review matched requirements, missing terms,
            strengths, and recommendations.
          </p>
        </section>
      )}
    </div>
  );
};

const BulletList = ({ items, empty }) => (
  <ul style={styles.list}>
    {items?.length ? (
      items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)
    ) : (
      <li>{empty}</li>
    )}
  </ul>
);

const InsightCard = ({ icon, title, items, empty, tone }) => (
  <div
    style={{
      ...styles.insightCard,
      ...(tone === "green" ? styles.greenCard : {}),
      ...(tone === "red" ? styles.redCard : {}),
    }}
  >
    <h3 style={styles.insightTitle}>
      {icon}
      {title}
    </h3>
    <BulletList items={items} empty={empty} />
  </div>
);

const styles = {
  page: { width: "100%", color: "#f8fafc", boxSizing: "border-box" },
  header: { marginBottom: 24 },
  badge: {
    margin: 0,
    color: "#a78bfa",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: ".1em",
  },
  title: { margin: "7px 0 0", fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "-1px" },
  subtitle: { margin: "10px 0 0", color: "#94a3b8", maxWidth: 760, lineHeight: 1.65 },
  formCard: {
    background: "rgba(15,23,42,.78)",
    border: "1px solid rgba(148,163,184,.16)",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 20px 45px rgba(2,6,23,.18)",
  },
  formHeading: { display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 18 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    display: "grid",
    placeItems: "center",
    color: "white",
    background: "linear-gradient(135deg,#8b5cf6,#4f46e5)",
  },
  cardTitle: { margin: 0, color: "#fff", fontSize: 19 },
  cardText: { margin: "5px 0 0", color: "#94a3b8", lineHeight: 1.5, fontSize: 13 },
  formGrid: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14 },
  field: { display: "grid", gap: 7, color: "#cbd5e1", fontSize: 12, fontWeight: 800 },
  select: {
    minHeight: 45,
    borderRadius: 11,
    border: "1px solid rgba(148,163,184,.25)",
    color: "#f8fafc",
    background: "rgba(30,41,59,.9)",
    padding: "0 11px",
    font: "inherit",
  },
  textarea: {
    minHeight: 165,
    width: "100%",
    resize: "vertical",
    borderRadius: 11,
    border: "1px solid rgba(148,163,184,.25)",
    color: "#f8fafc",
    background: "rgba(30,41,59,.9)",
    padding: 12,
    font: "inherit",
    lineHeight: 1.55,
    outline: "none",
    boxSizing: "border-box",
  },
  helpText: { color: "#94a3b8", fontWeight: 500 },
  button: {
    gridColumn: "1 / -1",
    minHeight: 48,
    border: 0,
    borderRadius: 13,
    color: "white",
    background: "linear-gradient(135deg,#8b5cf6,#4f46e5)",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    font: "inherit",
    fontWeight: 850,
    cursor: "pointer",
  },
  results: { display: "grid", gap: 16, marginTop: 20 },
  scoreCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    padding: 22,
    borderRadius: 22,
    background: "linear-gradient(135deg,rgba(76,29,149,.3),rgba(15,23,42,.83))",
    border: "1px solid rgba(167,139,250,.27)",
  },
  cardEyebrow: { color: "#c4b5fd", fontSize: 11, letterSpacing: ".1em", fontWeight: 900, margin: 0 },
  scoreCircle: {
    width: 116,
    height: 116,
    flex: "0 0 auto",
    borderRadius: "50%",
    display: "grid",
    placeContent: "center",
    textAlign: "center",
    boxShadow: "0 0 0 8px rgba(139,92,246,.1)",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 },
  insightCard: {
    minWidth: 0,
    background: "rgba(15,23,42,.73)",
    border: "1px solid rgba(148,163,184,.15)",
    borderRadius: 18,
    padding: 16,
  },
  greenCard: { borderColor: "rgba(34,197,94,.24)" },
  redCard: { borderColor: "rgba(239,68,68,.24)" },
  insightTitle: { display: "flex", alignItems: "center", gap: 8, margin: 0, color: "#f8fafc", fontSize: 14 },
  list: { margin: "11px 0 0", paddingLeft: 20, color: "#cbd5e1", lineHeight: 1.6, fontSize: 13 },
  recommendationCard: {
    background: "rgba(15,23,42,.73)",
    border: "1px solid rgba(167,139,250,.24)",
    borderRadius: 18,
    padding: 16,
  },
  emptyState: {
    marginTop: 20,
    padding: 38,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    borderRadius: 22,
    border: "1px dashed rgba(167,139,250,.34)",
    color: "#94a3b8",
  },
};

export default AtsAnalysisPage;
