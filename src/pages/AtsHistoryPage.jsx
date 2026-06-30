import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileSearch,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { setUserStorageItem } from "../utils/userStorage";

const HISTORY_ENDPOINT = "/api/ats/history";

const safeArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // This can be a comma-separated value from an older saved analysis.
    }

    return value
      .split(/\n|,|•/)
      .map((item) => item.replace(/^[-–—•\s]+/, "").trim())
      .filter(Boolean);
  }

  return [];
};

const unwrapList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeAnalysis = (item, index) => ({
  ...item,
  id: item?.id ?? item?.analysisId ?? `${item?.createdAt || item?.created_at || "analysis"}-${index}`,
  resumeId: Number(item?.resumeId ?? item?.resume?.id ?? 0),
  resumeName:
    item?.resumeFileName ||
    item?.fileName ||
    item?.resumeName ||
    item?.resume?.fileName ||
    (item?.resumeId ? `Resume #${item.resumeId}` : "Uploaded resume"),
  jobDescription: String(item?.jobDescription ?? item?.jd ?? item?.jobDesc ?? "").trim(),
  atsScore: Math.max(0, Math.min(100, Number(item?.atsScore ?? item?.finalScore ?? item?.score ?? 0))),
  matchedSkills: safeArray(item?.matchedSkills ?? item?.matchedKeywords),
  missingSkills: safeArray(item?.missingSkills ?? item?.missingKeywords),
  strengths: safeArray(item?.strengths),
  weaknesses: safeArray(item?.weaknesses ?? item?.improvementAreas),
  recommendations: safeArray(item?.recommendations ?? item?.feedback),
  createdAt: item?.createdAt ?? item?.created_at ?? item?.analyzedAt ?? item?.analysisDate ?? null,
});

const formatDate = (value) => {
  if (!value) return "Recently saved";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently saved";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatRelativeDate = (value) => {
  if (!value) return "Saved analysis";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved analysis";

  const diff = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
};

const scoreTone = (score) => {
  if (score >= 80) return "excellent";
  if (score >= 65) return "good";
  if (score >= 45) return "attention";
  return "low";
};

const scoreLabel = (score) => {
  if (score >= 80) return "Strong match";
  if (score >= 65) return "Good match";
  if (score >= 45) return "Needs tuning";
  return "Low match";
};

const getErrorMessage = (error, fallback) => {
  const body = error?.response?.data;
  return body?.message || (typeof body === "string" ? body : fallback);
};

const fetchHistory = async () => {
  const response = await axiosInstance.get(HISTORY_ENDPOINT);
  return unwrapList(response.data);
};

const AtsHistoryPage = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadHistory = async ({ quiet = false } = {}) => {
    try {
      if (!quiet) setLoading(true);
      setErrorMessage("");

      const responseList = await fetchHistory();
      const normalized = responseList
        .map(normalizeAnalysis)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setAnalyses(normalized);
      setSelectedId((current) =>
        normalized.some((analysis) => String(analysis.id) === String(current))
          ? current
          : normalized[0]?.id ?? null
      );
    } catch (error) {
      console.error(error);
      const message = getErrorMessage(error, "Failed to load ATS analysis history");
      setErrorMessage(message);
      if (!quiet) toast.error(message);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredAnalyses = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    const list = analyses.filter((analysis) => {
      const matchesQuery =
        !lowerQuery ||
        [analysis.resumeName, analysis.jobDescription, ...analysis.matchedSkills, ...analysis.missingSkills]
          .join(" ")
          .toLowerCase()
          .includes(lowerQuery);

      const matchesScore =
        scoreFilter === "all" ||
        (scoreFilter === "80" && analysis.atsScore >= 80) ||
        (scoreFilter === "65" && analysis.atsScore >= 65 && analysis.atsScore < 80) ||
        (scoreFilter === "45" && analysis.atsScore >= 45 && analysis.atsScore < 65) ||
        (scoreFilter === "low" && analysis.atsScore < 45);

      return matchesQuery && matchesScore;
    });

    return [...list].sort((first, second) => {
      if (sortBy === "highest") return second.atsScore - first.atsScore;
      if (sortBy === "lowest") return first.atsScore - second.atsScore;
      if (sortBy === "resume") return first.resumeName.localeCompare(second.resumeName);
      return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
    });
  }, [analyses, query, scoreFilter, sortBy]);

  const selectedAnalysis =
    filteredAnalyses.find((analysis) => String(analysis.id) === String(selectedId)) ||
    analyses.find((analysis) => String(analysis.id) === String(selectedId)) ||
    null;

  const metrics = useMemo(() => {
    const total = analyses.length;
    const average = total
      ? Math.round(analyses.reduce((sum, analysis) => sum + analysis.atsScore, 0) / total)
      : 0;
    const best = total ? Math.max(...analyses.map((analysis) => analysis.atsScore)) : 0;
    const ready = analyses.filter((analysis) => analysis.atsScore >= 80).length;
    return { total, average, best, ready };
  }, [analyses]);

  const openInAnalysis = (analysis) => {
    if (!analysis) return;

    const aiResult = {
      ...analysis,
      finalScore: analysis.atsScore,
    };

    setUserStorageItem("latestJobDescription", analysis.jobDescription || "");
    setUserStorageItem("latestAiAtsResult", JSON.stringify(aiResult));
    setUserStorageItem("latestAtsResult", JSON.stringify(aiResult));
    setUserStorageItem(
      "aiAtsAnalysisState",
      JSON.stringify({
        resumeId: analysis.resumeId || "",
        jobDescription: analysis.jobDescription || "",
        aiResult,
      })
    );

    navigate("/ats-analysis");
  };

  return (
    <div className="ah-page">
      <style>{styles}</style>

      <section className="ah-hero">
        <div>
          <p className="ah-eyebrow">Analysis workspace</p>
          <h1>ATS analysis history</h1>
          <p>
            Review every saved job match, compare score movement and reuse a previous
            job description without losing your work.
          </p>
        </div>
        <button className="ah-secondary-btn" onClick={() => loadHistory()} disabled={loading}>
          {loading ? <Loader2 className="ah-spin" size={16} /> : <RefreshCw size={16} />}
          Refresh history
        </button>
      </section>

      <section className="ah-stats-grid" aria-label="ATS history statistics">
        <MetricCard icon={<ClipboardList size={19} />} label="Saved analyses" value={metrics.total} helper="Across all resumes" />
        <MetricCard icon={<TrendingUp size={19} />} label="Average match" value={`${metrics.average}%`} helper="Across saved job descriptions" />
        <MetricCard icon={<Target size={19} />} label="Best match" value={`${metrics.best}%`} helper="Highest ATS score" />
        <MetricCard icon={<CheckCircle2 size={19} />} label="Strong matches" value={metrics.ready} helper="Scores of 80% or more" />
      </section>

      <section className="ah-toolbar" aria-label="History controls">
        <label className="ah-search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resume, skill or job description"
          />
        </label>

        <label className="ah-select-field">
          <span>Score</span>
          <select value={scoreFilter} onChange={(event) => setScoreFilter(event.target.value)}>
            <option value="all">All scores</option>
            <option value="80">80% and above</option>
            <option value="65">65% to 79%</option>
            <option value="45">45% to 64%</option>
            <option value="low">Below 45%</option>
          </select>
        </label>

        <label className="ah-select-field">
          <span>Sort by</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="latest">Most recent</option>
            <option value="highest">Highest score</option>
            <option value="lowest">Lowest score</option>
            <option value="resume">Resume name</option>
          </select>
        </label>
      </section>

      {loading ? (
        <section className="ah-state-card">
          <Loader2 className="ah-spin" size={24} />
          <h2>Loading ATS history</h2>
          <p>Your saved analyses are being prepared.</p>
        </section>
      ) : errorMessage ? (
        <section className="ah-state-card ah-error-card">
          <XCircle size={24} />
          <h2>We could not load your history</h2>
          <p>{errorMessage}</p>
          <button className="ah-primary-btn" onClick={() => loadHistory()}>Try again</button>
        </section>
      ) : !analyses.length ? (
        <section className="ah-state-card">
          <Sparkles size={26} />
          <h2>No ATS analyses yet</h2>
          <p>Run an AI ATS analysis first. Your saved results will appear here automatically.</p>
          <button className="ah-primary-btn" onClick={() => navigate("/ats-analysis")}>
            <FileSearch size={16} /> Run an analysis
          </button>
        </section>
      ) : (
        <main className="ah-content-grid">
          <section className="ah-history-panel">
            <div className="ah-section-header">
              <div>
                <p className="ah-eyebrow">Saved results</p>
                <h2>{filteredAnalyses.length} matching analyses</h2>
              </div>
              <span className="ah-count-pill">{analyses.length} total</span>
            </div>

            {filteredAnalyses.length ? (
              <div className="ah-analysis-list">
                {filteredAnalyses.map((analysis) => {
                  const selected = String(analysis.id) === String(selectedAnalysis?.id);
                  const tone = scoreTone(analysis.atsScore);

                  return (
                    <button
                      type="button"
                      key={analysis.id}
                      className={`ah-analysis-card ${selected ? "selected" : ""}`}
                      onClick={() => setSelectedId(analysis.id)}
                    >
                      <div className="ah-analysis-card-top">
                        <div className="ah-file-icon"><FileText size={18} /></div>
                        <div className="ah-analysis-title">
                          <strong>{analysis.resumeName}</strong>
                          <span><CalendarDays size={12} /> {formatRelativeDate(analysis.createdAt)}</span>
                        </div>
                        <span className={`ah-score-chip ${tone}`}>{analysis.atsScore}%</span>
                      </div>
                      <p className="ah-jd-snippet">
                        {analysis.jobDescription || "No job description preview saved for this analysis."}
                      </p>
                      <div className="ah-analysis-footer">
                        <span className={`ah-status ${tone}`}>{scoreLabel(analysis.atsScore)}</span>
                        <span>{analysis.missingSkills.length} missing terms <ChevronRight size={14} /></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="ah-empty-filter">
                <Search size={20} />
                <strong>No results match these filters</strong>
                <span>Try a different search term or score range.</span>
              </div>
            )}
          </section>

          <section className="ah-detail-panel">
            {selectedAnalysis ? (
              <>
                <div className="ah-detail-head">
                  <div>
                    <p className="ah-eyebrow">Analysis details</p>
                    <h2>{selectedAnalysis.resumeName}</h2>
                    <p><CalendarDays size={14} /> {formatDate(selectedAnalysis.createdAt)}</p>
                  </div>
                  <div className={`ah-score-ring ${scoreTone(selectedAnalysis.atsScore)}`}>
                    <strong>{selectedAnalysis.atsScore}%</strong>
                    <span>ATS match</span>
                  </div>
                </div>

                <div className="ah-action-row">
                  <button className="ah-primary-btn" onClick={() => openInAnalysis(selectedAnalysis)}>
                    <ArrowUpRight size={16} /> Open in ATS analysis
                  </button>
                  <span>{scoreLabel(selectedAnalysis.atsScore)}</span>
                </div>

                <DetailSection
                  icon={<FileSearch size={17} />}
                  title="Target job description"
                  className="ah-job-description"
                >
                  {selectedAnalysis.jobDescription || "No job description was saved for this analysis."}
                </DetailSection>

                <div className="ah-insight-grid">
                  <InsightList
                    tone="green"
                    icon={<CheckCircle2 size={17} />}
                    title="Matched requirements"
                    items={selectedAnalysis.matchedSkills}
                    empty="No matched requirements were saved."
                  />
                  <InsightList
                    tone="red"
                    icon={<XCircle size={17} />}
                    title="Missing requirements"
                    items={selectedAnalysis.missingSkills}
                    empty="No important missing requirements were saved."
                  />
                  <InsightList
                    tone="blue"
                    icon={<Target size={17} />}
                    title="Strengths"
                    items={selectedAnalysis.strengths}
                    empty="No strengths were saved."
                  />
                  <InsightList
                    tone="amber"
                    icon={<BarChart3 size={17} />}
                    title="Improvement areas"
                    items={selectedAnalysis.weaknesses}
                    empty="No improvement areas were saved."
                  />
                </div>

                <InsightList
                  tone="purple"
                  icon={<Sparkles size={17} />}
                  title="AI recommendations"
                  items={selectedAnalysis.recommendations}
                  empty="No recommendations were saved."
                  fullWidth
                />
              </>
            ) : (
              <div className="ah-state-card ah-detail-empty">
                <FileSearch size={26} />
                <h2>Select an analysis</h2>
                <p>Choose a saved analysis to view its score, skills and recommendations.</p>
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
};

const MetricCard = ({ icon, label, value, helper }) => (
  <article className="ah-metric-card">
    <span className="ah-metric-icon">{icon}</span>
    <div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{helper}</span>
    </div>
  </article>
);

const DetailSection = ({ icon, title, className = "", children }) => (
  <section className={`ah-detail-section ${className}`}>
    <h3>{icon}{title}</h3>
    <p>{children}</p>
  </section>
);

const InsightList = ({ icon, title, items, empty, tone, fullWidth = false }) => (
  <section className={`ah-insight-card ${tone} ${fullWidth ? "full-width" : ""}`}>
    <h3>{icon}{title}</h3>
    {items?.length ? (
      <ul>
        {items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    ) : (
      <p>{empty}</p>
    )}
  </section>
);

const styles = `
  * { box-sizing: border-box; }
  .ah-page { width: 100%; max-width: 1620px; margin: 0 auto; padding: 4px 2px 44px; color: #e5e7eb; }
  .ah-hero, .ah-toolbar, .ah-history-panel, .ah-detail-panel, .ah-state-card, .ah-metric-card { border: 1px solid rgba(148,163,184,.15); background: rgba(15,23,42,.78); box-shadow: 0 20px 45px rgba(2,6,23,.14); }
  .ah-hero { display: flex; justify-content: space-between; gap: 22px; align-items: flex-start; padding: 27px; border-radius: 24px; background: linear-gradient(135deg, rgba(124,58,237,.26), rgba(15,23,42,.84)); }
  .ah-eyebrow { margin: 0; color: #c4b5fd; font-size: 11px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
  .ah-hero h1 { margin: 7px 0 0; color: white; font-size: clamp(29px, 3.2vw, 42px); letter-spacing: -1.25px; }
  .ah-hero p:not(.ah-eyebrow) { max-width: 760px; margin: 10px 0 0; color: #cbd5e1; line-height: 1.65; font-size: 14px; }
  .ah-primary-btn, .ah-secondary-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 39px; border-radius: 10px; padding: 0 13px; font: inherit; font-size: 12px; font-weight: 850; cursor: pointer; transition: .18s ease; }
  .ah-primary-btn { color: white; border: 0; background: linear-gradient(135deg, #8b5cf6, #4f46e5); }
  .ah-primary-btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
  .ah-secondary-btn { color: #ddd6fe; border: 1px solid rgba(196,181,253,.28); background: rgba(30,41,59,.78); }
  .ah-secondary-btn:hover { background: rgba(71,85,105,.58); }
  .ah-secondary-btn:disabled, .ah-primary-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
  .ah-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 20px; }
  .ah-metric-card { display: flex; align-items: flex-start; gap: 12px; min-height: 122px; padding: 16px; border-radius: 18px; }
  .ah-metric-icon { display: grid; flex: 0 0 auto; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: #ddd6fe; background: rgba(139,92,246,.18); }
  .ah-metric-card p { margin: 0; color: #94a3b8; font-size: 11px; font-weight: 800; }
  .ah-metric-card strong { display: block; margin-top: 5px; color: white; font-size: 25px; letter-spacing: -.7px; }
  .ah-metric-card div > span { display: block; margin-top: 4px; color: #64748b; font-size: 10px; line-height: 1.4; }
  .ah-toolbar { display: grid; grid-template-columns: minmax(250px, 1fr) 170px 170px; gap: 12px; align-items: end; margin-top: 20px; padding: 14px; border-radius: 17px; }
  .ah-search-field { display: flex; align-items: center; gap: 9px; min-height: 42px; padding: 0 12px; border: 1px solid rgba(148,163,184,.2); border-radius: 10px; color: #94a3b8; background: rgba(30,41,59,.66); }
  .ah-search-field:focus-within { border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(139,92,246,.1); }
  .ah-search-field input { width: 100%; outline: none; border: 0; color: #f8fafc; background: transparent; font: inherit; font-size: 12px; }
  .ah-search-field input::placeholder { color: #64748b; }
  .ah-select-field { display: grid; gap: 6px; color: #94a3b8; font-size: 10px; font-weight: 850; text-transform: uppercase; letter-spacing: .06em; }
  .ah-select-field select { min-height: 42px; width: 100%; border: 1px solid rgba(148,163,184,.2); border-radius: 10px; outline: none; color: #e2e8f0; background: rgba(30,41,59,.66); padding: 0 10px; font: inherit; font-size: 12px; letter-spacing: 0; text-transform: none; }
  .ah-content-grid { display: grid; grid-template-columns: minmax(330px,.78fr) minmax(510px,1.22fr); gap: 20px; margin-top: 20px; align-items: start; }
  .ah-history-panel, .ah-detail-panel { border-radius: 22px; padding: 17px; }
  .ah-section-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; padding-bottom: 14px; border-bottom: 1px solid rgba(148,163,184,.12); }
  .ah-section-header h2 { margin: 5px 0 0; color: white; font-size: 18px; }
  .ah-count-pill { padding: 6px 9px; border-radius: 999px; color: #c4b5fd; background: rgba(139,92,246,.15); font-size: 10px; font-weight: 900; }
  .ah-analysis-list { display: grid; gap: 10px; margin-top: 14px; max-height: 770px; overflow: auto; padding-right: 3px; }
  .ah-analysis-card { width: 100%; border: 1px solid rgba(148,163,184,.14); border-radius: 16px; padding: 13px; color: inherit; text-align: left; background: rgba(30,41,59,.36); cursor: pointer; transition: .18s ease; }
  .ah-analysis-card:hover { transform: translateY(-1px); border-color: rgba(167,139,250,.45); background: rgba(51,65,85,.43); }
  .ah-analysis-card.selected { border-color: rgba(167,139,250,.82); box-shadow: 0 0 0 1px rgba(139,92,246,.13); background: rgba(76,29,149,.16); }
  .ah-analysis-card-top { display: flex; align-items: flex-start; gap: 10px; }
  .ah-file-icon { display: grid; flex: 0 0 auto; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: #c4b5fd; background: rgba(139,92,246,.16); }
  .ah-analysis-title { min-width: 0; display: grid; gap: 4px; flex: 1; }
  .ah-analysis-title strong { overflow: hidden; color: #f8fafc; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
  .ah-analysis-title span { display: inline-flex; align-items: center; gap: 4px; color: #94a3b8; font-size: 10px; }
  .ah-score-chip { flex: 0 0 auto; padding: 6px 7px; border-radius: 8px; font-size: 11px; font-weight: 900; }
  .ah-score-chip.excellent, .ah-status.excellent { color: #86efac; background: rgba(34,197,94,.11); }
  .ah-score-chip.good, .ah-status.good { color: #93c5fd; background: rgba(59,130,246,.12); }
  .ah-score-chip.attention, .ah-status.attention { color: #fde68a; background: rgba(245,158,11,.12); }
  .ah-score-chip.low, .ah-status.low { color: #fecaca; background: rgba(239,68,68,.12); }
  .ah-jd-snippet { display: -webkit-box; margin: 10px 0 0; overflow: hidden; color: #94a3b8; font-size: 11px; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  .ah-analysis-footer { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 11px; color: #94a3b8; font-size: 10px; }
  .ah-analysis-footer > span:last-child { display: inline-flex; align-items: center; gap: 2px; }
  .ah-status { padding: 4px 6px; border-radius: 999px; font-weight: 850; }
  .ah-detail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; padding-bottom: 18px; border-bottom: 1px solid rgba(148,163,184,.12); }
  .ah-detail-head h2 { margin: 6px 0 0; color: white; font-size: clamp(20px, 2vw, 27px); letter-spacing: -.55px; }
  .ah-detail-head > div:first-child > p:last-child { display: inline-flex; align-items: center; gap: 6px; margin: 8px 0 0; color: #94a3b8; font-size: 11px; }
  .ah-score-ring { display: grid; flex: 0 0 auto; place-content: center; width: 96px; height: 96px; border: 7px solid rgba(148,163,184,.16); border-radius: 50%; text-align: center; }
  .ah-score-ring strong { color: white; font-size: 20px; letter-spacing: -.6px; }
  .ah-score-ring span { margin-top: 2px; color: #94a3b8; font-size: 9px; font-weight: 800; text-transform: uppercase; }
  .ah-score-ring.excellent { border-color: #22c55e; } .ah-score-ring.good { border-color: #60a5fa; } .ah-score-ring.attention { border-color: #f59e0b; } .ah-score-ring.low { border-color: #f87171; }
  .ah-action-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 16px 0; }
  .ah-action-row > span { color: #c4b5fd; font-size: 11px; font-weight: 800; }
  .ah-detail-section { padding: 14px; border: 1px solid rgba(148,163,184,.13); border-radius: 15px; background: rgba(30,41,59,.3); }
  .ah-detail-section h3, .ah-insight-card h3 { display: flex; align-items: center; gap: 7px; margin: 0; color: #e9d5ff; font-size: 12px; font-weight: 900; }
  .ah-detail-section p { margin: 9px 0 0; max-height: 150px; overflow: auto; color: #cbd5e1; font-size: 12px; line-height: 1.65; white-space: pre-wrap; }
  .ah-insight-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
  .ah-insight-card { min-width: 0; padding: 14px; border: 1px solid rgba(148,163,184,.13); border-radius: 15px; background: rgba(30,41,59,.3); }
  .ah-insight-card.green { border-color: rgba(34,197,94,.22); } .ah-insight-card.green h3 { color: #bbf7d0; }
  .ah-insight-card.red { border-color: rgba(248,113,113,.22); } .ah-insight-card.red h3 { color: #fecaca; }
  .ah-insight-card.blue { border-color: rgba(96,165,250,.22); } .ah-insight-card.blue h3 { color: #bfdbfe; }
  .ah-insight-card.amber { border-color: rgba(245,158,11,.22); } .ah-insight-card.amber h3 { color: #fde68a; }
  .ah-insight-card.purple { margin-top: 12px; border-color: rgba(167,139,250,.24); } .ah-insight-card.purple h3 { color: #ddd6fe; }
  .ah-insight-card ul { margin: 10px 0 0 17px; padding: 0; color: #cbd5e1; font-size: 11px; line-height: 1.55; }
  .ah-insight-card li { margin: 5px 0; } .ah-insight-card > p { margin: 10px 0 0; color: #94a3b8; font-size: 11px; line-height: 1.5; }
  .ah-state-card { min-height: 320px; display: grid; place-content: center; justify-items: center; gap: 10px; margin-top: 20px; padding: 25px; border-radius: 22px; text-align: center; color: #a78bfa; }
  .ah-state-card h2 { margin: 2px 0 0; color: white; font-size: 18px; } .ah-state-card p { max-width: 480px; margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6; }
  .ah-error-card { color: #fca5a5; } .ah-detail-empty { min-height: 620px; margin-top: 0; }
  .ah-empty-filter { min-height: 220px; display: grid; place-content: center; justify-items: center; gap: 8px; margin-top: 14px; padding: 20px; border: 1px dashed rgba(148,163,184,.25); border-radius: 16px; color: #94a3b8; font-size: 12px; text-align: center; }
  .ah-empty-filter strong { color: #e2e8f0; }
  .ah-spin { animation: ah-spin .8s linear infinite; } @keyframes ah-spin { to { transform: rotate(360deg); } }
  @media (max-width: 1120px) { .ah-content-grid { grid-template-columns: 1fr; } .ah-analysis-list { max-height: 430px; } .ah-detail-empty { min-height: 300px; } }
  @media (max-width: 820px) { .ah-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .ah-toolbar { grid-template-columns: 1fr 1fr; } .ah-search-field { grid-column: 1 / -1; } }
  @media (max-width: 620px) { .ah-page { padding-bottom: 24px; } .ah-hero, .ah-detail-head, .ah-action-row { display: grid; } .ah-hero { padding: 20px; } .ah-secondary-btn { width: 100%; } .ah-stats-grid, .ah-toolbar, .ah-insight-grid { grid-template-columns: 1fr; } .ah-search-field { grid-column: auto; } .ah-score-ring { width: 82px; height: 82px; } .ah-action-row { justify-items: stretch; } .ah-action-row > span { text-align: center; } }
`;

export default AtsHistoryPage;
