const CorporateCleanTemplate = ({ resume }) => {
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
      <div style={styles.titleRow}>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <div style={styles.titleLine} />
      </div>
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
          <div>
            <h1 style={styles.name}>{name}</h1>
            <p style={styles.role}>{role}</p>
          </div>
          {contact && <p style={styles.contact}>{contact}</p>}
        </header>

        <main style={styles.body}>
          <Section title="Summary">
            <p style={styles.paragraph}>{rich(resume?.professionalSummary || "No professional summary generated.")}</p>
          </Section>

          <Section title="Skills">
            <p style={styles.skills}>
              {skills(resume?.skills).length ? skills(resume?.skills).join(" | ") : "No skills generated."}
            </p>
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
  paper: { width: "100%", maxWidth: "850px", minHeight: "980px", margin: "0 auto", background: "#ffffff", color: "#1e293b", boxShadow: "0 22px 60px rgba(0,0,0,.32)", fontFamily: "Georgia, 'Times New Roman', serif" },
  header: { padding: "35px 42px 26px", display: "flex", justifyContent: "space-between", gap: "24px", alignItems: "flex-end", borderBottom: "1px solid #334155" },
  name: { margin: 0, color: "#0f172a", fontSize: "31px", lineHeight: 1.1, fontWeight: 700 },
  role: { margin: "8px 0 0", color: "#475569", fontSize: "15px", fontWeight: 700 },
  contact: { margin: 0, maxWidth: "300px", color: "#475569", fontSize: "12px", lineHeight: 1.65, textAlign: "right" },
  body: { padding: "28px 42px 42px" },
  section: { marginBottom: "25px" },
  titleRow: { display: "flex", gap: "12px", alignItems: "center", marginBottom: "10px" },
  sectionTitle: { margin: 0, color: "#0f172a", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", whiteSpace: "nowrap" },
  titleLine: { flex: 1, height: "1px", background: "#94a3b8" },
  paragraph: { margin: 0, color: "#334155", fontSize: "13px", lineHeight: 1.78 },
  skills: { margin: 0, color: "#334155", fontSize: "13px", lineHeight: 1.75, fontWeight: 700 },
  list: { margin: 0, paddingLeft: "20px", color: "#334155", fontSize: "13px", lineHeight: 1.8 },
};

export default CorporateCleanTemplate;
