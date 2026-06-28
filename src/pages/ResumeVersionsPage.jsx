import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeftRight,
  Check,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileDiff,
  FileText,
  GitCompareArrows,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";

const normalize = (value) => String(value || "").trim();

const versionText = (version) => {
  if (!version) return "";

  return normalize(
    version.fullResumeText ||
      [
        version.professionalSummary,
        version.skills,
        version.experienceBullets,
        version.projectBullets,
        version.education,
      ]
        .filter(Boolean)
        .join("\n")
  );
};

const splitItems = (value) => {
  return String(value || "")
    .split(/\n|•|(?<=\.)\s+(?=[A-Z])/g)
    .map((item) => item.replace(/^[-–—•\s]+/, "").trim())
    .filter((item) => item.length > 2);
};

const uniqueItems = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = item.toLowerCase().replace(/\s+/g, " ").trim();

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildDiff = (beforeValue, afterValue) => {
  const before = uniqueItems(splitItems(beforeValue));
  const after = uniqueItems(splitItems(afterValue));
  const beforeSet = new Set(
    before.map((item) => item.toLowerCase().replace(/\s+/g, " ").trim())
  );
  const afterSet = new Set(
    after.map((item) => item.toLowerCase().replace(/\s+/g, " ").trim())
  );

  return {
    added: after.filter(
      (item) => !beforeSet.has(item.toLowerCase().replace(/\s+/g, " ").trim())
    ),
    removed: before.filter(
      (item) => !afterSet.has(item.toLowerCase().replace(/\s+/g, " ").trim())
    ),
    unchanged: after.filter((item) =>
      beforeSet.has(item.toLowerCase().replace(/\s+/g, " ").trim())
    ),
  };
};

const compareVersions = (beforeVersion, afterVersion) => {
  if (!beforeVersion || !afterVersion) return [];

  const fields = [
    { title: "Professional Summary", key: "professionalSummary" },
    { title: "Skills", key: "skills" },
    { title: "Experience", key: "experienceBullets" },
    { title: "Projects", key: "projectBullets" },
    { title: "Education", key: "education" },
  ];

  return fields.map((field) => ({
    ...field,
    ...buildDiff(beforeVersion[field.key], afterVersion[field.key]),
  }));
};

const formatDate = (value) => {
  if (!value) return "Saved version";

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Saved version" : parsed.toLocaleString();
};

const ResumeVersionsPage = () => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [beforeVersionId, setBeforeVersionId] = useState("");
  const [afterVersionId, setAfterVersionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const beforeVersion = useMemo(
    () => versions.find((version) => Number(version.id) === Number(beforeVersionId)) || null,
    [versions, beforeVersionId]
  );

  const afterVersion = useMemo(
    () => versions.find((version) => Number(version.id) === Number(afterVersionId)) || null,
    [versions, afterVersionId]
  );

  const comparison = useMemo(
    () => compareVersions(beforeVersion, afterVersion),
    [beforeVersion, afterVersion]
  );

  const comparisonTotals = useMemo(
    () =>
      comparison.reduce(
        (totals, section) => ({
          added: totals.added + section.added.length,
          removed: totals.removed + section.removed.length,
        }),
        { added: 0, removed: 0 }
      ),
    [comparison]
  );

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/resume-versions/my-versions");
      const list = Array.isArray(response.data) ? response.data : [];
      setVersions(list);

      if (!list.length) {
        setSelectedVersion(null);
        setBeforeVersionId("");
        setAfterVersionId("");
        return;
      }

      setSelectedVersion((current) =>
        list.find((version) => Number(version.id) === Number(current?.id)) || list[0]
      );

      setAfterVersionId((current) =>
        list.some((version) => Number(version.id) === Number(current))
          ? current
          : list[0].id
      );

      setBeforeVersionId((current) => {
        if (list.some((version) => Number(version.id) === Number(current))) {
          return current;
        }

        return list[1]?.id || list[0].id;
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load resume versions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleView = (version) => {
    setSelectedVersion(version);
  };

  const handleDuplicate = async (id) => {
    try {
      setActionLoading(`duplicate-${id}`);
      await axiosInstance.post(`/api/resume-versions/duplicate/${id}`);
      toast.success("Resume version duplicated");
      await fetchVersions();
    } catch (error) {
      console.error(error);
      toast.error("Failed to duplicate version");
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resume version?")) return;

    try {
      setActionLoading(`delete-${id}`);
      await axiosInstance.delete(`/api/resume-versions/${id}`);
      toast.success("Resume version deleted");
      await fetchVersions();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete version");
    } finally {
      setActionLoading("");
    }
  };

  const handleDownloadText = () => {
    if (!selectedVersion) {
      toast.error("Select a version first");
      return;
    }

    const content = versionText(selectedVersion);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedVersion.versionName || "resume-version"}`
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .concat(".txt");
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const setComparisonVersion = (type, version) => {
    if (type === "before") {
      setBeforeVersionId(version.id);
      toast.success("Selected as earlier version");
      return;
    }

    setAfterVersionId(version.id);
    toast.success("Selected as later version");
  };

  return (
    <div className="rv-page">
      <style>{styles}</style>

      <header className="rv-hero">
        <div>
          <p className="rv-eyebrow">Resume Library</p>
          <h1>Compare resume versions with clarity</h1>
          <p>
            Select an earlier and later version to see what skills, bullets, and
            content changed. Your saved resume versions remain private to your account.
          </p>
        </div>
        <button className="rv-secondary-btn" onClick={fetchVersions} disabled={loading}>
          {loading ? <Loader2 className="rv-spin" size={16} /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </header>

      <section className="rv-compare-panel">
        <div className="rv-section-head">
          <div>
            <p className="rv-eyebrow">Version comparison</p>
            <h2>What changed between versions?</h2>
          </div>
          {beforeVersion && afterVersion && (
            <span className="rv-diff-summary">
              <Plus size={14} /> {comparisonTotals.added} additions
              <Minus size={14} /> {comparisonTotals.removed} removals
            </span>
          )}
        </div>

        {versions.length >= 2 ? (
          <>
            <div className="rv-selector-grid">
              <VersionSelect
                label="Earlier version"
                value={beforeVersionId}
                versions={versions}
                onChange={setBeforeVersionId}
              />
              <ArrowLeftRight className="rv-switch-icon" size={22} />
              <VersionSelect
                label="Later version"
                value={afterVersionId}
                versions={versions}
                onChange={setAfterVersionId}
              />
            </div>

            {Number(beforeVersionId) === Number(afterVersionId) ? (
              <div className="rv-note">Choose two different versions to compare.</div>
            ) : (
              <div className="rv-diff-grid">
                {comparison.map((section) => (
                  <section className="rv-diff-card" key={section.key}>
                    <div className="rv-diff-title">
                      <FileDiff size={16} />
                      <strong>{section.title}</strong>
                    </div>

                    <DiffGroup label="Added in later version" type="added" items={section.added} />
                    <DiffGroup label="Removed from earlier version" type="removed" items={section.removed} />

                    {!section.added.length && !section.removed.length && (
                      <p className="rv-unchanged">No meaningful changes detected in this section.</p>
                    )}
                  </section>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rv-note">
            Save at least two resume versions from Resume Builder to compare them here.
          </div>
        )}
      </section>

      <main className="rv-layout">
        <section className="rv-list-panel">
          <div className="rv-section-head compact">
            <h2>Saved Versions</h2>
            <span>{versions.length}</span>
          </div>

          {loading ? (
            <div className="rv-empty"><Loader2 className="rv-spin" size={20} /> Loading versions...</div>
          ) : versions.length ? (
            <div className="rv-version-list">
              {versions.map((version) => {
                const isSelected = Number(selectedVersion?.id) === Number(version.id);
                const isBefore = Number(beforeVersionId) === Number(version.id);
                const isAfter = Number(afterVersionId) === Number(version.id);

                return (
                  <article className={`rv-version-card ${isSelected ? "selected" : ""}`} key={version.id}>
                    <div className="rv-version-title-row">
                      <div>
                        <h3>{version.versionName || "Saved Resume Version"}</h3>
                        <p>{formatDate(version.createdAt)}</p>
                      </div>
                      <span className="rv-score">{version.atsScore ?? 0}% ATS</span>
                    </div>

                    <div className="rv-version-meta">
                      <span>Template: {version.templateName || "ATS Professional"}</span>
                      {isBefore && <b className="rv-tag before">Earlier</b>}
                      {isAfter && <b className="rv-tag after">Later</b>}
                    </div>

                    <div className="rv-version-actions">
                      <button className="rv-secondary-btn" onClick={() => handleView(version)}>
                        <Eye size={14} /> View
                      </button>
                      <button className="rv-secondary-btn" onClick={() => setComparisonVersion("before", version)}>
                        <GitCompareArrows size={14} /> Earlier
                      </button>
                      <button className="rv-secondary-btn" onClick={() => setComparisonVersion("after", version)}>
                        <ChevronRight size={14} /> Later
                      </button>
                      <button
                        className="rv-icon-btn"
                        title="Duplicate version"
                        onClick={() => handleDuplicate(version.id)}
                        disabled={actionLoading === `duplicate-${version.id}`}
                      >
                        {actionLoading === `duplicate-${version.id}` ? <Loader2 className="rv-spin" size={15} /> : <Copy size={15} />}
                      </button>
                      <button
                        className="rv-icon-btn danger"
                        title="Delete version"
                        onClick={() => handleDelete(version.id)}
                        disabled={actionLoading === `delete-${version.id}`}
                      >
                        {actionLoading === `delete-${version.id}` ? <Loader2 className="rv-spin" size={15} /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rv-empty">No saved resume versions yet.</div>
          )}
        </section>

        <section className="rv-preview-panel">
          {selectedVersion ? (
            <>
              <div className="rv-preview-head">
                <div>
                  <p className="rv-eyebrow">Version Preview</p>
                  <h2>{selectedVersion.versionName || "Saved Resume Version"}</h2>
                  <p>
                    {selectedVersion.templateName || "ATS Professional"} · {selectedVersion.atsScore ?? 0}% ATS score
                  </p>
                </div>
                <button className="rv-primary-btn" onClick={handleDownloadText}>
                  <Download size={16} /> Download TXT
                </button>
              </div>

              <PreviewSection title="Professional Summary" value={selectedVersion.professionalSummary} />
              <PreviewSection title="Skills" value={selectedVersion.skills} />
              <PreviewSection title="Experience" value={selectedVersion.experienceBullets} />
              <PreviewSection title="Projects" value={selectedVersion.projectBullets} />
              <PreviewSection title="Education" value={selectedVersion.education} />

              <div className="rv-full-resume">
                <div className="rv-preview-section-title"><FileText size={16} /> Full Resume Text</div>
                <pre>{versionText(selectedVersion) || "No resume text available."}</pre>
              </div>
            </>
          ) : (
            <div className="rv-empty large">Select a saved version to preview its content.</div>
          )}
        </section>
      </main>
    </div>
  );
};

const VersionSelect = ({ label, value, versions, onChange }) => (
  <label className="rv-select-field">
    <span>{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {versions.map((version) => (
        <option key={version.id} value={version.id}>
          {version.versionName || `Version #${version.id}`} · {formatDate(version.createdAt)}
        </option>
      ))}
    </select>
  </label>
);

const DiffGroup = ({ label, type, items }) => {
  if (!items.length) return null;

  return (
    <div className={`rv-diff-group ${type}`}>
      <strong>{type === "added" ? <Plus size={14} /> : <Minus size={14} />} {label}</strong>
      <ul>
        {items.map((item, index) => <li key={`${type}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
};

const PreviewSection = ({ title, value }) => (
  <section className="rv-preview-section">
    <h3>{title}</h3>
    <p>{normalize(value) || "No content available."}</p>
  </section>
);

const styles = `
  * { box-sizing: border-box; }
  .rv-page { max-width: 1600px; margin: 0 auto; color: #e5e7eb; padding: 4px 2px 42px; }
  .rv-hero, .rv-compare-panel, .rv-list-panel, .rv-preview-panel { border: 1px solid rgba(148,163,184,.14); background: rgba(15,23,42,.76); border-radius: 24px; }
  .rv-hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 22px; padding: 27px; background: linear-gradient(135deg, rgba(124,58,237,.23), rgba(15,23,42,.82)); }
  .rv-eyebrow { margin: 0; color: #a78bfa; font-size: 11px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
  .rv-hero h1 { margin: 7px 0 0; color: white; font-size: clamp(28px, 3vw, 40px); letter-spacing: -1px; }
  .rv-hero p { max-width: 700px; margin: 10px 0 0; color: #cbd5e1; line-height: 1.6; font-size: 14px; }
  .rv-compare-panel { margin-top: 20px; padding: 19px; }
  .rv-section-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .rv-section-head h2 { margin: 5px 0 0; color: white; font-size: 20px; }
  .rv-section-head.compact h2 { margin: 0; font-size: 16px; }
  .rv-section-head.compact > span { display: grid; place-items: center; min-width: 27px; height: 27px; border-radius: 50%; background: rgba(139,92,246,.18); color: #ddd6fe; font-size: 12px; font-weight: 900; }
  .rv-diff-summary { display: inline-flex; align-items: center; gap: 6px; padding: 9px 11px; border: 1px solid rgba(167,139,250,.25); border-radius: 999px; background: rgba(139,92,246,.12); color: #ddd6fe; font-size: 11px; font-weight: 850; }
  .rv-diff-summary svg:first-child { color: #4ade80; } .rv-diff-summary svg:nth-child(2) { color: #fca5a5; margin-left: 4px; }
  .rv-selector-grid { display: grid; grid-template-columns: minmax(0, 1fr) 35px minmax(0, 1fr); align-items: end; gap: 12px; margin-top: 17px; }
  .rv-select-field { display: grid; gap: 7px; color: #cbd5e1; font-size: 12px; font-weight: 850; }
  .rv-select-field select { width: 100%; height: 42px; border: 1px solid rgba(148,163,184,.24); outline: none; border-radius: 11px; color: #f8fafc; background: rgba(30,41,59,.87); padding: 0 11px; font: inherit; font-size: 12px; }
  .rv-select-field select:focus { border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(139,92,246,.12); }
  .rv-switch-icon { color: #a78bfa; justify-self: center; margin-bottom: 10px; }
  .rv-note { margin-top: 14px; padding: 13px; border: 1px dashed rgba(167,139,250,.3); border-radius: 13px; color: #c4b5fd; font-size: 12px; line-height: 1.5; }
  .rv-diff-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; margin-top: 17px; }
  .rv-diff-card { min-width: 0; padding: 14px; border: 1px solid rgba(148,163,184,.13); background: rgba(30,41,59,.38); border-radius: 16px; }
  .rv-diff-title { display: flex; align-items: center; gap: 7px; color: white; font-size: 13px; } .rv-diff-title svg { color: #a78bfa; }
  .rv-diff-group { margin-top: 11px; padding: 10px; border-radius: 11px; } .rv-diff-group strong { display: flex; align-items: center; gap: 5px; font-size: 11px; }
  .rv-diff-group ul { margin: 7px 0 0 17px; padding: 0; font-size: 11px; line-height: 1.5; } .rv-diff-group li { margin: 4px 0; }
  .rv-diff-group.added { color: #bbf7d0; background: rgba(34,197,94,.09); } .rv-diff-group.removed { color: #fecaca; background: rgba(239,68,68,.09); }
  .rv-unchanged { margin: 12px 0 0; color: #94a3b8; font-size: 11px; }
  .rv-layout { display: grid; grid-template-columns: minmax(330px,.65fr) minmax(470px,1.35fr); gap: 20px; margin-top: 20px; align-items: start; }
  .rv-list-panel, .rv-preview-panel { padding: 17px; }
  .rv-version-list { display: grid; gap: 11px; margin-top: 14px; }
  .rv-version-card { padding: 14px; border: 1px solid rgba(148,163,184,.13); border-radius: 16px; background: rgba(30,41,59,.38); } .rv-version-card.selected { border-color: rgba(167,139,250,.7); box-shadow: 0 0 0 1px rgba(139,92,246,.15); }
  .rv-version-title-row { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; } .rv-version-title-row h3 { margin: 0; color: white; font-size: 13px; line-height: 1.35; } .rv-version-title-row p { margin: 5px 0 0; color: #94a3b8; font-size: 10px; }
  .rv-score { flex: 0 0 auto; border-radius: 999px; padding: 5px 7px; color: #86efac; background: rgba(34,197,94,.1); font-size: 10px; font-weight: 900; }
  .rv-version-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 9px; color: #94a3b8; font-size: 10px; } .rv-tag { border-radius: 999px; padding: 3px 6px; font-size: 9px; } .rv-tag.before { color: #bfdbfe; background: rgba(59,130,246,.15); } .rv-tag.after { color: #bbf7d0; background: rgba(34,197,94,.13); }
  .rv-version-actions { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 12px; }
  .rv-primary-btn, .rv-secondary-btn, .rv-icon-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; font: inherit; font-weight: 850; cursor: pointer; transition: .18s ease; }
  .rv-primary-btn { border: 0; color: white; padding: 10px 13px; border-radius: 11px; background: linear-gradient(135deg,#8b5cf6,#4f46e5); } .rv-primary-btn:hover { transform: translateY(-1px); }
  .rv-secondary-btn { min-height: 32px; border-radius: 9px; padding: 0 9px; border: 1px solid rgba(148,163,184,.18); background: rgba(30,41,59,.76); color: #d8d5ff; font-size: 10px; } .rv-secondary-btn:hover { background: rgba(71,85,105,.64); }
  .rv-icon-btn { width: 32px; height: 32px; border: 1px solid rgba(148,163,184,.18); border-radius: 9px; background: rgba(30,41,59,.76); color: #cbd5e1; } .rv-icon-btn.danger:hover { color: #fecaca; background: rgba(239,68,68,.13); } .rv-icon-btn:disabled, .rv-secondary-btn:disabled { opacity: .6; cursor: not-allowed; }
  .rv-preview-head { display: flex; justify-content: space-between; gap: 15px; align-items: flex-start; padding-bottom: 17px; border-bottom: 1px solid rgba(148,163,184,.14); } .rv-preview-head h2 { margin: 5px 0 0; color: white; font-size: 22px; } .rv-preview-head p { margin: 7px 0 0; color: #94a3b8; font-size: 12px; }
  .rv-preview-section { padding: 15px 0; border-bottom: 1px solid rgba(148,163,184,.11); } .rv-preview-section h3, .rv-preview-section-title { display: flex; align-items: center; gap: 7px; color: #c4b5fd; margin: 0; font-size: 12px; letter-spacing: .04em; text-transform: uppercase; } .rv-preview-section p { margin: 8px 0 0; color: #cbd5e1; font-size: 13px; line-height: 1.65; white-space: pre-wrap; }
  .rv-full-resume { margin-top: 16px; padding: 15px; border: 1px solid rgba(148,163,184,.14); border-radius: 15px; background: #020617; } .rv-full-resume pre { overflow: auto; margin: 11px 0 0; color: #e2e8f0; white-space: pre-wrap; font-family: inherit; font-size: 12px; line-height: 1.65; }
  .rv-empty { min-height: 140px; display: grid; place-content: center; text-align: center; gap: 8px; padding: 20px; border: 1px dashed rgba(167,139,250,.3); border-radius: 16px; color: #94a3b8; font-size: 12px; } .rv-empty.large { min-height: 500px; }
  .rv-spin { animation: rv-spin .8s linear infinite; } @keyframes rv-spin { to { transform: rotate(360deg); } }
  @media (max-width: 1050px) { .rv-layout { grid-template-columns: 1fr; } }
  @media (max-width: 680px) { .rv-hero, .rv-preview-head { display: grid; } .rv-selector-grid, .rv-diff-grid { grid-template-columns: 1fr; } .rv-switch-icon { transform: rotate(90deg); margin: 0; } .rv-diff-summary { align-self: start; } }
`;

export default ResumeVersionsPage;
