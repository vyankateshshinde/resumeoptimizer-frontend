const StatCard = ({ title, value, icon: Icon, suffix = "", hint }) => {
  return (
    <div style={styles.card}>
      <div style={styles.top}>
        <div>
          <p style={styles.title}>{title}</p>
          <h2 style={styles.value}>
            {value}
            {suffix}
          </h2>
        </div>

        <div style={styles.iconBox}>
          <Icon size={20} />
        </div>
      </div>

      <p style={styles.hint}>{hint}</p>
    </div>
  );
};

const styles = {
  card: {
    background: "rgba(15,23,42,.88)",
    border: "1px solid rgba(139,92,246,.18)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 18px 50px rgba(15,23,42,.35)",
    boxSizing: "border-box",
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
  },
  title: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: 800,
  },
  value: {
    margin: "7px 0 0",
    fontSize: "28px",
    color: "#fff",
    fontWeight: 950,
  },
  iconBox: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#8b5cf6,#4f46e5)",
    display: "grid",
    placeItems: "center",
    color: "#fff",
    flexShrink: 0,
  },
  hint: {
    margin: "12px 0 0",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.4,
  },
};

export default StatCard;