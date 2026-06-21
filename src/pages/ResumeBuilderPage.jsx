import { Link } from "react-router-dom";
import { Sparkles, FilePenLine, Library, LayoutTemplate } from "lucide-react";

const ResumeBuilderPage = () => {
  const cards = [
    {
      title: "Build With AI",
      description:
        "Upload resume, paste job description, generate optimized resume, refine with prompts, and save versions.",
      icon: Sparkles,
      path: "/prompt-editor",
      button: "Start AI Builder",
    },
    {
      title: "Build From Scratch",
      description:
        "Create resume manually by adding summary, skills, experience, projects, education, and certifications.",
      icon: FilePenLine,
      path: "#",
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
        "Choose from top ATS-friendly resume templates suitable for software, backend, frontend, and full stack roles.",
      icon: LayoutTemplate,
      path: "#",
      button: "Coming Soon",
    },
  ];

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
      maxWidth: "760px",
      lineHeight: 1.6,
      fontSize: "15px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "20px",
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
    },
  };

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

              {card.path === "#" ? (
                <div style={{ ...styles.btn, opacity: 0.55 }}>
                  {card.button}
                </div>
              ) : (
                <Link to={card.path} style={styles.btn}>
                  {card.button}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResumeBuilderPage;