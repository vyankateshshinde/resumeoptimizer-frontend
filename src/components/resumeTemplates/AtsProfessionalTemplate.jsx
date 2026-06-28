const AtsProfessionalTemplate = ({ resume }) => {
  const bullets = (value) =>
    Array.isArray(value)
      ? value.filter(Boolean)
      : String(value || "")
          .split("\n")
          .map((item) => item.replace(/^[-•]\s*/, "").trim())
          .filter(Boolean);

  const skills = (value) =>
    Array.isArray(value)
      ? value.filter(Boolean)
      : String(value || "")
          .split(/,|\n/)
          .map((item) => item.trim())
          .filter(Boolean);

  const rich = (text) =>
    String(text || "").split(/(\*\*.*?\*\*)/g).map((part, index) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={index}>{part}</span>
      )
    );

  const Section = ({ title, children }) => (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div style={styles.line} />
      {children}
    </section>
  );

  const List = ({ value }) => {
    const items = bullets(value);
    return (
      <ul style={styles.list}>
        {items.length ? items.map((item, index) => <li key={index}>{rich(item)}</li>) : <li>No content added yet.</li>}
      </ul>
    );
  };

  const name = resume?.fullName || resume?.name || "Your Name";
  const role = resume?.targetRole || resume?.role || "Java Full Stack Developer";
  const contact = resume?.contact || resume?.contactLine || "";

  return (
    <div style={styles.canvas}>
      <article style={styles.paper}>
        <header style={styles.header}>
          <h1 style={styles.name}>{name}</h1>
          <p style={styles.role}>{role}</p>
          {contact && <p style={styles.contact}>{contact}</p>}
        </header>

        <main style={styles.body}>
          <Section title="Professional Summary">
            <p style={styles.paragraph}>{rich(resume?.professionalSummary || "No professional summary generated.")}</p>
          </Section>

          <Section title="Technical Skills">
            <p style={styles.skills}>
              {skills(resume?.skills).length ? skills(resume?.skills).join("  •  ") : "No skills generated."}
            </p>
          </Section>

          <Section title="Professional Experience"><List value={resume?.experienceBullets} /></Section>
          <Section title="Projects"><List value={resume?.projectBullets} /></Section>

          <Section title="Education">
            <p style={styles.paragraph}>{rich(resume?.education || "No education added.")}</p>
          </Section>
        </main>
      </article>
    </div>
  );
};

const styles = {
  canvas: { marginTop: "20px", padding: "22px", borderRadius: "20px", overflowX: "auto", background: "rgba(2,6,23,.75)", border: "1px solid rgba(148,163,184,.16)" },
  paper: { width: "100%", maxWidth: "850px", minHeight: "980px", margin: "0 auto", background: "#ffffff", color: "#111827", boxShadow: "0 22px 60px rgba(0,0,0,.32)", fontFamily: "Arial, Helvetica, sans-serif" },
  header: { padding: "34px 42px 24px", textAlign: "center", background: "#f8fafc", borderBottom: "4px solid #1d4ed8" },
  name: { margin: 0, fontSize: "30px", color: "#111827", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".2px" },
  role: { margin: "9px 0 0", color: "#1d4ed8", fontSize: "15px", fontWeight: 700 },
  contact: { margin: "10px 0 0", color: "#374151", fontSize: "12px", lineHeight: 1.6 },
  body: { padding: "28px 42px 42px" },
  section: { marginBottom: "24px" },
  sectionTitle: { margin: 0, fontSize: "13px", color: "#111827", fontWeight: 800, letterSpacing: ".75px", textTransform: "uppercase" },
  line: { height: "2px", background: "#1d4ed8", margin: "7px 0 12px" },
  paragraph: { margin: 0, color: "#1f2937", fontSize: "13px", lineHeight: 1.78 },
  skills: { margin: 0, color: "#1f2937", fontSize: "13px", lineHeight: 1.75, fontWeight: 600 },
  list: { margin: 0, paddingLeft: "20px", color: "#1f2937", fontSize: "13px", lineHeight: 1.78 },
};

export default AtsProfessionalTemplate;
