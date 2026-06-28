const MinimalTechTemplate = ({ resume }) => {
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
        <div style={styles.topBar} />
        <header style={styles.header}>
          <h1 style={styles.name}>{name}</h1>
          <p style={styles.role}>{role}</p>
          {contact && <p style={styles.contact}>{contact}</p>}
        </header>

        <main style={styles.body}>
          <Section title="Summary">
            <p style={styles.paragraph}>{rich(resume?.professionalSummary || "No professional summary generated.")}</p>
          </Section>

          <Section title="Skills">
            <div style={styles.skillGrid}>
              {skills(resume?.skills).length ? skills(resume?.skills).map((skill, index) => (
                <span key={index} style={styles.skill}>{skill}</span>
              )) : <span style={styles.paragraph}>No skills generated.</span>}
            </div>
          </Section>

          <Section title="Experience"><List value={resume?.experienceBullets} /></Section>
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
  paper: { width: "100%", maxWidth: "850px", minHeight: "980px", margin: "0 auto", background: "#ffffff", color: "#111827", boxShadow: "0 22px 60px rgba(0,0,0,.32)", fontFamily: "Inter, Arial, Helvetica, sans-serif" },
  topBar: { height: "9px", background: "#0f766e" },
  header: { padding: "31px 42px 22px" },
  name: { margin: 0, color: "#111827", fontSize: "31px", fontWeight: 800, letterSpacing: "-.5px" },
  role: { margin: "7px 0 0", color: "#0f766e", fontSize: "15px", fontWeight: 700 },
  contact: { margin: "10px 0 0", color: "#4b5563", fontSize: "12px", lineHeight: 1.6 },
  body: { padding: "0 42px 42px" },
  section: { marginTop: "24px" },
  sectionTitle: { margin: 0, color: "#0f766e", fontSize: "13px", letterSpacing: ".85px", textTransform: "uppercase", fontWeight: 800 },
  paragraph: { margin: "9px 0 0", color: "#1f2937", fontSize: "13px", lineHeight: 1.78 },
  skillGrid: { marginTop: "11px", display: "flex", flexWrap: "wrap", gap: "7px" },
  skill: { padding: "6px 9px", borderRadius: "4px", background: "#ecfdf5", border: "1px solid #99f6e4", color: "#115e59", fontSize: "11px", fontWeight: 700 },
  list: { margin: "9px 0 0", paddingLeft: "20px", color: "#1f2937", fontSize: "13px", lineHeight: 1.8 },
};

export default MinimalTechTemplate;
