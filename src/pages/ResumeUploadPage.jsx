import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileSearch,
  Sparkles,
  BarChart3,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";

const ResumeUploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Only PDF, DOC, or DOCX files are allowed");
      return;
    }

    setFile(selectedFile);
    setUploadedResume(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a resume file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await axiosInstance.post("/api/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadedResume(res.data);
      localStorage.setItem("selectedResume", JSON.stringify(res.data));

      toast.success("Resume uploaded successfully");

      navigate("/ats-analysis", {
        state: {
          resume: res.data,
        },
      });
    } catch (error) {
      toast.error("Resume upload failed");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: { width: "100%", color: "#ffffff" },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "20px",
      flexWrap: "wrap",
      marginBottom: "28px",
    },
    badge: { margin: 0, color: "#a78bfa", fontSize: "14px", fontWeight: 900 },
    title: {
      margin: "8px 0 0",
      fontSize: "clamp(28px, 4vw, 40px)",
      fontWeight: 950,
      letterSpacing: "-1px",
    },
    subtitle: {
      margin: "10px 0 0",
      color: "#94a3b8",
      fontSize: "15px",
      lineHeight: 1.7,
      maxWidth: "680px",
    },
    backLink: {
      height: "44px",
      padding: "0 16px",
      borderRadius: "14px",
      background: "rgba(15,23,42,.9)",
      border: "1px solid rgba(139,92,246,.22)",
      color: "#c4b5fd",
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      fontWeight: 800,
      whiteSpace: "nowrap",
    },
    layout: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "24px",
      alignItems: "stretch",
    },
    card: {
      background: "rgba(15,23,42,.88)",
      border: "1px solid rgba(139,92,246,.18)",
      borderRadius: "28px",
      padding: "clamp(22px, 4vw, 34px)",
    },
    dropZone: {
      border: file
        ? "1.5px solid rgba(34,197,94,.55)"
        : "1.5px dashed rgba(139,92,246,.45)",
      background: file ? "rgba(34,197,94,.08)" : "rgba(30,41,59,.55)",
      borderRadius: "24px",
      padding: "clamp(26px, 5vw, 46px)",
      textAlign: "center",
      cursor: "pointer",
    },
    uploadIcon: {
      width: "72px",
      height: "72px",
      borderRadius: "24px",
      margin: "0 auto 18px",
      display: "grid",
      placeItems: "center",
      background: "linear-gradient(135deg,#8b5cf6,#4f46e5)",
    },
    dropTitle: { margin: 0, fontSize: "22px", fontWeight: 900 },
    dropText: {
      margin: "10px 0 0",
      color: "#94a3b8",
      fontSize: "14px",
      lineHeight: 1.6,
    },
    fileBox: {
      marginTop: "18px",
      background: "rgba(15,23,42,.75)",
      border: "1px solid rgba(148,163,184,.14)",
      borderRadius: "18px",
      padding: "14px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      textAlign: "left",
    },
    button: {
      marginTop: "22px",
      width: "100%",
      height: "54px",
      border: "none",
      borderRadius: "16px",
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: 900,
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.7 : 1,
      background: "linear-gradient(90deg,#8b5cf6,#4f46e5)",
    },
    hiddenInput: { display: "none" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.badge}>Resume Upload</p>
          <h1 style={styles.title}>Upload Resume for ATS Analysis</h1>
          <p style={styles.subtitle}>
            Upload your resume. After upload, you will directly continue to ATS Analysis.
          </p>
        </div>

        <Link to="/dashboard" style={styles.backLink}>
          ← Back to Dashboard
        </Link>
      </div>

      <div style={styles.layout}>
        <div style={styles.card}>
          <form onSubmit={handleUpload}>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              style={styles.hiddenInput}
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />

            <div
              style={styles.dropZone}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files[0]);
              }}
            >
              <div style={styles.uploadIcon}>
                <UploadCloud size={34} />
              </div>

              <h2 style={styles.dropTitle}>
                {file ? "Resume Selected" : "Drag & Drop Resume"}
              </h2>

              <p style={styles.dropText}>
                {file
                  ? "Your file is ready to upload."
                  : "Drop your resume here or click to browse."}
                <br />
                Supported formats: PDF, DOC, DOCX
              </p>

              {file && (
                <div style={styles.fileBox}>
                  <FileText color="#c4b5fd" size={26} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 850 }}>{file.name}</p>
                    <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "12px" }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" style={styles.button}>
              {loading ? "Uploading..." : "Upload & Continue to ATS Analysis"}
            </button>
          </form>
        </div>

        <div style={styles.card}>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 900 }}>
            What happens next?
          </h2>

          <div style={{ marginTop: "22px", display: "grid", gap: "16px" }}>
            <Info icon={<FileSearch />} title="Resume Parsing" />
            <Info icon={<BarChart3 />} title="ATS Score Calculation" />
            <Info icon={<Sparkles />} title="AI Recommendations" />
            <Info icon={<ShieldCheck />} title="Secure Processing" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Info = ({ icon, title }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "14px",
      background: "rgba(30,41,59,.55)",
      border: "1px solid rgba(148,163,184,.12)",
      borderRadius: "18px",
      padding: "16px",
      color: "#cbd5e1",
      fontWeight: 800,
    }}
  >
    <div style={{ color: "#a78bfa" }}>{icon}</div>
    {title}
  </div>
);

export default ResumeUploadPage;