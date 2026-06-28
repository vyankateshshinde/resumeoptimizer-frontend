import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Sparkles,
  FilePenLine,
  Library,
  LayoutTemplate,
  Loader2,
  FileText,
  Wand2,
  Save,
  CheckCircle2,
  History,
  Edit3,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";

const ResumeBuilderPage = () => {
  const [resumes, setResumes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateName, setTemplateName] = useState("ATS Professional");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [latestHistoryId, setLatestHistoryId] = useState(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineResult, setRefineResult] = useState(null);

  useEffect(() => {
    fetchResumes();
    fetchTemplates();
    fetchHistory();

    const savedGeneratedResume = localStorage.getItem("latestGeneratedResume");
    const savedJobDescription = localStorage.getItem("resumeBuilderJobDescription");

    if (savedGeneratedResume) {
      try {
        setGeneratedResume(JSON.parse(savedGeneratedResume));
      } catch (error) {
        localStorage.removeItem("latestGeneratedResume");
      }
    }

    if (savedJobDescription) {
      setJobDescription(savedJobDescription);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("resumeBuilderJobDescription", jobDescription || "");
  }, [jobDescription]);

  const fetchResumes = async () => {
    try {
      const response = await axiosInstance.get("/api/resume/my-resumes");
      const list = Array.isArray(response.data) ? response.data : [];
      setResumes(list);

      const savedResume = JSON.parse(localStorage.getItem("selectedResume") || "null");

      if (savedResume?.id && list.some((resume) => resume.id === savedResume.id)) {
        setResumeId(savedResume.id);
      } else if (list.length > 0) {
        setResumeId(list[0].id);
        localStorage.setItem("selectedResume", JSON.stringify(list[0]));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load resumes");
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axiosInstance.get("/api/templates");
      const list = Array.isArray(response.data) ? response.data : [];
      setTemplates(list);

      if (list.length > 0) {
        setSelectedTemplate(list[0]);
        setTemplateName(list[0].templateName);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load templates");
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axiosInstance.get("/api/resume-builder/history");
      const list = Array.isArray(response.data) ? response.data : [];
      setHistory(list);

      if (list.length > 0) {
        setLatestHistoryId(list[0].id);
      }

      return list;
    } catch (error) {
      console.error(error);
      toast.error("Failed to load builder history");
      return [];
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setTemplateName(template.templateName);
    setLatestHistoryId(null);
  };

  const handleResumeChange = (e) => {
    const selectedId = Number(e.target.value);
    setResumeId(selectedId);

    const selectedResume = resumes.find((resume) => resume.id === selectedId);

    if (selectedResume) {
      localStorage.setItem("selectedResume", JSON.stringify(selectedResume));
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

  const handleGenerateResume = async () => {
    if (!resumeId) {
      toast.error("Please select a resume");
      return;
    }

    if (!templateName) {
      toast.error("Please select a template");
      return;
    }

    if (!jobDescription.trim()) {
      toast.error("Please paste job description");
      return;
    }

    try {
      setLoading(true);
      setRefineResult(null);

      const response = await axiosInstance.post("/api/resume-builder/generate", {
        resumeId: Number(resumeId),
        jobDescription,
        templateName,
      });

      const normalizedResume = {
        ...response.data,
        skills: normalizeArray(response.data.skills),
        experienceBullets: normalizeArray(response.data.experienceBullets),
        projectBullets: normalizeArray(response.data.projectBullets),
        templateName: response.data.templateName || templateName,
      };

      setGeneratedResume(normalizedResume);
      localStorage.setItem("latestGeneratedResume", JSON.stringify(normalizedResume));

      const updatedHistory = await fetchHistory();

      if (updatedHistory.length > 0) {
        setLatestHistoryId(updatedHistory[0].id);
      }

      toast.success("AI Resume Generated Successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate resume");
    } finally {
      setLoading(false);
    }
  };

  const handleRefineResume = async () => {
    if (!generatedResume) {
      toast.error("Generate resume first");
      return;
    }

    if (!userPrompt.trim()) {
      toast.error("Please enter prompt to edit resume");
      return;
    }

    const currentResumeText =
      generatedResume.fullResumeText ||
      buildPlainResumeText(generatedResume);

    try {
      setRefining(true);

      const response = await axiosInstance.post("/api/prompt-editor/refine", {
        currentResumeText,
        jobDescription,
        userPrompt,
      });

      const updatedResume = {
        ...generatedResume,
        fullResumeText:
          response.data.updatedResumeText ||
          response.data.fullResumeText ||
          currentResumeText,
      };

      setGeneratedResume(updatedResume);
      setRefineResult(response.data);
      localStorage.setItem("latestGeneratedResume", JSON.stringify(updatedResume));
      toast.success("Resume refined successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to refine resume");
    } finally {
      setRefining(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!latestHistoryId) {
      toast.error("Generate resume first");
      return;
    }

    try {
      setSaving(true);

      await axiosInstance.post(
        `/api/resume-builder/history/${latestHistoryId}/save-version`
      );

      toast.success("Resume Version Saved Successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save resume version");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHistoryAsVersion = async (historyId) => {
    try {
      setSaving(true);

      await axiosInstance.post(
        `/api/resume-builder/history/${historyId}/save-version`
      );

      toast.success("History saved as resume version");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save history as version");
    } finally {
      setSaving(false);
    }
  };

  const buildPlainResumeText = (resume) => {
    if (!resume) return "";

    return [
      "PROFESSIONAL SUMMARY",
      resume.professionalSummary || "",
      "",
      "SKILLS",
      normalizeArray(resume.skills).join(", "),
      "",
      "EXPERIENCE",
      normalizeArray(resume.experienceBullets).map((item) => `• ${item}`).join("\n"),
      "",
      "PROJECTS",
      normalizeArray(resume.projectBullets).map((item) => `• ${item}`).join("\n"),
      "",
      "EDUCATION",
      resume.education || "",
    ].join("\n");
  };

  const renderList = (items) => {
    const list = normalizeArray(items);

    if (!list.length) {
      return <li>No content generated</li>;
    }

    return list.map((item, index) => <li key={index}>{item}</li>);
  };

  const renderSkillChips = (skills) => {
    const list = normalizeArray(skills);

    if (!list.length) {
      return <span style={styles.resumeChip}>No skills generated</span>;
    }

    return list.map((skill, index) => (
      <span key={index} style={styles.resumeChip}>
        {skill}
      </span>
    ));
  };

  const renderFullTextBlock = (text) => {
    if (!text) return null;

    return (
      <div style={styles.resumeSection}>
        <h3 style={styles.resumeSectionTitle}>Optimized Resume Text</h3>
        <p style={styles.resumeTextBlock}>{text}</p>
      </div>
    );
  };

  const renderTemplatePreview = () => {
    if (!generatedResume) return null;

    const activeTemplate = generatedResume.templateName || templateName || "ATS Professional";
    const templateLower = activeTemplate.toLowerCase();
    const fullText = generatedResume.fullResumeText || "";

    if (templateLower.includes("modern") || templateLower.includes("software")) {
      return (
        <div style={styles.resumePaperModern}>
          <div style={styles.resumeModernTop}>
            <div>
              <h1 style={styles.resumeName}>Vyankatesh Shinde</h1>
              <p style={styles.resumeRole}>Java Full Stack Developer</p>
            </div>
            <div style={styles.resumeContact}>
              <p>Java · Spring Boot · React.js</p>
              <p>Microservices · Kafka · AWS</p>
            </div>
          </div>

          <div style={styles.resumeTwoColumn}>
            <div style={styles.resumeLeftColumn}>
              <div style={styles.resumeSection}>
                <h3 style={styles.resumeSectionTitle}>Profile</h3>
                <p style={styles.resumeParagraph}>
                  {generatedResume.professionalSummary || "No summary generated"}
                </p>
              </div>

              <div style={styles.resumeSection}>
                <h3 style={styles.resumeSectionTitle}>Experience</h3>
                <ul style={styles.resumeList}>
                  {renderList(generatedResume.experienceBullets)}
                </ul>
              </div>

              <div style={styles.resumeSection}>
                <h3 style={styles.resumeSectionTitle}>Projects</h3>
                <ul style={styles.resumeList}>
                  {renderList(generatedResume.projectBullets)}
                </ul>
              </div>
            </div>

            <div style={styles.resumeRightColumn}>
              <div style={styles.resumeSection}>
                <h3 style={styles.resumeSectionTitle}>Skills</h3>
                <div style={styles.resumeChips}>
                  {renderSkillChips(generatedResume.skills)}
                </div>
              </div>

              <div style={styles.resumeSection}>
                <h3 style={styles.resumeSectionTitle}>Education</h3>
                <p style={styles.resumeParagraph}>
                  {generatedResume.education || "No education detected"}
                </p>
              </div>

              <div style={styles.resumeSection}>
                <h3 style={styles.resumeSectionTitle}>Template</h3>
                <p style={styles.resumeParagraph}>{activeTemplate}</p>
              </div>
            </div>
          </div>

          {renderFullTextBlock(fullText)}
        </div>
      );
    }

    if (templateLower.includes("corporate") || templateLower.includes("clean")) {
      return (
        <div style={styles.resumePaperClean}>
          <div style={styles.resumeCleanHeader}>
            <h1 style={styles.resumeNameDark}>Vyankatesh Shinde</h1>
            <p style={styles.resumeRoleDark}>Java Full Stack Developer</p>
            <p style={styles.resumeContactDark}>
              Spring Boot | Microservices | React.js | MySQL | MongoDB | Kafka | AWS
            </p>
          </div>

          <div style={styles.resumeSectionLight}>
            <h3 style={styles.resumeSectionTitleDark}>Professional Summary</h3>
            <p style={styles.resumeParagraphDark}>
              {generatedResume.professionalSummary || "No summary generated"}
            </p>
          </div>

          <div style={styles.resumeSectionLight}>
            <h3 style={styles.resumeSectionTitleDark}>Technical Skills</h3>
            <div style={styles.resumeChips}>
              {normalizeArray(generatedResume.skills).map((skill, index) => (
                <span key={index} style={styles.resumeChipLight}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div style={styles.resumeSectionLight}>
            <h3 style={styles.resumeSectionTitleDark}>Professional Experience</h3>
            <ul style={styles.resumeListDark}>
              {renderList(generatedResume.experienceBullets)}
            </ul>
          </div>

          <div style={styles.resumeSectionLight}>
            <h3 style={styles.resumeSectionTitleDark}>Projects</h3>
            <ul style={styles.resumeListDark}>
              {renderList(generatedResume.projectBullets)}
            </ul>
          </div>

          <div style={styles.resumeSectionLight}>
            <h3 style={styles.resumeSectionTitleDark}>Education</h3>
            <p style={styles.resumeParagraphDark}>
              {generatedResume.education || "No education detected"}
            </p>
          </div>

          {fullText && (
            <div style={styles.resumeSectionLight}>
              <h3 style={styles.resumeSectionTitleDark}>Optimized Resume Text</h3>
              <p style={styles.resumeTextBlockDark}>{fullText}</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={styles.resumePaper}>
        <div style={styles.resumeHeader}>
          <h1 style={styles.resumeName}>Vyankatesh Shinde</h1>
          <p style={styles.resumeRole}>Java Full Stack Developer</p>
          <p style={styles.resumeContact}>
            Java | Spring Boot | Microservices | React.js | MySQL | MongoDB | Kafka | AWS
          </p>
        </div>

        <div style={styles.resumeSection}>
          <h3 style={styles.resumeSectionTitle}>Professional Summary</h3>
          <p style={styles.resumeParagraph}>
            {generatedResume.professionalSummary || "No summary generated"}
          </p>
        </div>

        <div style={styles.resumeSection}>
          <h3 style={styles.resumeSectionTitle}>Technical Skills</h3>
          <div style={styles.resumeChips}>{renderSkillChips(generatedResume.skills)}</div>
        </div>

        <div style={styles.resumeSection}>
          <h3 style={styles.resumeSectionTitle}>Experience</h3>
          <ul style={styles.resumeList}>
            {renderList(generatedResume.experienceBullets)}
          </ul>
        </div>

        <div style={styles.resumeSection}>
          <h3 style={styles.resumeSectionTitle}>Projects</h3>
          <ul style={styles.resumeList}>
            {renderList(generatedResume.projectBullets)}
          </ul>
        </div>

        <div style={styles.resumeSection}>
          <h3 style={styles.resumeSectionTitle}>Education</h3>
          <p style={styles.resumeParagraph}>
            {generatedResume.education || "No education detected"}
          </p>
        </div>

        {renderFullTextBlock(fullText)}
      </div>
    );
  };

  const styles = {
    wrapper: { color: "#ffffff" },
    hero: {
      background:
        "linear-gradient(135deg, rgba(139,92,246,.22), rgba(79,70,229,.12))",
      border: "1px solid rgba(139,92,246,.25)",
      borderRadius: "24px",
      padding: "28px",
      marginBottom: "26px",
    },
    title: { margin: 0, fontSize: "32px", fontWeight: 950 },
    subtitle: {
      marginTop: "10px",
      color: "#cbd5e1",
      maxWidth: "900px",
      lineHeight: 1.6,
      fontSize: "15px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "20px",
      marginBottom: "26px",
    },
    card: {
      background: "rgba(15,23,42,.95)",
      border: "1px solid rgba(139,92,246,.22)",
      borderRadius: "20px",
      padding: "22px",
      minHeight: "230px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      boxShadow: "0 18px 40px rgba(0,0,0,.22)",
    },
    iconBox: {
      width: "52px",
      height: "52px",
      borderRadius: "16px",
      background: "linear-gradient(135deg,#8b5cf6,#4f46e5)",
      display: "grid",
      placeItems: "center",
      marginBottom: "16px",
    },
    cardTitle: { margin: 0, fontSize: "20px", fontWeight: 900 },
    desc: {
      marginTop: "10px",
      color: "#94a3b8",
      lineHeight: 1.6,
      fontSize: "14px",
    },
    btn: {
      marginTop: "18px",
      display: "inline-flex",
      justifyContent: "center",
      alignItems: "center",
      height: "42px",
      borderRadius: "12px",
      background: "linear-gradient(90deg,#8b5cf6,#4f46e5)",
      color: "#ffffff",
      textDecoration: "none",
      fontWeight: 900,
      fontSize: "14px",
      border: "none",
      cursor: "pointer",
    },
    section: {
      background: "rgba(15,23,42,.95)",
      border: "1px solid rgba(139,92,246,.22)",
      borderRadius: "22px",
      padding: "24px",
      marginBottom: "24px",
      boxShadow: "0 18px 40px rgba(0,0,0,.22)",
    },
    sectionTitle: {
      margin: 0,
      fontSize: "22px",
      fontWeight: 950,
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    templateGrid: {
      marginTop: "20px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
      gap: "16px",
    },
    templateCard: {
      background: "rgba(2,6,23,.72)",
      border: "1px solid rgba(139,92,246,.18)",
      borderRadius: "18px",
      padding: "18px",
      cursor: "pointer",
      minHeight: "190px",
      position: "relative",
    },
    selectedTemplateCard: {
      border: "1px solid rgba(34,197,94,.75)",
      boxShadow: "0 0 0 1px rgba(34,197,94,.35)",
      background:
        "linear-gradient(135deg, rgba(34,197,94,.12), rgba(15,23,42,.95))",
    },
    templateHeader: {
      display: "flex",
      justifyContent: "space-between",
      gap: "10px",
      alignItems: "flex-start",
    },
    templateNameStyle: {
      margin: 0,
      fontSize: "16px",
      fontWeight: 950,
      color: "#ffffff",
    },
    templateType: {
      marginTop: "8px",
      display: "inline-flex",
      padding: "6px 10px",
      borderRadius: "999px",
      background: "rgba(139,92,246,.16)",
      border: "1px solid rgba(139,92,246,.28)",
      color: "#ddd6fe",
      fontSize: "12px",
      fontWeight: 850,
    },
    templateDesc: {
      marginTop: "12px",
      color: "#94a3b8",
      fontSize: "13px",
      lineHeight: 1.6,
    },
    score: {
      marginTop: "12px",
      color: "#86efac",
      fontSize: "12px",
      fontWeight: 900,
    },
    formGrid: {
      marginTop: "20px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "18px",
    },
    label: {
      display: "block",
      color: "#cbd5e1",
      fontSize: "13px",
      fontWeight: 800,
      marginBottom: "8px",
    },
    select: {
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
    textarea: {
      width: "100%",
      minHeight: "190px",
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
      marginTop: "8px",
    },
    actionRow: {
      display: "flex",
      gap: "12px",
      marginTop: "18px",
      flexWrap: "wrap",
    },
    generateBtn: {
      flex: 1,
      minWidth: "220px",
      height: "52px",
      border: "none",
      borderRadius: "14px",
      background: "linear-gradient(90deg,#22c55e,#16a34a)",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 950,
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.65 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "9px",
    },
    saveBtn: {
      flex: 1,
      minWidth: "220px",
      height: "52px",
      border: "none",
      borderRadius: "14px",
      background: "linear-gradient(90deg,#8b5cf6,#4f46e5)",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 950,
      cursor: saving ? "not-allowed" : "pointer",
      opacity: saving ? 0.65 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "9px",
    },
    refineBtn: {
      width: "100%",
      height: "50px",
      border: "none",
      borderRadius: "14px",
      background: "linear-gradient(90deg,#f59e0b,#ea580c)",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 950,
      cursor: refining ? "not-allowed" : "pointer",
      opacity: refining ? 0.65 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "9px",
      marginTop: "14px",
    },
    selectedBox: {
      marginTop: "18px",
      padding: "16px",
      borderRadius: "16px",
      background: "rgba(34,197,94,.10)",
      border: "1px solid rgba(34,197,94,.25)",
      color: "#bbf7d0",
      fontSize: "13px",
      lineHeight: 1.6,
    },
    emptyBox: {
      marginTop: "14px",
      padding: "18px",
      borderRadius: "16px",
      background: "rgba(239,68,68,.10)",
      border: "1px solid rgba(239,68,68,.25)",
      color: "#fca5a5",
      fontSize: "13px",
      lineHeight: 1.6,
    },
    historyCard: {
      background: "rgba(2,6,23,.72)",
      border: "1px solid rgba(139,92,246,.18)",
      borderRadius: "18px",
      padding: "18px",
      marginTop: "14px",
    },
    previewTitle: {
      margin: 0,
      fontSize: "16px",
      fontWeight: 900,
      color: "#c4b5fd",
    },
    previewText: {
      marginTop: "12px",
      color: "#cbd5e1",
      fontSize: "13px",
      lineHeight: 1.7,
      whiteSpace: "pre-wrap",
    },
    resumePaper: {
      marginTop: "22px",
      background: "#020617",
      border: "1px solid rgba(139,92,246,.35)",
      borderRadius: "22px",
      padding: "32px",
      boxShadow: "0 24px 80px rgba(0,0,0,.35)",
    },
    resumePaperModern: {
      marginTop: "22px",
      background:
        "linear-gradient(135deg, rgba(15,23,42,1), rgba(30,41,59,.96))",
      border: "1px solid rgba(34,197,94,.28)",
      borderRadius: "22px",
      padding: "32px",
      boxShadow: "0 24px 80px rgba(0,0,0,.35)",
    },
    resumePaperClean: {
      marginTop: "22px",
      background: "#f8fafc",
      color: "#0f172a",
      border: "1px solid rgba(148,163,184,.35)",
      borderRadius: "22px",
      padding: "32px",
      boxShadow: "0 24px 80px rgba(0,0,0,.35)",
    },
    resumeHeader: {
      borderBottom: "1px solid rgba(139,92,246,.35)",
      paddingBottom: "18px",
      marginBottom: "22px",
      textAlign: "center",
    },
    resumeModernTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: "18px",
      flexWrap: "wrap",
      borderBottom: "1px solid rgba(34,197,94,.28)",
      paddingBottom: "18px",
      marginBottom: "22px",
    },
    resumeCleanHeader: {
      borderBottom: "2px solid #334155",
      paddingBottom: "16px",
      marginBottom: "22px",
    },
    resumeTwoColumn: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, .8fr)",
      gap: "24px",
    },
    resumeLeftColumn: { minWidth: 0 },
    resumeRightColumn: { minWidth: 0 },
    resumeName: {
      margin: 0,
      color: "#ffffff",
      fontSize: "30px",
      fontWeight: 950,
      letterSpacing: ".2px",
    },
    resumeNameDark: {
      margin: 0,
      color: "#0f172a",
      fontSize: "30px",
      fontWeight: 950,
      letterSpacing: ".2px",
    },
    resumeRole: {
      margin: "8px 0 0",
      color: "#c4b5fd",
      fontSize: "16px",
      fontWeight: 900,
    },
    resumeRoleDark: {
      margin: "8px 0 0",
      color: "#334155",
      fontSize: "16px",
      fontWeight: 900,
    },
    resumeContact: {
      margin: "8px 0 0",
      color: "#cbd5e1",
      fontSize: "13px",
      lineHeight: 1.6,
    },
    resumeContactDark: {
      margin: "8px 0 0",
      color: "#475569",
      fontSize: "13px",
      lineHeight: 1.6,
    },
    resumeSection: {
      marginTop: "20px",
    },
    resumeSectionLight: {
      marginTop: "20px",
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "14px",
      padding: "18px",
    },
    resumeSectionTitle: {
      margin: 0,
      color: "#c4b5fd",
      fontSize: "15px",
      fontWeight: 950,
      textTransform: "uppercase",
      letterSpacing: ".8px",
    },
    resumeSectionTitleDark: {
      margin: 0,
      color: "#1e293b",
      fontSize: "15px",
      fontWeight: 950,
      textTransform: "uppercase",
      letterSpacing: ".8px",
    },
    resumeParagraph: {
      margin: "10px 0 0",
      color: "#e2e8f0",
      fontSize: "14px",
      lineHeight: 1.8,
    },
    resumeParagraphDark: {
      margin: "10px 0 0",
      color: "#334155",
      fontSize: "14px",
      lineHeight: 1.8,
    },
    resumeList: {
      margin: "12px 0 0",
      paddingLeft: "22px",
      color: "#e2e8f0",
      fontSize: "14px",
      lineHeight: 1.8,
    },
    resumeListDark: {
      margin: "12px 0 0",
      paddingLeft: "22px",
      color: "#334155",
      fontSize: "14px",
      lineHeight: 1.8,
    },
    resumeChips: {
      marginTop: "12px",
      display: "flex",
      flexWrap: "wrap",
      gap: "9px",
    },
    resumeChip: {
      padding: "8px 11px",
      borderRadius: "999px",
      background: "rgba(139,92,246,.14)",
      border: "1px solid rgba(139,92,246,.28)",
      color: "#ddd6fe",
      fontSize: "12px",
      fontWeight: 850,
    },
    resumeChipLight: {
      padding: "8px 11px",
      borderRadius: "999px",
      background: "#ede9fe",
      border: "1px solid #c4b5fd",
      color: "#4c1d95",
      fontSize: "12px",
      fontWeight: 850,
    },
    resumeTextBlock: {
      marginTop: "12px",
      color: "#e2e8f0",
      fontSize: "14px",
      lineHeight: 1.8,
      whiteSpace: "pre-wrap",
    },
    resumeTextBlockDark: {
      marginTop: "12px",
      color: "#334155",
      fontSize: "14px",
      lineHeight: 1.8,
      whiteSpace: "pre-wrap",
    },
  };

  const cards = [
    {
      title: "Build With AI",
      description:
        "Select a template, paste job description, generate optimized resume, refine and save versions.",
      icon: Sparkles,
      button: "Use AI Builder Below",
    },
    {
      title: "Build From Scratch",
      description:
        "Create resume manually by adding summary, skills, experience, projects, education, and certifications.",
      icon: FilePenLine,
      button: "Coming Soon",
    },
    {
      title: "My Resume Library",
      description:
        "View old resumes, duplicate versions, edit saved resumes, compare changes, and download PDF/DOCX.",
      icon: Library,
      path: "/resume-versions",
      button: "Open Library",
    },
    {
      title: "Resume Templates",
      description:
        "Choose from ATS-friendly templates for multiple industries and career levels.",
      icon: LayoutTemplate,
      button: "Available Below",
    },
  ];

  return (
    <div style={styles.wrapper}>
      <div style={styles.hero}>
        <h1 style={styles.title}>Resume Builder</h1>
        <p style={styles.subtitle}>
          Build ATS-friendly resumes using AI, job descriptions, template
          selection, prompt-based refinement, resume versions, and download-ready
          formats.
        </p>
      </div>

      <div style={styles.grid}>
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.title} style={styles.card}>
              <div>
                <div style={styles.iconBox}>
                  <Icon size={25} />
                </div>

                <h2 style={styles.cardTitle}>{card.title}</h2>
                <p style={styles.desc}>{card.description}</p>
              </div>

              {card.path ? (
                <Link to={card.path} style={styles.btn}>
                  {card.button}
                </Link>
              ) : (
                <div style={{ ...styles.btn, opacity: 0.65 }}>{card.button}</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <LayoutTemplate size={22} color="#c4b5fd" />
          Select Resume Template
        </h2>

        <div style={styles.templateGrid}>
          {templates.length > 0 ? (
            templates.map((template) => {
              const isSelected =
                selectedTemplate?.id === template.id ||
                templateName === template.templateName;

              return (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  style={{
                    ...styles.templateCard,
                    ...(isSelected ? styles.selectedTemplateCard : {}),
                  }}
                >
                  <div style={styles.templateHeader}>
                    <h3 style={styles.templateNameStyle}>
                      {template.templateName}
                    </h3>

                    {isSelected && <CheckCircle2 size={20} color="#86efac" />}
                  </div>

                  <span style={styles.templateType}>{template.templateType}</span>

                  <p style={styles.templateDesc}>{template.description}</p>

                  <div style={styles.score}>
                    Market Fit Score: {template.marketFitScore}%
                  </div>
                </div>
              );
            })
          ) : (
            <div style={styles.emptyBox}>No templates found.</div>
          )}
        </div>

        {selectedTemplate && (
          <div style={styles.selectedBox}>
            Selected Template: <strong>{selectedTemplate.templateName}</strong> ·
            Best For: {selectedTemplate.templateType}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <Wand2 size={22} color="#86efac" />
          Build With AI
        </h2>

        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Select Uploaded Resume</label>

            {resumes.length > 0 ? (
              <select value={resumeId} onChange={handleResumeChange} style={styles.select}>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.fileName}
                  </option>
                ))}
              </select>
            ) : (
              <div style={styles.emptyBox}>
                No resume found. Please upload a resume first.
                <br />
                <Link to="/upload-resume" style={{ color: "#c4b5fd" }}>
                  Upload Resume →
                </Link>
              </div>
            )}
          </div>

          <div>
            <label style={styles.label}>Selected Template</label>
            <select
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={styles.select}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.templateName}>
                  {template.templateName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: "18px" }}>
          <label style={styles.label}>Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description here..."
            style={styles.textarea}
          />
        </div>

        <div style={styles.actionRow}>
          <button onClick={handleGenerateResume} disabled={loading} style={styles.generateBtn}>
            {loading ? (
              <>
                <Loader2 size={18} />
                Generating Resume...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate AI Resume
              </>
            )}
          </button>

          {generatedResume && (
            <button onClick={handleSaveVersion} disabled={saving} style={styles.saveBtn}>
              {saving ? (
                <>
                  <Loader2 size={18} />
                  Saving Version...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Version
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {generatedResume && (
        <>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <FileText size={22} color="#c4b5fd" />
              Generated Resume Template Preview
            </h2>

            {renderTemplatePreview()}
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Edit3 size={22} color="#fbbf24" />
              Edit Resume With Prompt
            </h2>

            <p style={styles.desc}>
              Example: Remove AWS if I do not know it, add measurable project
              impact, make summary shorter, improve hotel booking project bullets.
            </p>

            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Enter prompt to modify generated resume..."
              style={styles.textarea}
            />

            <button
              onClick={handleRefineResume}
              disabled={refining}
              style={styles.refineBtn}
            >
              {refining ? (
                <>
                  <Loader2 size={18} />
                  Refining Resume...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Refine Resume With Prompt
                </>
              )}
            </button>

            {refineResult && (
              <div style={styles.selectedBox}>
                Intent: <strong>{refineResult.detectedIntent || "CUSTOM"}</strong>
                <br />
                Section: <strong>{refineResult.modifiedSection || "Resume"}</strong>
                <br />
                {refineResult.changeSummary || "Resume updated successfully."}
              </div>
            )}
          </div>
        </>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <History size={22} color="#c4b5fd" />
          Resume Builder History
        </h2>

        {historyLoading ? (
          <div style={styles.emptyBox}>Loading history...</div>
        ) : history.length > 0 ? (
          history.map((item) => (
            <div key={item.id} style={styles.historyCard}>
              <h3 style={styles.previewTitle}>
                {item.templateName || "Generated Resume"}
              </h3>

              <p style={styles.previewText}>
                Resume ID: {item.resumeId} · Created:{" "}
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}
              </p>

              <p style={styles.previewText}>
                JD:{" "}
                {(item.jobDescription || "").length > 180
                  ? `${item.jobDescription.substring(0, 180)}...`
                  : item.jobDescription}
              </p>

              <button
                style={{ ...styles.saveBtn, marginTop: "12px", flex: "unset" }}
                onClick={() => handleSaveHistoryAsVersion(item.id)}
                disabled={saving}
              >
                <Save size={16} />
                Save As Version
              </button>
            </div>
          ))
        ) : (
          <div style={styles.emptyBox}>No builder history found.</div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilderPage;
