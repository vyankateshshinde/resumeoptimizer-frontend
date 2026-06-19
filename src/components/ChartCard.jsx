const ChartCard = ({ title, subtitle, children }) => {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.subtitle}>{subtitle}</p>
      </div>

      <div style={styles.body}>{children}</div>
    </div>
  );
};

const styles = {
  card: {
    background: "rgba(15,23,42,.88)",
    border: "1px solid rgba(139,92,246,.18)",
    borderRadius: "20px",
    padding: "20px",
    minHeight: "245px",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "14px",
  },
  title: {
    margin: 0,
    color: "#fff",
    fontSize: "18px",
    fontWeight: 900,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
  },
  body: {
    width: "100%",
    height: "185px",
  },
};

export default ChartCard;