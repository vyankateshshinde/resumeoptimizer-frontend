import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileClock,
  FileText,
  History,
  LayoutTemplate,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UploadCloud,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";

const emptyStats = { totalResumes: 0, totalAnalyses: 0, highestScore: 0, averageScore: 0 };
const list = (value) => Array.isArray(value) ? value : [];
const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const score = (value) => Math.max(0, Math.min(100, Math.round(num(value))));
const cleanList = (value) => Array.isArray(value)
  ? value.filter(Boolean)
  : String(value || "").split(/\n|,|•/).map((item) => item.replace(/^[-•\s]+/, "").trim()).filter(Boolean);
const date = (value) => {
  const parsed = new Date(value);
  return value && !Number.isNaN(parsed.getTime())
    ? parsed.toLocaleString([], { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Recently";
};
const shorten = (value, length = 110) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
};
const tone = (value) => score(value) >= 80 ? "good" : score(value) >= 60 ? "medium" : "low";

const DashboardPage = () => {
  const [stats, setStats] = useState(emptyStats);
  const [resumes, setResumes] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const [dashboardResult, resumesResult, atsResult, versionsResult] = await Promise.allSettled([
        axiosInstance.get("/api/dashboard"),
        axiosInstance.get("/api/resume/my-resumes"),
        axiosInstance.get("/api/ats/history"),
        axiosInstance.get("/api/resume-versions/my-versions"),
      ]);

      const resumeList = resumesResult.status === "fulfilled" ? list(resumesResult.value.data) : [];
      const atsList = atsResult.status === "fulfilled" ? list(atsResult.value.data) : [];
      const versionList = versionsResult.status === "fulfilled" ? list(versionsResult.value.data) : [];
      const apiStats = dashboardResult.status === "fulfilled" ? dashboardResult.value.data || {} : {};
      const bestFromHistory = atsList.reduce((best, item) => Math.max(best, score(item.finalScore ?? item.atsScore)), 0);
      const averageFromHistory = atsList.length
        ? Math.round((atsList.reduce((sum, item) => sum + score(item.finalScore ?? item.atsScore), 0) / atsList.length) * 100) / 100
        : 0;

      setStats({
        totalResumes: num(apiStats.totalResumes, resumeList.length),
        totalAnalyses: num(apiStats.totalAnalyses, atsList.length),
        highestScore: score(apiStats.highestScore ?? bestFromHistory),
        averageScore: num(apiStats.averageScore, averageFromHistory),
      });
      setResumes(resumeList);
      setAnalyses(atsList);
      setVersions(versionList);

      if ([dashboardResult, resumesResult, atsResult, versionsResult].every((result) => result.status === "rejected")) {
        setError("Dashboard data could not be loaded. Check that the backend is running and your JWT session is valid.");
      }
    } catch (requestError) {
      console.error(requestError);
      setError(requestError?.response?.data?.message || "Dashboard data could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const latestAnalysis = analyses[0] || null;
  const latestVersion = versions[0] || null;
  const latestResume = resumes[0] || null;
  const latestScore = score(latestAnalysis?.finalScore ?? latestAnalysis?.atsScore);
  const activity = useMemo(() => [
    ...analyses.map((item) => ({ id: `analysis-${item.id}`, type: "analysis", title: "ATS analysis completed", detail: `${score(item.finalScore ?? item.atsScore)}% match score`, createdAt: item.createdAt, to: "/ats-history" })),
    ...versions.map((item) => ({ id: `version-${item.id}`, type: "version", title: "Resume version saved", detail: item.versionName || "Saved Resume Version", createdAt: item.createdAt, to: "/resume-versions" })),
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6), [analyses, versions]);

  return (
    <div className="db-page">
      <style>{styles}</style>
      <section className="db-hero">
        <div>
          <p className="db-eyebrow">AI Resume Intelligence Platform</p>
          <h1>Welcome back</h1>
          <p>Track uploaded resumes, ATS performance and saved resume versions from one private workspace.</p>
        </div>
        <div className="db-hero-actions">
          <button className="db-refresh" type="button" onClick={() => loadDashboard(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="db-spin" size={16} /> : <RefreshCw size={16} />} Refresh
          </button>
          <Link to="/upload-resume" className="db-primary"><UploadCloud size={18} /> Upload Resume</Link>
        </div>
      </section>

      {error && <div className="db-error"><AlertCircle size={18} /><span>{error}</span><button onClick={() => loadDashboard()}>Retry</button></div>}

      <section className="db-stats">
        <Stat title="Total resumes" value={loading ? "—" : stats.totalResumes} helper="Uploaded to your library" icon={<FileText size={21} />} />
        <Stat title="ATS analyses" value={loading ? "—" : stats.totalAnalyses} helper="Saved analysis runs" icon={<BarChart3 size={21} />} />
        <Stat title="Best score" value={loading ? "—" : `${stats.highestScore}%`} helper="Highest saved match" icon={<Trophy size={21} />} />
        <Stat title="Average score" value={loading ? "—" : `${stats.averageScore}%`} helper="Across all analyses" icon={<TrendingUp size={21} />} />
      </section>

      <section className="db-grid">
        <article className="db-card">
          <Header eyebrow="Latest ATS analysis" title="Role readiness snapshot" to="/ats-history" link="View history" />
          {loading ? <Loader label="Loading latest ATS analysis..." /> : latestAnalysis ? (
            <>
              <div className="db-score-summary">
                <div className={`db-score ${tone(latestScore)}`}><strong>{latestScore}%</strong><span>match</span></div>
                <div><b className={`db-score-label ${tone(latestScore)}`}><CheckCircle2 size={14} /> {latestScore >= 80 ? "Strong match" : latestScore >= 60 ? "Good foundation" : "Needs improvement"}</b><h3>{shorten(latestAnalysis.jobDescription, 90) || "Target job description"}</h3><p>{date(latestAnalysis.createdAt)}</p></div>
              </div>
              <div className="db-skills">
                <Skills title="Matched" items={cleanList(latestAnalysis.matchedSkills).slice(0, 5)} type="matched" />
                <Skills title="Missing" items={cleanList(latestAnalysis.missingSkills).slice(0, 5)} type="missing" />
              </div>
              <Link to="/ats-history" className="db-outline">Review full analysis <ArrowRight size={15} /></Link>
            </>
          ) : <Empty icon={<Target size={25} />} title="No ATS analysis yet" text="Run an ATS analysis to see your latest score, skill gaps and recommendations." to="/ats-analysis" action="Run ATS Analysis" />}
        </article>

        <article className="db-card">
          <Header eyebrow="Resume library" title="Latest saved work" to="/resume-versions" link="Open versions" />
          {loading ? <Loader label="Loading resume library..." /> : <div className="db-library">
            <Library icon={<FileText size={19} />} type="purple" label="Latest uploaded resume" title={latestResume?.fileName || "No resume uploaded yet"} text={latestResume ? "Ready for ATS analysis and AI resume building" : "Upload a PDF or DOCX resume to begin"} to="/upload-resume" action={latestResume ? "Manage" : "Upload"} />
            <Library icon={<LayoutTemplate size={19} />} type="green" label="Latest resume version" title={latestVersion?.versionName || "No saved version yet"} text={latestVersion ? `${latestVersion.templateName || "ATS Professional"} · ${date(latestVersion.createdAt)}` : "Generate and save a version from Resume Builder"} to="/resume-versions" action="View" />
            <div className="db-version-total"><div><FileClock size={18} /> <span>Saved versions</span></div><strong>{versions.length}</strong></div>
          </div>}
        </article>
      </section>

      <section className="db-grid bottom">
        <article className="db-card">
          <div className="db-heading"><div><p className="db-eyebrow">Recent activity</p><h2>What happened recently</h2></div><Activity size={20} /></div>
          {loading ? <Loader label="Loading activity..." /> : activity.length ? <div className="db-activity-list">{activity.map((item) => <Link key={item.id} to={item.to} className="db-activity"><div className={`db-activity-icon ${item.type}`}>{item.type === "analysis" ? <BarChart3 size={16} /> : <History size={16} />}</div><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{date(item.createdAt)}</time></Link>)}</div> : <Empty icon={<History size={25} />} title="No activity yet" text="Upload a resume, run ATS analysis or save a version to build your timeline." to="/upload-resume" action="Get started" />}
        </article>

        <article className="db-card db-next"><p className="db-eyebrow">Recommended next step</p>{stats.totalResumes === 0 ? <><h2>Upload your first resume</h2><p>Start with a PDF or DOCX. It will be used for ATS analysis, AI optimization and version history.</p><Link to="/upload-resume" className="db-primary"><UploadCloud size={16} /> Upload Resume</Link></> : stats.totalAnalyses === 0 ? <><h2>Run ATS analysis</h2><p>Compare your uploaded resume with a job description to find keyword matches and skill gaps.</p><Link to="/ats-analysis" className="db-primary"><Sparkles size={16} /> Analyze Resume</Link></> : <><h2>Build a targeted version</h2><p>Use your latest ATS insights to generate a tailored resume and save it to your private library.</p><Link to="/resume-builder" className="db-primary"><Sparkles size={16} /> Open Resume Builder</Link></>}</article>
      </section>
    </div>
  );
};

const Header = ({ eyebrow, title, to, link }) => <div className="db-heading"><div><p className="db-eyebrow">{eyebrow}</p><h2>{title}</h2></div><Link to={to}>{link} <ArrowRight size={14} /></Link></div>;
const Stat = ({ title, value, helper, icon }) => <article className="db-stat"><div><div><p>{title}</p><h2>{value}</h2></div><span>{icon}</span></div><small>{helper}</small></article>;
const Loader = ({ label }) => <div className="db-loader"><Loader2 className="db-spin" size={20} />{label}</div>;
const Skills = ({ title, items, type }) => <div className={`db-skill ${type}`}><div><strong>{title}</strong><span>{items.length}</span></div>{items.length ? <section>{items.map((item, index) => <em key={`${item}-${index}`}>{item}</em>)}</section> : <p>No skills captured</p>}</div>;
const Library = ({ icon, type, label, title, text, to, action }) => <div className="db-library-item"><div className={`db-library-icon ${type}`}>{icon}</div><div><span>{label}</span><strong title={title}>{title}</strong><small>{text}</small></div><Link to={to}>{action}</Link></div>;
const Empty = ({ icon, title, text, to, action }) => <div className="db-empty"><span>{icon}</span><h3>{title}</h3><p>{text}</p><Link to={to} className="db-outline">{action} <ArrowRight size={15} /></Link></div>;

const styles = `
.db-page{max-width:1600px;margin:0 auto;padding:4px 0 42px;color:#e5e7eb}.db-page *{box-sizing:border-box}.db-hero{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding:27px;border:1px solid rgba(139,92,246,.25);border-radius:24px;background:linear-gradient(130deg,rgba(76,29,149,.34),rgba(15,23,42,.9) 60%)}.db-eyebrow{margin:0;color:#c4b5fd;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.db-hero h1{margin:8px 0 0;color:#fff;font-size:clamp(30px,4vw,45px);letter-spacing:-1.2px}.db-hero>div>p:last-child{max-width:720px;margin:10px 0 0;color:#a5b4cf;font-size:14px;line-height:1.65}.db-hero-actions{display:flex;gap:10px;flex-wrap:wrap}.db-primary,.db-refresh,.db-outline,.db-heading a{display:inline-flex;align-items:center;justify-content:center;gap:7px;font:inherit;text-decoration:none;transition:.18s ease;cursor:pointer}.db-primary{min-height:43px;padding:0 14px;border:0;border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#4f46e5);color:#fff;font-size:12px;font-weight:900}.db-primary:hover{transform:translateY(-1px);filter:brightness(1.08)}.db-refresh{min-height:43px;padding:0 13px;border:1px solid rgba(148,163,184,.22);border-radius:12px;background:rgba(15,23,42,.62);color:#d8d5ff;font-size:12px;font-weight:850}.db-refresh:disabled{opacity:.65;cursor:not-allowed}.db-error{display:flex;align-items:center;gap:10px;margin-top:16px;padding:13px 14px;border:1px solid rgba(251,146,60,.4);border-radius:14px;background:rgba(124,45,18,.2);color:#fed7aa;font-size:12px}.db-error span{flex:1}.db-error button{border:0;background:transparent;color:#fff;font:inherit;font-weight:900;cursor:pointer}.db-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:20px}.db-stat,.db-card{border:1px solid rgba(148,163,184,.15);border-radius:20px;background:rgba(15,23,42,.78);box-shadow:0 18px 45px rgba(2,6,23,.16)}.db-stat{display:flex;flex-direction:column;justify-content:space-between;min-height:144px;padding:18px}.db-stat>div{display:flex;justify-content:space-between;gap:12px}.db-stat p{margin:0;color:#9fb0ce;font-size:12px;font-weight:700}.db-stat h2{margin:13px 0 0;color:#fff;font-size:31px;line-height:1}.db-stat>div>span{display:grid;place-items:center;width:43px;height:43px;border-radius:13px;color:#fff;background:linear-gradient(135deg,#8b5cf6,#4f46e5)}.db-stat small{color:#64748b;font-size:10px}.db-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(310px,.85fr);gap:18px;margin-top:20px}.db-grid.bottom{margin-top:18px}.db-card{min-width:0;padding:20px}.db-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.db-heading h2{margin:7px 0 0;color:#fff;font-size:19px}.db-heading>a{color:#c4b5fd;font-size:11px;font-weight:850}.db-heading>a:hover,.db-library-item>a:hover{color:#fff}.db-score-summary{display:flex;align-items:center;gap:15px;margin-top:20px;padding:16px;border:1px solid rgba(139,92,246,.21);border-radius:16px;background:linear-gradient(135deg,rgba(124,58,237,.16),rgba(30,41,59,.28))}.db-score{display:grid;place-content:center;width:78px;height:78px;flex:0 0 auto;border:6px solid rgba(148,163,184,.16);border-radius:50%;background:#111a30;text-align:center}.db-score.good{border-color:#34d399}.db-score.medium{border-color:#fbbf24}.db-score.low{border-color:#fb7185}.db-score strong{color:#fff;font-size:21px;line-height:1}.db-score span{margin-top:3px;color:#94a3b8;font-size:9px;font-weight:800;text-transform:uppercase}.db-score-label{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:900}.db-score-label.good{color:#6ee7b7}.db-score-label.medium{color:#fcd34d}.db-score-label.low{color:#fda4af}.db-score-summary h3{margin:8px 0 0;color:#edf2ff;font-size:13px;line-height:1.45}.db-score-summary p{margin:6px 0 0;color:#7f8fa9;font-size:10px}.db-skills{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:14px}.db-skill{min-width:0;padding:12px;border:1px solid rgba(148,163,184,.12);border-radius:14px;background:rgba(30,41,59,.3)}.db-skill>div{display:flex;justify-content:space-between}.db-skill strong{color:#dbeafe;font-size:11px}.db-skill>div span{display:grid;place-items:center;min-width:21px;height:21px;border-radius:999px;color:#dbeafe;background:rgba(59,130,246,.16);font-size:9px;font-weight:900}.db-skill.missing strong{color:#fecaca}.db-skill.missing>div span{color:#fecaca;background:rgba(239,68,68,.12)}.db-skill section{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.db-skill em{max-width:100%;overflow:hidden;padding:5px 7px;border-radius:999px;background:rgba(59,130,246,.12);color:#bfdbfe;font-size:9px;font-style:normal;font-weight:750;text-overflow:ellipsis;white-space:nowrap}.db-skill.missing em{background:rgba(244,63,94,.1);color:#fecdd3}.db-skill p{margin:10px 0 0;color:#64748b;font-size:10px}.db-outline{min-height:36px;margin-top:15px;padding:0 11px;border:1px solid rgba(167,139,250,.28);border-radius:10px;background:rgba(139,92,246,.08);color:#d8d5ff;font-size:11px;font-weight:850}.db-outline:hover{background:rgba(139,92,246,.18)}.db-library{display:grid;gap:11px;margin-top:18px}.db-library-item{display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:10px;padding:12px;border:1px solid rgba(148,163,184,.13);border-radius:15px;background:rgba(30,41,59,.3)}.db-library-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:12px}.db-library-icon.purple{background:rgba(139,92,246,.16);color:#ddd6fe}.db-library-icon.green{background:rgba(16,185,129,.12);color:#a7f3d0}.db-library-item span,.db-library-item small{display:block}.db-library-item span{color:#94a3b8;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.db-library-item strong{display:block;overflow:hidden;margin-top:4px;color:#f8fafc;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.db-library-item small{margin-top:4px;color:#64748b;font-size:9px;line-height:1.35}.db-library-item>a{color:#c4b5fd;font-size:10px;font-weight:900;text-decoration:none}.db-version-total{display:flex;align-items:center;justify-content:space-between;padding:10px 2px 0;color:#94a3b8}.db-version-total>div{display:flex;align-items:center;gap:7px;font-size:11px}.db-version-total strong{color:#fff;font-size:17px}.db-activity-list{display:grid;gap:7px;margin-top:17px}.db-activity{display:grid;grid-template-columns:33px minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px;border-radius:13px;color:inherit;text-decoration:none;transition:.16s ease}.db-activity:hover{background:rgba(71,85,105,.28)}.db-activity-icon{display:grid;place-items:center;width:31px;height:31px;border-radius:10px}.db-activity-icon.analysis{background:rgba(139,92,246,.14);color:#c4b5fd}.db-activity-icon.version{background:rgba(16,185,129,.12);color:#a7f3d0}.db-activity strong,.db-activity span{display:block}.db-activity strong{color:#e2e8f0;font-size:11px}.db-activity span{overflow:hidden;margin-top:3px;color:#7f8fa9;font-size:10px;white-space:nowrap;text-overflow:ellipsis}.db-activity time{color:#64748b;font-size:9px;white-space:nowrap}.db-next{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;min-height:238px;background:linear-gradient(135deg,rgba(91,33,182,.2),rgba(15,23,42,.76))}.db-next h2{margin:10px 0 0;color:#fff;font-size:23px}.db-next>p:not(.db-eyebrow){max-width:440px;margin:10px 0 16px;color:#a5b4cf;font-size:12px;line-height:1.65}.db-empty,.db-loader{display:grid;min-height:205px;padding:20px;border:1px dashed rgba(167,139,250,.28);border-radius:16px;color:#94a3b8;place-content:center;justify-items:center;gap:9px;text-align:center}.db-empty>span{color:#a78bfa}.db-empty h3{margin:2px 0 0;color:#e2e8f0;font-size:14px}.db-empty p{max-width:370px;margin:0;color:#7f8fa9;font-size:11px;line-height:1.55}.db-empty .db-outline{margin-top:4px}.db-loader{min-height:180px;font-size:11px}.db-spin{animation:db-spin .8s linear infinite}@keyframes db-spin{to{transform:rotate(360deg)}}@media(max-width:1180px){.db-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.db-grid{grid-template-columns:1fr}}@media(max-width:700px){.db-page{padding-bottom:25px}.db-hero{padding:20px}.db-stats{grid-template-columns:1fr}.db-skills{grid-template-columns:1fr}.db-card{padding:16px}.db-score-summary{align-items:flex-start}.db-activity{grid-template-columns:33px minmax(0,1fr)}.db-activity time{grid-column:2}.db-library-item{grid-template-columns:38px minmax(0,1fr)}.db-library-item>a{grid-column:2;justify-self:start;margin-top:2px}}
`;

export default DashboardPage;
