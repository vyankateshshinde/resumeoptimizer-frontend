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
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";

const ResumeBuilderPage = () => {
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [templateName, setTemplateName] = useState("ATS Template 1");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedResume, setGeneratedResume] = useState(null);

  const templates = [
    "ATS Template 1",
    "Modern ATS Template",
    "Tech Developer Template",
    "Corporate Professional Template",
    "Minimal Clean Template",
    "Senior Engineer Template",
  ];

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await axiosInstance.get("/api/resume/my-resumes");
        const list = Array.isArray(response.data) ? response.data : [];

        setResumes(list);

        const savedResume = JSON.parse(
          localStorage.getItem("selectedResume") || "null"
        );

        if (
          savedResume?.id &&
          list.some((resume) => resume.id === savedResume.id)
        ) {
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

    fetchResumes();
  }, []);

  const handleGenerateResume = async () => {
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

      const response = await axiosInstance.post("/api/resume-builder/generate", {
        resumeId: Number(resumeId),
        jobDescription,
        templateName,
      });

      setGeneratedResume(response.data);
      localStorage.setItem(
        "latestGeneratedResume",
        JSON.stringify(response.data)
      );

      toast.success("AI Resume Generated Successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate resume");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!generatedResume) {
      toast.error("Generate resume first");
      return;
    }

    if (!resumeId) {
      toast.error("Resume ID not found");
      return;
    }

    try {
      setSaving(true);

      await axiosInstance.post("/api/resume-versions/save", {
        resumeId: Number(resumeId),
        versionName: `${generatedResume.templateName || templateName} Version`,
        templateName: generatedResume.templateName || templateName,
        fullResumeText: generatedResume.fullResumeText || "",
        professionalSummary: generatedResume.professionalSummary || "",
        skills: Array.isArray(generatedResume.skills)
          ? generatedResume.skills.join(", ")
          : generatedResume.skills || "",
        experienceBullets: Array.isArray(generatedResume.experienceBullets)
          ? generatedResume.experienceBullets.join("\n")
          : generatedResume.experienceBullets || "",
        projectBullets: Array.isArray(generatedResume.projectBullets)
          ? generatedResume.projectBullets.join("\n")
          : generatedResume.projectBullets || "",
        education: generatedResume.education || "",
        atsScore: 0,
      });

      toast.success("Resume Version Saved Successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save resume version");
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    wrapper: {
      color: "#ffffff",
    },
    hero: {
      background:
        "linear-gradient(135deg, rgba(139,92,246,.22), rgba(79,70,229,.12))",
      border: "1px solid rgba(139,92,246,.25)",
      borderRadius: "24px",
      padding: "28px",
      marginBottom: "26px",
    },
    title: {
      margin: 0,
      fontSize: "32px",
      fontWeight: 950,
    },
    subtitle: {
      marginTop: "10px",
      color: "#cbd5e1",
      maxWidth: "860px",
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
    cardTitle: {
      margin: 0,
      fontSize: "20px",
      fontWeight: 900,
    },
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
    previewGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "18px",
      marginTop: "20px",
    },
    previewCard: {
      background: "rgba(2,6,23,.72)",
      border: "1px solid rgba(139,92,246,.18)",
      borderRadius: "18px",
      padding: "18px",
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
    chips: {
      marginTop: "12px",
      display: "flex",
      flexWrap: "wrap",
      gap: "9px",
    },
    chip: {
      padding: "8px 11px",
      borderRadius: "999px",
      background: "rgba(139,92,246,.14)",
      border: "1px solid rgba(139,92,246,.28)",
      color: "#ddd6fe",
      fontSize: "12px",
      fontWeight: 800,
    },
    list: {
      margin: "12px 0 0",
      paddingLeft: "20px",
      color: "#cbd5e1",
      fontSize: "13px",
      lineHeight: 1.7,
    },
    fullResumeBox: {
      marginTop: "18px",
      width: "100%",
      minHeight: "240px",
      borderRadius: "14px",
      border: "1px solid #334155",
      background: "#020617",
      color: "#ffffff",
      outline: "none",
      padding: "16px",
      fontSize: "14px",
      lineHeight: 1.7,
      boxSizing: "border-box",
      fontFamily: "inherit",
      resize: "vertical",
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
  };

  const cards = [
    {
      title: "Build With AI",
      description:
        "Upload resume, paste job description, generate optimized resume, refine with prompts, and save versions.",
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
        "Choose from ATS-friendly templates suitable for software, backend, frontend, full stack, and corporate roles.",
      icon: LayoutTemplate,
      button: "Coming Soon",
    },
  ];

  return (
    <div style={styles.wrapper}>
      <div style={styles.hero}>
        <h1 style={styles.title}>Resume Builder</h1>
        <p style={styles.subtitle}>
          Build ATS-friendly resumes using AI, job descriptions, prompt-based
          refinement, templates, resume versions, and download-ready formats.
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
                <div style={{ ...styles.btn, opacity: 0.65 }}>
                  {card.button}
                </div>
              )}
            </div>
          );
        })}
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
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                style={styles.select}
              >
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
            <label style={styles.label}>Choose Template</label>
            <select
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={styles.select}
            >
              {templates.map((template) => (
                <option key={template} value={template}>
                  {template}
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
          <button
            onClick={handleGenerateResume}
            disabled={loading}
            style={styles.generateBtn}
          >
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
            <button
              onClick={handleSaveVersion}
              disabled={saving}
              style={styles.saveBtn}
            >
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
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <FileText size={22} color="#c4b5fd" />
            Generated Resume Preview
          </h2>

          <div style={styles.previewGrid}>
            <div style={styles.previewCard}>
              <h3 style={styles.previewTitle}>Professional Summary</h3>
              <p style={styles.previewText}>
                {generatedResume.professionalSummary || "No summary generated"}
              </p>
            </div>

            <div style={styles.previewCard}>
              <h3 style={styles.previewTitle}>Skills</h3>
              <div style={styles.chips}>
                {generatedResume.skills?.length ? (
                  generatedResume.skills.map((skill, index) => (
                    <span key={index} style={styles.chip}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span style={styles.chip}>No skills generated</span>
                )}
              </div>
            </div>

            <div style={styles.previewCard}>
              <h3 style={styles.previewTitle}>Experience Bullets</h3>
              <ul style={styles.list}>
                {generatedResume.experienceBullets?.length ? (
                  generatedResume.experienceBullets.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))
                ) : (
                  <li>No experience bullets generated</li>
                )}
              </ul>
            </div>

            <div style={styles.previewCard}>
              <h3 style={styles.previewTitle}>Project Bullets</h3>
              <ul style={styles.list}>
                {generatedResume.projectBullets?.length ? (
                  generatedResume.projectBullets.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))
                ) : (
                  <li>No project bullets generated</li>
                )}
              </ul>
            </div>

            <div style={styles.previewCard}>
              <h3 style={styles.previewTitle}>Education</h3>
              <p style={styles.previewText}>
                {generatedResume.education || "No education detected"}
              </p>
            </div>

            <div style={styles.previewCard}>
              <h3 style={styles.previewTitle}>Selected Template</h3>
              <p style={styles.previewText}>
                {generatedResume.templateName || templateName}
              </p>
            </div>
          </div>

          <textarea
            value={generatedResume.fullResumeText || ""}
            readOnly
            style={styles.fullResumeBox}
          />
        </div>
      )}
    </div>
  );
};

export default ResumeBuilderPage;