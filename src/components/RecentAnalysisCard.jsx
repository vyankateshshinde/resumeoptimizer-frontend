const RecentAnalysisCard = ({ items = [] }) => {
  const fallback = [
    { title: "Java Full Stack Resume", score: 82, status: "Strong Match" },
    { title: "Spring Boot Developer JD", score: 76, status: "Needs Skills" },
    { title: "React + Java Role", score: 88, status: "Excellent" },
  ];

  const list = items.length ? items : fallback;

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Recent ATS Analyses</h3>
      <p style={styles.subtitle}>Latest optimization activity</p>

      <div style={styles.list}>
        {list.map((item, index) => (
          <div key={index} style={styles.item}>
            <div style={{ minWidth: 0 }}>
              <h4 style={styles.itemTitle}>{item.title}</h4>
              <p style={styles.status}>{item.status}</p>
            </div>

            <div style={styles.score}>{item.score}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: "rgba(15,23,42,.88)",
    border: "1px solid rgba(139,92,246,.18)",
    borderRadius: "20px",
    padding: "20px",
    minHeight: "230px",
    boxSizing: "border-box",
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
  list: {
    marginTop: "16px",
    display: "grid",
    gap: "10px",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    background: "rgba(30,41,59,.65)",
    border: "1px solid rgba(148,163,184,.12)",
    borderRadius: "15px",
    padding: "12px",
  },
  itemTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "13px",
    fontWeight: 850,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  status: {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
  },
  score: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    background: "rgba(139,92,246,.16)",
    color: "#c4b5fd",
    fontWeight: 900,
    fontSize: "13px",
    flexShrink: 0,
  },
};

export default RecentAnalysisCard;