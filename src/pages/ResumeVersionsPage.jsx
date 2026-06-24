import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Eye, FileText, Loader2, Trash2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance";

const ResumeVersionsPage = () => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const styles = {
    page: { color: "#fff" },
    hero: {
      background: "linear-gradient(135deg, rgba(139,92,246,.22), rgba(79,70,229,.12))",
      border: "1px solid rgba(139,92,246,.25)",
      borderRadius: "24px",
      padding: "28px",
      marginBottom: "24px",
    },
    title: { margin: 0, fontSize: "32px", fontWeight: 950 },
    subtitle: { marginTop: "10px", color: "#cbd5e1", lineHeight: 1.6 },
    layout: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "20px",
      alignItems: "start",
    },
    card: {
      background: "rgba(15,23,42,.95)",
      border: "1px solid rgba(139,92,246,.22)",
      borderRadius: "20px",
      padding: "20px",
      marginBottom: "16px",
    },
    cardTitle: {
      margin: 0,
      fontSize: "18px",
      fontWeight: 900,
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    meta: { marginTop: "8px", color: "#94a3b8", fontSize: "13px" },
    actions: { marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" },
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
    deleteBtn: {
      background: "rgba(239,68,68,.18)",
      border: "1px solid rgba(239,68,68,.28)",
      color: "#fca5a5",
    },
    preview: {
      background: "rgba(15,23,42,.95)",
      border: "1px solid rgba(139,92,246,.22)",
      borderRadius: "20px",
      padding: "22px",
      minHeight: "320px",
    },
    sectionTitle: { margin: "18px 0 8px", color: "#c4b5fd", fontWeight: 900 },
    text: { color: "#cbd5e1", lineHeight: 1.7, whiteSpace: "pre-wrap", fontSize: "14px" },
    empty: {
      padding: "28px",
      borderRadius: "18px",
      border: "1px dashed rgba(139,92,246,.25)",
      color: "#94a3b8",
      textAlign: "center",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.title}>My Resume Library</h1>
        <p style={styles.subtitle}>
          View saved resume versions, duplicate previous resumes, delete old versions, and preview optimized content.
        </p>
      </div>

      <div style={styles.layout}>
        <div>
          {loading ? (
            <div style={styles.empty}>
              <Loader2 size={22} /> Loading resume versions...
            </div>
          ) : versions.length > 0 ? (
            versions.map((version) => (
              <div key={version.id} style={styles.card}>
                <h2 style={styles.cardTitle}>
                  <FileText size={19} color="#c4b5fd" />
                  {version.versionName || "Untitled Version"}
                </h2>

                <div style={styles.meta}>Template: {version.templateName || "N/A"}</div>
                <div style={styles.meta}>ATS Score: {version.atsScore ?? 0}%</div>
                <div style={styles.meta}>
                  Created:{" "}
                  {version.createdAt
                    ? new Date(version.createdAt).toLocaleString()
                    : "N/A"}
                </div>

                <div style={styles.actions}>
                  <button style={styles.btn} onClick={() => handleView(version)}>
                    <Eye size={16} /> View
                  </button>

                  <button style={styles.btn} onClick={() => handleDuplicate(version.id)}>
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
            ))
          ) : (
            <div style={styles.empty}>No saved resume versions yet.</div>
          )}
        </div>

        <div style={styles.preview}>
          {selectedVersion ? (
            <>
              <h2 style={styles.cardTitle}>
                <FileText size={19} color="#c4b5fd" />
                {selectedVersion.versionName}
              </h2>

              <div style={styles.sectionTitle}>Professional Summary</div>
              <div style={styles.text}>
                {selectedVersion.professionalSummary || "No summary available"}
              </div>

              <div style={styles.sectionTitle}>Skills</div>
              <div style={styles.text}>
                {selectedVersion.skills || "No skills available"}
              </div>

              <div style={styles.sectionTitle}>Experience</div>
              <div style={styles.text}>
                {selectedVersion.experienceBullets || "No experience bullets available"}
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
              <div style={styles.text}>
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