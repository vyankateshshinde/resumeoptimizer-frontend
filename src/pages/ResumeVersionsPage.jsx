import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Copy,
  Eye,
  FileText,
  Loader2,
  Trash2,
  Download,
  Sparkles,
  FileDown,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";

const ResumeVersionsPage = () => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/resume-versions/my-versions");
      setVersions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load resume versions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleView = (version) => {
    setSelectedVersion(version);
  };

  const handleDuplicate = async (id) => {
    try {
      await axiosInstance.post(`/api/resume-versions/duplicate/${id}`);
      toast.success("Resume version duplicated");
      fetchVersions();
    } catch (error) {
      console.error(error);
      toast.error("Failed to duplicate version");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resume version?")) return;

    try {
      await axiosInstance.delete(`/api/resume-versions/${id}`);
      toast.success("Resume version deleted");
      fetchVersions();

      if (selectedVersion?.id === id) {
        setSelectedVersion(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete version");
    }
  };

  const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = fileName;
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleDownloadText = () => {
    if (!selectedVersion) {
      toast.error("Select a version first");
      return;
    }

    const content = selectedVersion.fullResumeText || "";
    const blob = new Blob([content], { type: "text/plain" });
    downloadBlob(blob, `${selectedVersion.versionName || "resume-version"}.txt`);
  };

  const handleDownloadPdf = async () => {
    if (!selectedVersion) {
      toast.error("Select a version first");
      return;
    }

    try {
      setDownloading(true);

      const response = await axiosInstance.get(
        `/api/resume-versions/${selectedVersion.id}/download/pdf`,
        { responseType: "blob" }
      );

      downloadBlob(
        response.data,
        `${selectedVersion.versionName || "resume-version"}.pdf`
      );

      toast.success("PDF downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!selectedVersion) {
      toast.error("Select a version first");
      return;
    }

    try {
      setDownloading(true);

      const response = await axiosInstance.get(
        `/api/resume-versions/${selectedVersion.id}/download/docx`,
        { responseType: "blob" }
      );

      downloadBlob(
        response.data,
        `${selectedVersion.versionName || "resume-version"}.docx`
      );

      toast.success("DOCX downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download DOCX");
    } finally {
      setDownloading(false);
    }
  };

  const styles = {
    page: { color: "#fff" },
    hero: {
      background:
        "linear-gradient(135deg, rgba(139,92,246,.22), rgba(79,70,229,.12))",
      border: "1px solid rgba(139,92,246,.25)",
      borderRadius: "24px",
      padding: "28px",
      marginBottom: "24px",
    },
    title: { margin: 0, fontSize: "32px", fontWeight: 950 },
    subtitle: {
      marginTop: "10px",
      color: "#cbd5e1",
      lineHeight: 1.6,
    },
    layout: {
      display: "grid",
      gridTemplateColumns: "minmax(300px, 420px) minmax(320px, 1fr)",
      gap: "20px",
      alignItems: "start",
    },
    listPanel: {
      background: "rgba(15,23,42,.72)",
      border: "1px solid rgba(139,92,246,.16)",
      borderRadius: "22px",
      padding: "18px",
    },
    card: {
      background: "rgba(15,23,42,.95)",
      border: "1px solid rgba(139,92,246,.22)",
      borderRadius: "20px",
      padding: "20px",
      marginBottom: "16px",
    },
    activeCard: {
      border: "1px solid rgba(34,197,94,.65)",
      boxShadow: "0 0 0 1px rgba(34,197,94,.25)",
    },
    cardTitle: {
      margin: 0,
      fontSize: "18px",
      fontWeight: 900,
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    meta: {
      marginTop: "8px",
      color: "#94a3b8",
      fontSize: "13px",
    },
    scoreBadge: {
      marginTop: "12px",
      display: "inline-flex",
      padding: "7px 11px",
      borderRadius: "999px",
      background: "rgba(34,197,94,.12)",
      border: "1px solid rgba(34,197,94,.25)",
      color: "#86efac",
      fontSize: "12px",
      fontWeight: 900,
    },
    actions: {
      marginTop: "16px",
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },
    btn: {
      border: "none",
      borderRadius: "12px",
      padding: "10px 13px",
      color: "#fff",
      fontWeight: 850,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "7px",
      background: "linear-gradient(90deg,#8b5cf6,#4f46e5)",
    },
    greenBtn: {
      background: "linear-gradient(90deg,#22c55e,#16a34a)",
    },
    deleteBtn: {
      background: "rgba(239,68,68,.18)",
      border: "1px solid rgba(239,68,68,.28)",
      color: "#fca5a5",
    },
    preview: {
      background: "rgba(15,23,42,.95)",
      border: "1px solid rgba(139,92,246,.22)",
      borderRadius: "22px",
      padding: "24px",
      minHeight: "520px",
    },
    previewHeader: {
      display: "flex",
      justifyContent: "space-between",
      gap: "14px",
      alignItems: "flex-start",
      flexWrap: "wrap",
      marginBottom: "18px",
    },
    sectionTitle: {
      margin: "20px 0 8px",
      color: "#c4b5fd",
      fontWeight: 900,
      fontSize: "15px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    text: {
      color: "#cbd5e1",
      lineHeight: 1.7,
      whiteSpace: "pre-wrap",
      fontSize: "14px",
    },
    fullResume: {
      marginTop: "12px",
      background: "#020617",
      border: "1px solid #334155",
      borderRadius: "16px",
      padding: "18px",
      color: "#e5e7eb",
      lineHeight: 1.75,
      whiteSpace: "pre-wrap",
      fontSize: "14px",
      minHeight: "220px",
    },
    empty: {
      padding: "28px",
      borderRadius: "18px",
      border: "1px dashed rgba(139,92,246,.25)",
      color: "#94a3b8",
      textAlign: "center",
      lineHeight: 1.6,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.title}>My Resume Library</h1>
        <p style={styles.subtitle}>
          View saved resume versions, duplicate previous resumes, delete old
          versions, compare changes, and download PDF/DOCX.
        </p>
      </div>

      <div style={styles.layout}>
        <div style={styles.listPanel}>
          {loading ? (
            <div style={styles.empty}>
              <Loader2 size={22} /> Loading resume versions...
            </div>
          ) : versions.length > 0 ? (
            versions.map((version) => {
              const isActive = selectedVersion?.id === version.id;

              return (
                <div
                  key={version.id}
                  style={{
                    ...styles.card,
                    ...(isActive ? styles.activeCard : {}),
                  }}
                >
                  <h2 style={styles.cardTitle}>
                    <FileText size={19} color="#c4b5fd" />
                    {version.versionName || "Untitled Version"}
                  </h2>

                  <div style={styles.meta}>
                    Template: {version.templateName || "N/A"}
                  </div>

                  <div style={styles.meta}>
                    Created:{" "}
                    {version.createdAt
                      ? new Date(version.createdAt).toLocaleString()
                      : "N/A"}
                  </div>

                  <div style={styles.scoreBadge}>
                    ATS Score: {version.atsScore ?? 0}%
                  </div>

                  <div style={styles.actions}>
                    <button style={styles.btn} onClick={() => handleView(version)}>
                      <Eye size={16} /> View
                    </button>

                    <button
                      style={styles.btn}
                      onClick={() => handleDuplicate(version.id)}
                    >
                      <Copy size={16} /> Duplicate
                    </button>

                    <button
                      style={{ ...styles.btn, ...styles.deleteBtn }}
                      onClick={() => handleDelete(version.id)}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={styles.empty}>No saved resume versions yet.</div>
          )}
        </div>

        <div style={styles.preview}>
          {selectedVersion ? (
            <>
              <div style={styles.previewHeader}>
                <div>
                  <h2 style={styles.cardTitle}>
                    <FileText size={19} color="#c4b5fd" />
                    {selectedVersion.versionName}
                  </h2>
                  <div style={styles.meta}>
                    Template: {selectedVersion.templateName || "N/A"}
                  </div>
                  <div style={styles.meta}>
                    ATS Score: {selectedVersion.atsScore ?? 0}%
                  </div>
                </div>

                <div style={styles.actions}>
                  <button style={styles.btn} onClick={handleDownloadText}>
                    <Download size={16} /> TXT
                  </button>

                  <button
                    style={{ ...styles.btn, ...styles.greenBtn }}
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                  >
                    <FileDown size={16} /> PDF
                  </button>

                  <button
                    style={{ ...styles.btn, ...styles.greenBtn }}
                    onClick={handleDownloadDocx}
                    disabled={downloading}
                  >
                    <FileDown size={16} /> DOCX
                  </button>
                </div>
              </div>

              <div style={styles.sectionTitle}>
                <Sparkles size={16} /> Professional Summary
              </div>
              <div style={styles.text}>
                {selectedVersion.professionalSummary || "No summary available"}
              </div>

              <div style={styles.sectionTitle}>Skills</div>
              <div style={styles.text}>
                {selectedVersion.skills || "No skills available"}
              </div>

              <div style={styles.sectionTitle}>Experience</div>
              <div style={styles.text}>
                {selectedVersion.experienceBullets ||
                  "No experience bullets available"}
              </div>

              <div style={styles.sectionTitle}>Projects</div>
              <div style={styles.text}>
                {selectedVersion.projectBullets || "No project bullets available"}
              </div>

              <div style={styles.sectionTitle}>Education</div>
              <div style={styles.text}>
                {selectedVersion.education || "No education available"}
              </div>

              <div style={styles.sectionTitle}>Full Resume Text</div>
              <div style={styles.fullResume}>
                {selectedVersion.fullResumeText || "No resume text available"}
              </div>
            </>
          ) : (
            <div style={styles.empty}>Select a resume version to preview.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeVersionsPage;