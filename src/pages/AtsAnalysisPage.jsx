import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileSearch,
  Target,
  Loader2,
  FileText,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";

const ATS_PAGE_STATE_KEY = "atsAnalysisPageState";

const safeJsonParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeAtsResult = (data, selectedResumeId) => {
  if (!data) return null;

  return {
    ...data,
    resumeId: Number(data.resumeId ?? selectedResumeId),
    finalScore: data.finalScore ?? data.atsScore ?? 0,
    skillScore: data.skillScore ?? 0,
    keywordScore: data.keywordScore ?? 0,
    atsScore: data.atsScore ?? data.finalScore ?? 0,
    matchedSkills: normalizeArray(data.matchedSkills),
    missingSkills: normalizeArray(data.missingSkills),
    strengths: normalizeArray(data.strengths),
    weaknesses: normalizeArray(data.weaknesses),
    recommendations: normalizeArray(data.recommendations),
    feedback: data.feedback || "",
  };
};

const getInitialState = () => {
  const pageState = safeJsonParse(localStorage.getItem(ATS_PAGE_STATE_KEY));
  const savedResume = safeJsonParse(localStorage.getItem("selectedResume"));
  const latestRuleResult = safeJsonParse(localStorage.getItem("latestRuleAtsResult"));
  const latestAtsResult = safeJsonParse(localStorage.getItem("latestAtsResult"));
  const latestAiResult = safeJsonParse(localStorage.getItem("latestAiAtsResult"));
  const latestJobDescription = localStorage.getItem("latestJobDescription") || "";

  const fallbackResult = latestRuleResult || latestAtsResult || null;

  return {
    resumeId:
      pageState?.resumeId ||
      fallbackResult?.resumeId ||
      latestAiResult?.resumeId ||
      savedResume?.id ||
      "",
    jobDescription:
      pageState?.jobDescription || latestJobDescription || "",
    result: pageState?.result || normalizeAtsResult(fallbackResult, savedResume?.id),
    aiResult: pageState?.aiResult || normalizeAtsResult(latestAiResult, savedResume?.id),
  };
};

const saveAtsPageState = ({ resumeId, jobDescription, result, aiResult }) => {
  localStorage.setItem(
    ATS_PAGE_STATE_KEY,
    JSON.stringify({
      resumeId,
      jobDescription,
      result,
      aiResult,
    })
  );

  if (jobDescription !== undefined) {
    localStorage.setItem("latestJobDescription", jobDescription || "");
  }

  if (result) {
    localStorage.setItem("latestRuleAtsResult", JSON.stringify(result));
    localStorage.setItem("latestAtsResult", JSON.stringify(result));
  }

  if (aiResult) {
    localStorage.setItem("latestAiAtsResult", JSON.stringify(aiResult));
  }
};

const AtsAnalysisPage = () => {
  const initialState = useMemo(() => getInitialState(), []);

  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState(initialState.resumeId);
  const [jobDescription, setJobDescription] = useState(initialState.jobDescription);
  const [result, setResult] = useState(initialState.result);
  const [aiResult, setAiResult] = useState(initialState.aiResult);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [resumesLoading, setResumesLoading] = useState(false);

  const fetchLatestAtsResult = async (selectedResumeId) => {
    if (!selectedResumeId) return;

    try {
      const response = await axiosInstance.get(
        `/api/ats/history/latest/${selectedResumeId}`
      );

      const latest = response.data;
      const latestResult = normalizeAtsResult(latest, selectedResumeId);
      const latestJd = latest.jobDescription || jobDescription || "";

      setJobDescription(latestJd);
      setResult(latestResult);

      saveAtsPageState({
        resumeId: selectedResumeId,
        jobDescription: latestJd,
        result: latestResult,
        aiResult,
      });
    } catch (error) {
      console.log("No previous ATS result found for this resume");
    }
  };

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setResumesLoading(true);
        const response = await axiosInstance.get("/api/resume/my-resumes");
        const list = Array.isArray(response.data) ? response.data : [];

        setResumes(list);

        if (resumeId) {
          const selectedResume = list.find(
            (resume) => Number(resume.id) === Number(resumeId)
          );

          if (selectedResume) {
            localStorage.setItem("selectedResume", JSON.stringify(selectedResume));
          }

          return;
        }

        const savedResume = safeJsonParse(localStorage.getItem("selectedResume"));

        if (
          savedResume?.id &&
          list.some((resume) => Number(resume.id) === Number(savedResume.id))
        ) {
          setResumeId(savedResume.id);
          saveAtsPageState({
            resumeId: savedResume.id,
            jobDescription,
            result,
            aiResult,
          });
          return;
        }

        if (list.length > 0) {
          setResumeId(list[0].id);
          localStorage.setItem("selectedResume", JSON.stringify(list[0]));
          saveAtsPageState({
            resumeId: list[0].id,
            jobDescription,
            result,
            aiResult,
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load resumes");
      } finally {
        setResumesLoading(false);
      }
    };

    fetchResumes();
  }, []);

  const handleResumeChange = async (e) => {
    const selectedId = Number(e.target.value);
    const selectedResume = resumes.find((resume) => Number(resume.id) === selectedId);

    setResumeId(selectedId);
    setResult(null);
    setAiResult(null);
    setJobDescription("");

    if (selectedResume) {
      localStorage.setItem("selectedResume", JSON.stringify(selectedResume));
    }

    saveAtsPageState({
      resumeId: selectedId,
      jobDescription: "",
      result: null,
      aiResult: null,
    });

    await fetchLatestAtsResult(selectedId);
  };

  const handleJobDescriptionChange = (e) => {
    const value = e.target.value;
    setJobDescription(value);

    saveAtsPageState({
      resumeId,
      jobDescription: value,
      result,
      aiResult,
    });
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!resumeId) {
      toast.error("Please select a resume");
      return;
    }

    if (!jobDescription.trim()) {
      toast.error("Please paste job description");
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post(`/api/ats/${resumeId}`, {
        jobDescription,
      });

      const normalizedResult = normalizeAtsResult(response.data, resumeId);
      setResult(normalizedResult);

      saveAtsPageState({
        resumeId,
        jobDescription,
        result: normalizedResult,
        aiResult,
      });

      toast.success("Rule-Based ATS Analysis Completed");
    } catch (error) {
      console.error(error);
      toast.error("Analysis Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAiAtsAnalyze = async () => {
    if (!resumeId) {
      toast.error("Please select a resume");
      return;
    }

    if (!jobDescription.trim()) {
      toast.error("Please paste job description");
      return;
    }

    try {
      setAiLoading(true);

      const response = await axiosInstance.post("/api/ai-ats/analyze", {
        resumeId: Number(resumeId),
        jobDescription,
      });

      const normalizedAiResult = normalizeAtsResult(response.data, resumeId);
      setAiResult(normalizedAiResult);

      saveAtsPageState({
        resumeId,
        jobDescription,
        result,
        aiResult: normalizedAiResult,
      });

      toast.success("AI Universal ATS Analysis Completed");
    } catch (error) {
      console.error(error);
      toast.error("AI ATS Analysis Failed");
    } finally {
      setAiLoading(false);
    }
  };

  const selectedResume = resumes.find(
    (resume) => Number(resume.id) === Number(resumeId)
  );

  const finalScore = result?.finalScore ?? 0;
  const aiScore = aiResult?.atsScore ?? aiResult?.finalScore ?? 0;

  const styles = {
    page: { width: "100%", color: "#ffffff", boxSizing: "border-box" },
    header: { marginBottom: "22px" },
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
    layout: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "18px",
      alignItems: "start",
    },
    card: {
      background: "rgba(15,23,42,.88)",
      border: "1px solid rgba(139,92,246,.18)",
      borderRadius: "22px",
      padding: "clamp(18px, 4vw, 24px)",
      boxShadow: "0 20px 60px rgba(15,23,42,.35)",
      boxSizing: "border-box",
    },
    cardTitle: {
      margin: 0,
      fontSize: "19px",
      fontWeight: 900,
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    form: { marginTop: "20px", display: "grid", gap: "16px" },
    label: {
      display: "block",
      color: "#cbd5e1",
      fontSize: "13px",
      fontWeight: 800,
      marginBottom: "7px",
    },
    selectBox: {
      width: "100%",
      height: "48px",
      borderRadius: "14px",
      border: "1px solid #334155",
      background: "rgba(30,41,59,.92)",
      color: "#ffffff",
      outline: "none",
      padding: "0 14px",
      fontSize: "14px",
      boxSizing: "border-box",
    },
    selectedResumeBox: {
      background: "rgba(30,41,59,.65)",
      border: "1px solid rgba(139,92,246,.18)",
      borderRadius: "16px",
      padding: "14px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginTop: "12px",
    },
    selectedIcon: {
      width: "40px",
      height: "40px",
      borderRadius: "13px",
      background: "rgba(139,92,246,.18)",
      display: "grid",
      placeItems: "center",
      color: "#c4b5fd",
      flexShrink: 0,
    },
    selectedLabel: {
      margin: 0,
      color: "#94a3b8",
      fontSize: "12px",
      fontWeight: 800,
    },
    selectedTitle: {
      margin: "5px 0 0",
      color: "#ffffff",
      fontSize: "13px",
      fontWeight: 900,
      wordBreak: "break-word",
    },
    noResumeBox: {
      marginTop: "12px",
      background: "rgba(239,68,68,.10)",
      border: "1px solid rgba(239,68,68,.25)",
      borderRadius: "16px",
      padding: "14px",
    },
    noResumeText: {
      margin: 0,
      color: "#fca5a5",
      fontSize: "13px",
      lineHeight: 1.6,
    },
    uploadLink: {
      marginTop: "10px",
      display: "inline-flex",
      color: "#c4b5fd",
      fontWeight: 900,
      textDecoration: "none",
      fontSize: "13px",
    },
    textarea: {
      width: "100%",
      minHeight: "220px",
      resize: "vertical",
      borderRadius: "14px",
      border: "1px solid #334155",
      background: "rgba(30,41,59,.92)",
      color: "#ffffff",
      outline: "none",
      padding: "14px",
      fontSize: "14px",
      lineHeight: 1.6,
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
    button: {
      width: "100%",
      height: "50px",
      border: "none",
      borderRadius: "14px",
      background: "linear-gradient(90deg,#8b5cf6,#4f46e5)",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 900,
      cursor: loading || !resumeId ? "not-allowed" : "pointer",
      opacity: loading || !resumeId ? 0.65 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "9px",
      boxShadow: "0 16px 35px rgba(124,58,237,.28)",
    },
    aiButton: {
      width: "100%",
      height: "50px",
      border: "none",
      borderRadius: "14px",
      background: "linear-gradient(90deg,#22c55e,#16a34a)",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 900,
      cursor: aiLoading || !resumeId ? "not-allowed" : "pointer",
      opacity: aiLoading || !resumeId ? 0.65 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "9px",
      boxShadow: "0 16px 35px rgba(34,197,94,.18)",
      marginTop: "12px",
    },
    resultCard: {
      background:
        "linear-gradient(135deg, rgba(139,92,246,.20), rgba(79,70,229,.10))",
      border: "1px solid rgba(139,92,246,.22)",
      borderRadius: "22px",
      padding: "clamp(18px, 4vw, 24px)",
      boxSizing: "border-box",
    },
    scoreBox: {
      marginTop: "20px",
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      padding: "22px",
      borderRadius: "22px",
      background: "rgba(15,23,42,.62)",
      border: "1px solid rgba(148,163,184,.12)",
    },
    scoreCircle: {
      width: "132px",
      height: "132px",
      borderRadius: "999px",
      display: "grid",
      placeItems: "center",
      background: `conic-gradient(#8b5cf6 ${
        finalScore * 3.6
      }deg, rgba(51,65,85,.8) 0deg)`,
      boxShadow: "0 18px 45px rgba(124,58,237,.22)",
    },
    aiScoreCircle: {
      width: "132px",
      height: "132px",
      borderRadius: "999px",
      display: "grid",
      placeItems: "center",
      background: `conic-gradient(#22c55e ${
        aiScore * 3.6
      }deg, rgba(51,65,85,.8) 0deg)`,
      boxShadow: "0 18px 45px rgba(34,197,94,.18)",
    },
    scoreInner: {
      width: "104px",
      height: "104px",
      borderRadius: "999px",
      background: "#020617",
      display: "grid",
      placeItems: "center",
      border: "1px solid rgba(139,92,246,.25)",
    },
    scoreValue: { fontSize: "30px", fontWeight: 950 },
    scoreLabel: {
      margin: "14px 0 0",
      color: "#cbd5e1",
      fontSize: "13px",
      fontWeight: 800,
    },
    miniScores: {
      marginTop: "16px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: "12px",
    },
    miniCard: {
      background: "rgba(15,23,42,.65)",
      border: "1px solid rgba(148,163,184,.12)",
      borderRadius: "16px",
      padding: "14px",
    },
    miniLabel: {
      margin: 0,
      color: "#94a3b8",
      fontSize: "12px",
      fontWeight: 800,
    },
    miniValue: {
      margin: "7px 0 0",
      color: "#ffffff",
      fontSize: "22px",
      fontWeight: 950,
    },
    sectionGrid: {
      marginTop: "18px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "18px",
    },
    skillCard: {
      background: "rgba(15,23,42,.88)",
      border: "1px solid rgba(139,92,246,.18)",
      borderRadius: "20px",
      padding: "20px",
      boxSizing: "border-box",
    },
    skillTitle: {
      margin: 0,
      fontSize: "17px",
      fontWeight: 900,
      display: "flex",
      alignItems: "center",
      gap: "9px",
    },
    chips: {
      marginTop: "16px",
      display: "flex",
      flexWrap: "wrap",
      gap: "9px",
    },
    chipGreen: {
      padding: "8px 11px",
      borderRadius: "999px",
      background: "rgba(34,197,94,.12)",
      border: "1px solid rgba(34,197,94,.25)",
      color: "#86efac",
      fontSize: "12px",
      fontWeight: 800,
    },
    chipRed: {
      padding: "8px 11px",
      borderRadius: "999px",
      background: "rgba(239,68,68,.12)",
      border: "1px solid rgba(239,68,68,.25)",
      color: "#fca5a5",
      fontSize: "12px",
      fontWeight: 800,
    },
    feedback: {
      marginTop: "18px",
      background: "rgba(15,23,42,.88)",
      border: "1px solid rgba(139,92,246,.18)",
      borderRadius: "20px",
      padding: "20px",
      boxSizing: "border-box",
    },
    feedbackText: {
      margin: "12px 0 0",
      color: "#cbd5e1",
      lineHeight: 1.75,
      fontSize: "13px",
      whiteSpace: "pre-line",
    },
    list: {
      margin: "14px 0 0",
      paddingLeft: "20px",
      color: "#cbd5e1",
      lineHeight: 1.7,
      fontSize: "13px",
    },
    empty: {
      marginTop: "20px",
      background: "rgba(15,23,42,.62)",
      border: "1px dashed rgba(139,92,246,.25)",
      borderRadius: "20px",
      padding: "26px",
      textAlign: "center",
      color: "#94a3b8",
      fontSize: "13px",
      lineHeight: 1.6,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p style={styles.badge}>ATS Resume Analysis</p>
        <h1 style={styles.title}>Analyze Resume Against Job Description</h1>
        <p style={styles.subtitle}>
          Select an uploaded resume, paste a job description and calculate
          rule-based ATS score or run AI Universal ATS Analysis for any sector.
        </p>
      </div>

      <div style={styles.layout}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <FileSearch size={21} color="#a78bfa" />
            Analysis Input
          </h2>

          <form onSubmit={handleAnalyze} style={styles.form}>
            <div>
              <label style={styles.label}>Select Resume</label>

              {resumes.length > 0 ? (
                <>
                  <select
                    value={resumeId}
                    onChange={handleResumeChange}
                    style={styles.selectBox}
                    disabled={resumesLoading}
                  >
                    {resumes.map((resume) => (
                      <option key={resume.id} value={resume.id}>
                        {resume.fileName}
                      </option>
                    ))}
                  </select>

                  <div style={styles.selectedResumeBox}>
                    <div style={styles.selectedIcon}>
                      <FileText size={20} />
                    </div>

                    <div>
                      <p style={styles.selectedLabel}>Selected Resume</p>
                      <h3 style={styles.selectedTitle}>
                        {selectedResume?.fileName || "Resume selected"}
                      </h3>
                    </div>
                  </div>
                </>
              ) : (
                <div style={styles.noResumeBox}>
                  <p style={styles.noResumeText}>
                    {resumesLoading
                      ? "Loading resumes..."
                      : "No resume found. Please upload a resume first."}
                  </p>

                  {!resumesLoading && (
                    <Link to="/upload-resume" style={styles.uploadLink}>
                      Upload Resume →
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div>
              <label style={styles.label}>Job Description</label>
              <textarea
                placeholder="Paste the complete job description here..."
                value={jobDescription}
                onChange={handleJobDescriptionChange}
                style={styles.textarea}
                required
              />
            </div>

            <button
              type="submit"
              style={styles.button}
              disabled={loading || !resumeId}
            >
              {loading ? (
                <>
                  <Loader2 size={17} />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 size={17} />
                  Rule-Based ATS Analysis
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleAiAtsAnalyze}
              style={styles.aiButton}
              disabled={aiLoading || !resumeId}
            >
              {aiLoading ? (
                <>
                  <Loader2 size={17} />
                  AI Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  AI Universal ATS Analysis
                </>
              )}
            </button>
          </form>
        </div>

        <div style={styles.resultCard}>
          <h2 style={styles.cardTitle}>
            <Target size={21} color="#a78bfa" />
            Rule-Based ATS Score
          </h2>

          {result ? (
            <>
              <div style={styles.scoreBox}>
                <div style={styles.scoreCircle}>
                  <div style={styles.scoreInner}>
                    <div style={styles.scoreValue}>{result.finalScore}%</div>
                  </div>
                </div>
                <p style={styles.scoreLabel}>Overall ATS Match Score</p>
              </div>

              <div style={styles.miniScores}>
                <div style={styles.miniCard}>
                  <p style={styles.miniLabel}>Skill Score</p>
                  <h3 style={styles.miniValue}>{result.skillScore}%</h3>
                </div>

                <div style={styles.miniCard}>
                  <p style={styles.miniLabel}>Keyword Score</p>
                  <h3 style={styles.miniValue}>{result.keywordScore}%</h3>
                </div>
              </div>
            </>
          ) : (
            <div style={styles.empty}>
              Rule-based ATS result will appear here after analysis.
            </div>
          )}
        </div>
      </div>

      {result && (
        <>
          <div style={styles.sectionGrid}>
            <div style={styles.skillCard}>
              <h3 style={styles.skillTitle}>
                <CheckCircle2 size={19} color="#86efac" />
                Matched Skills
              </h3>

              <div style={styles.chips}>
                {result.matchedSkills?.length ? (
                  result.matchedSkills.map((skill, index) => (
                    <span key={index} style={styles.chipGreen}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span style={styles.chipGreen}>No matched skills found</span>
                )}
              </div>
            </div>

            <div style={styles.skillCard}>
              <h3 style={styles.skillTitle}>
                <XCircle size={19} color="#fca5a5" />
                Missing Skills
              </h3>

              <div style={styles.chips}>
                {result.missingSkills?.length ? (
                  result.missingSkills.map((skill, index) => (
                    <span key={index} style={styles.chipRed}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span style={styles.chipRed}>No missing skills detected</span>
                )}
              </div>
            </div>
          </div>

          <div style={styles.feedback}>
            <h3 style={styles.skillTitle}>
              <Sparkles size={19} color="#c4b5fd" />
              Rule-Based Feedback
            </h3>

            <p style={styles.feedbackText}>
              {result.feedback || "No feedback available."}
            </p>
          </div>
        </>
      )}

      {aiResult && (
        <>
          <div style={styles.feedback}>
            <h3 style={styles.skillTitle}>
              <Sparkles size={19} color="#86efac" />
              AI Universal ATS Score
            </h3>

            <div style={styles.scoreBox}>
              <div style={styles.aiScoreCircle}>
                <div style={styles.scoreInner}>
                  <div style={styles.scoreValue}>
                    {aiResult.atsScore ?? aiResult.finalScore ?? 0}%
                  </div>
                </div>
              </div>
              <p style={styles.scoreLabel}>AI Industry-Neutral ATS Score</p>
            </div>
          </div>

          <div style={styles.sectionGrid}>
            <div style={styles.skillCard}>
              <h3 style={styles.skillTitle}>
                <CheckCircle2 size={19} color="#86efac" />
                AI Matched Requirements
              </h3>

              <div style={styles.chips}>
                {aiResult.matchedSkills?.length ? (
                  aiResult.matchedSkills.map((skill, index) => (
                    <span key={index} style={styles.chipGreen}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span style={styles.chipGreen}>No matched requirements</span>
                )}
              </div>
            </div>

            <div style={styles.skillCard}>
              <h3 style={styles.skillTitle}>
                <XCircle size={19} color="#fca5a5" />
                AI Missing Requirements
              </h3>

              <div style={styles.chips}>
                {aiResult.missingSkills?.length ? (
                  aiResult.missingSkills.map((skill, index) => (
                    <span key={index} style={styles.chipRed}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span style={styles.chipGreen}>No missing requirements</span>
                )}
              </div>
            </div>
          </div>

          <div style={styles.sectionGrid}>
            <div style={styles.skillCard}>
              <h3 style={styles.skillTitle}>Strengths</h3>
              <ul style={styles.list}>
                {aiResult.strengths?.length ? (
                  aiResult.strengths.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))
                ) : (
                  <li>No strengths returned</li>
                )}
              </ul>
            </div>

            <div style={styles.skillCard}>
              <h3 style={styles.skillTitle}>Weaknesses</h3>
              <ul style={styles.list}>
                {aiResult.weaknesses?.length ? (
                  aiResult.weaknesses.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))
                ) : (
                  <li>No weaknesses returned</li>
                )}
              </ul>
            </div>
          </div>

          <div style={styles.feedback}>
            <h3 style={styles.skillTitle}>
              <Sparkles size={19} color="#c4b5fd" />
              AI Recommendations
            </h3>

            <ul style={styles.list}>
              {aiResult.recommendations?.length ? (
                aiResult.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))
              ) : (
                <li>No recommendations returned</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default AtsAnalysisPage;
