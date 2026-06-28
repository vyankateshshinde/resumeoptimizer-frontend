const ModernDeveloperTemplate = ({ resume }) => {
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

  const MainSection = ({ title, children }) => (
    <section style={styles.mainSection}>
      <h2 style={styles.mainTitle}>{title}</h2>
      <div style={styles.mainLine} />
      {children}
    </section>
  );

  const SideSection = ({ title, children }) => (
    <section style={styles.sideSection}>
      <h2 style={styles.sideTitle}>{title}</h2>
      <div style={styles.sideLine} />
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
        <aside style={styles.sidebar}>
          <h1 style={styles.name}>{name}</h1>
          <p style={styles.role}>{role}</p>
          {contact && <p style={styles.contact}>{contact}</p>}

          <SideSection title="Skills">
            <div style={styles.skillList}>
              {skills(resume?.skills).length ? skills(resume?.skills).map((skill, index) => (
                <span key={index} style={styles.skill}>{skill}</span>
              )) : <span style={styles.sideText}>No skills generated.</span>}
            </div>
          </SideSection>

          <SideSection title="Education">
            <p style={styles.sideText}>{rich(resume?.education || "No education added.")}</p>
          </SideSection>
        </aside>

        <main style={styles.main}>
          <MainSection title="Profile">
            <p style={styles.paragraph}>{rich(resume?.professionalSummary || "No professional summary generated.")}</p>
          </MainSection>
          <MainSection title="Experience"><List value={resume?.experienceBullets} /></MainSection>
          <MainSection title="Projects"><List value={resume?.projectBullets} /></MainSection>
        </main>
      </article>
    </div>
  );
};

const styles = {
  canvas: { marginTop: "20px", padding: "22px", borderRadius: "20px", overflowX: "auto", background: "rgba(2,6,23,.75)", border: "1px solid rgba(148,163,184,.16)" },
  paper: { width: "100%", maxWidth: "900px", minHeight: "980px", margin: "0 auto", display: "grid", gridTemplateColumns: "250px minmax(0, 1fr)", background: "#ffffff", color: "#172033", boxShadow: "0 22px 60px rgba(0,0,0,.32)", fontFamily: "Arial, Helvetica, sans-serif" },
  sidebar: { padding: "34px 26px", background: "#0f2747", color: "#ffffff" },
  name: { margin: 0, color: "#ffffff", fontSize: "27px", lineHeight: 1.14, fontWeight: 800 },
  role: { margin: "10px 0 0", color: "#93c5fd", fontSize: "14px", lineHeight: 1.5, fontWeight: 700 },
  contact: { margin: "18px 0 0", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,.2)", color: "#dbeafe", fontSize: "12px", lineHeight: 1.65 },
  sideSection: { marginTop: "34px" },
  sideTitle: { margin: 0, color: "#ffffff", fontSize: "13px", letterSpacing: ".7px", fontWeight: 800, textTransform: "uppercase" },
  sideLine: { width: "42px", height: "3px", margin: "8px 0 12px", background: "#60a5fa" },
  skillList: { display: "flex", flexWrap: "wrap", gap: "7px" },
  skill: { padding: "6px 8px", borderRadius: "5px", background: "rgba(96,165,250,.16)", border: "1px solid rgba(147,197,253,.32)", color: "#e0f2fe", fontSize: "11px", lineHeight: 1.25, fontWeight: 700 },
  sideText: { margin: 0, color: "#dbeafe", fontSize: "12px", lineHeight: 1.7 },
  main: { padding: "38px 36px" },
  mainSection: { marginBottom: "30px" },
  mainTitle: { margin: 0, color: "#0f2747", fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".7px" },
  mainLine: { height: "2px", background: "#2563eb", margin: "8px 0 12px" },
  paragraph: { margin: 0, color: "#263548", fontSize: "13px", lineHeight: 1.8 },
  list: { margin: 0, paddingLeft: "20px", color: "#263548", fontSize: "13px", lineHeight: 1.8 },
};

export default ModernDeveloperTemplate;
