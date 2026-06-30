import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeftRight,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileDiff,
  FileText,
  GitCompareArrows,
  Loader2,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";

const normalize = (value) => String(value ?? "").trim();

const safeArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => normalize(item)).filter(Boolean);

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => normalize(item)).filter(Boolean);
    } catch {
      // Older saved records can contain line-separated or bullet-separated text.
    }

    return value
      .split(/\n|•|(?<=\.)\s+(?=[A-Z])/g)
      .map((item) => item.replace(/^[-–—•\s]+/, "").trim())
      .filter((item) => item.length > 1);
  }

  return [];
};

const uniqueItems = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalize(item).toLowerCase().replace(/\s+/g, " ");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildDiff = (beforeValue, afterValue) => {
  const before = uniqueItems(safeArray(beforeValue));
  const after = uniqueItems(safeArray(afterValue));
  const beforeSet = new Set(before.map((item) => item.toLowerCase().replace(/\s+/g, " ")));
  const afterSet = new Set(after.map((item) => item.toLowerCase().replace(/\s+/g, " ")));

  return {
    added: after.filter((item) => !beforeSet.has(item.toLowerCase().replace(/\s+/g, " "))),
    removed: before.filter((item) => !afterSet.has(item.toLowerCase().replace(/\s+/g, " "))),
  };
};

const getVersionSections = (version) => [
  { key: "professionalSummary", title: "Professional Summary", value: version?.professionalSummary },
  { key: "skills", title: "Skills", value: version?.skills },
  { key: "experienceBullets", title: "Experience", value: version?.experienceBullets },
  { key: "projectBullets", title: "Projects", value: version?.projectBullets },
  { key: "education", title: "Education", value: version?.education },
].filter((section) => normalize(section.value));

const buildVersionText = (version) => {
  if (!version) return "";
  if (normalize(version.fullResumeText)) return normalize(version.fullResumeText);

  return getVersionSections(version)
    .map((section) => {
      const items = safeArray(section.value);
      if (!items.length) return "";
      const content = section.key === "professionalSummary" || section.key === "education"
        ? items.join("\n")
        : items.map((item) => `• ${item}`).join("\n");
      return `${section.title.toUpperCase()}\n${content}`;
    })
    .filter(Boolean)
    .join("\n\n");
};

const formatDate = (value) => {
  if (!value) return "Saved version";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved version";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatShortDate = (value) => {
  if (!value) return "Recently saved";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently saved";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const getErrorMessage = (error, fallback) => {
  const body = error?.response?.data;
  return body?.message || (typeof body === "string" ? body : fallback);
};

const compareVersions = (beforeVersion, afterVersion) => {
  if (!beforeVersion || !afterVersion) return [];

  return [
    { key: "professionalSummary", title: "Professional Summary" },
    { key: "skills", title: "Skills" },
    { key: "experienceBullets", title: "Experience" },
    { key: "projectBullets", title: "Projects" },
    { key: "education", title: "Education" },
  ].map((section) => ({
    ...section,
    ...buildDiff(beforeVersion[section.key], afterVersion[section.key]),
  }));
};

const ResumeVersionsPage = () => {
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [beforeVersionId, setBeforeVersionId] = useState("");
  const [afterVersionId, setAfterVersionId] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchVersions = async ({ quiet = false } = {}) => {
    try {
      if (!quiet) setLoading(true);
      setErrorMessage("");

      const response = await axiosInstance.get("/api/resume-versions/my-versions");
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.content)
          ? response.data.content
          : [];

      const ordered = [...list].sort(
        (first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0)
      );
      setVersions(ordered);

      if (!ordered.length) {
        setSelectedVersionId("");
        setBeforeVersionId("");
        setAfterVersionId("");
        return;
      }

      setSelectedVersionId((current) =>
        ordered.some((version) => String(version.id) === String(current)) ? current : ordered[0].id
      );
      setAfterVersionId((current) =>
        ordered.some((version) => String(version.id) === String(current)) ? current : ordered[0].id
      );
      setBeforeVersionId((current) => {
        if (ordered.some((version) => String(version.id) === String(current))) return current;
        return ordered[1]?.id || ordered[0].id;
      });
    } catch (error) {
      console.error(error);
      const message = getErrorMessage(error, "Failed to load resume versions");
      setErrorMessage(message);
      if (!quiet) toast.error(message);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const filteredVersions = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    const list = versions.filter((version) => {
      if (!lowerQuery) return true;
      return [version.versionName, version.templateName, buildVersionText(version)]
        .join(" ")
        .toLowerCase()
        .includes(lowerQuery);
    });

    return [...list].sort((first, second) => {
      if (sortBy === "highest") return Number(second.atsScore ?? 0) - Number(first.atsScore ?? 0);
      if (sortBy === "lowest") return Number(first.atsScore ?? 0) - Number(second.atsScore ?? 0);
      if (sortBy === "name") return String(first.versionName || "").localeCompare(String(second.versionName || ""));
      return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
    });
  }, [versions, query, sortBy]);

  const selectedVersion = versions.find((version) => String(version.id) === String(selectedVersionId)) || null;
  const beforeVersion = versions.find((version) => String(version.id) === String(beforeVersionId)) || null;
  const afterVersion = versions.find((version) => String(version.id) === String(afterVersionId)) || null;

  const comparison = useMemo(
    () => compareVersions(beforeVersion, afterVersion),
    [beforeVersion, afterVersion]
  );

  const comparisonTotals = useMemo(
    () => comparison.reduce(
      (total, section) => ({
        added: total.added + section.added.length,
        removed: total.removed + section.removed.length,
      }),
      { added: 0, removed: 0 }
    ),
    [comparison]
  );

  const stats = useMemo(() => {
    const total = versions.length;
    const scores = versions.map((version) => Number(version.atsScore ?? 0)).filter((score) => score > 0);
    const best = scores.length ? Math.max(...scores) : 0;
    const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    return { total, best, average, templates: new Set(versions.map((version) => version.templateName).filter(Boolean)).size };
  }, [versions]);

  const handleDuplicate = async (id) => {
    try {
      setActionLoading(`duplicate-${id}`);
      await axiosInstance.post(`/api/resume-versions/duplicate/${id}`);
      toast.success("Resume version duplicated");
      await fetchVersions({ quiet: true });
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to duplicate version"));
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this saved resume version? This action cannot be undone.")) return;

    try {
      setActionLoading(`delete-${id}`);
      await axiosInstance.delete(`/api/resume-versions/${id}`);
      toast.success("Resume version deleted");
      await fetchVersions({ quiet: true });
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to delete version"));
    } finally {
      setActionLoading("");
    }
  };

  const handleDownloadText = (version = selectedVersion) => {
    if (!version) {
      toast.error("Select a resume version first");
      return;
    }

    const content = buildVersionText(version);
    if (!content) {
      toast.error("No resume content is available for this version");
      return;
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${version.versionName || "resume-version"}`
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/(^-|-$)/g, "")
      .toLowerCase()
      .concat(".txt");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!selectedVersion) {
      toast.error("Select a resume version first");
      return;
    }

    const content = buildVersionText(selectedVersion);
    if (!content) {
      toast.error("No resume content is available for this version");
      return;
    }

    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      toast.error("Allow pop-ups to print or save this version as PDF");
      return;
    }

    const sections = content.split(/\n{2,}/).map((section) => {
      const [heading, ...body] = section.split("\n");
      return `
        <section>
          <h2>${escapeHtml(heading)}</h2>
          <div>${body.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>
        </section>`;
    }).join("");

    printWindow.document.write(`
      <!doctype html>
      <html><head><title>${escapeHtml(selectedVersion.versionName || "Resume Version")}</title>
      <style>
        @page { size: A4; margin: 16mm; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.55; max-width: 800px; margin: 0 auto; }
        header { border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px; }
        h1 { font-size: 25px; margin: 0; color: #111827; }
        header p { color: #4b5563; margin: 6px 0 0; font-size: 12px; }
        section { margin: 18px 0; break-inside: avoid; }
        h2 { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #4338ca; margin: 0 0 7px; }
        p { margin: 4px 0; font-size: 11px; white-space: pre-wrap; }
      </style></head><body>
        <header><h1>${escapeHtml(selectedVersion.versionName || "Saved Resume Version")}</h1><p>${escapeHtml(selectedVersion.templateName || "ATS Professional")} · ${Number(selectedVersion.atsScore ?? 0)}% ATS match</p></header>
        ${sections}
        <script>window.onload = () => { window.print(); };</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const chooseVersion = (type, version) => {
    if (type === "before") {
      setBeforeVersionId(version.id);
      toast.success("Set as earlier version");
      return;
    }
    setAfterVersionId(version.id);
    toast.success("Set as later version");
  };

  return (
    <div className="rv-page">
      <style>{styles}</style>

      <section className="rv-hero">
        <div>
          <p className="rv-eyebrow">Resume library</p>
          <h1>Resume versions, organized</h1>
          <p>
            Keep every tailored resume private to your account, review content at a glance and
            compare exactly what changed between saved versions.
          </p>
        </div>
        <div className="rv-hero-actions">
          <button className="rv-secondary-btn" onClick={() => fetchVersions()} disabled={loading}>
            {loading ? <Loader2 className="rv-spin" size={16} /> : <RefreshCw size={16} />}
            Refresh
          </button>
          <button className="rv-primary-btn" onClick={() => navigate("/resume-builder")}>
            <Sparkles size={16} /> Create version
          </button>
        </div>
      </section>

      <section className="rv-stats-grid">
        <MetricCard icon={<FileText size={18} />} label="Saved versions" value={stats.total} helper="In your private library" />
        <MetricCard icon={<TrendingUp size={18} />} label="Average ATS score" value={`${stats.average}%`} helper="Across scored versions" />
        <MetricCard icon={<CheckCircle2 size={18} />} label="Best ATS score" value={`${stats.best}%`} helper="Highest saved match" />
        <MetricCard icon={<GitCompareArrows size={18} />} label="Templates used" value={stats.templates} helper="Across your versions" />
      </section>

      <section className="rv-toolbar">
        <label className="rv-search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search version name, template or content"
          />
        </label>
        <label className="rv-select-field">
          <span>Sort by</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="latest">Most recent</option>
            <option value="highest">Highest ATS score</option>
            <option value="lowest">Lowest ATS score</option>
            <option value="name">Version name</option>
          </select>
        </label>
      </section>

      {loading ? (
        <section className="rv-state-card">
          <Loader2 className="rv-spin" size={25} />
          <h2>Loading saved versions</h2>
          <p>Your resume library is being prepared.</p>
        </section>
      ) : errorMessage ? (
        <section className="rv-state-card rv-error-card">
          <FileDiff size={25} />
          <h2>We could not load your resume versions</h2>
          <p>{errorMessage}</p>
          <button className="rv-primary-btn" onClick={() => fetchVersions()}>Try again</button>
        </section>
      ) : !versions.length ? (
        <section className="rv-state-card">
          <FileText size={26} />
          <h2>No saved versions yet</h2>
          <p>Create a tailored resume in Resume Builder and save it to start comparing versions here.</p>
          <button className="rv-primary-btn" onClick={() => navigate("/resume-builder")}>
            <Sparkles size={16} /> Open Resume Builder
          </button>
        </section>
      ) : (
        <>
          <section className="rv-compare-panel">
            <div className="rv-section-head">
              <div>
                <p className="rv-eyebrow">Version comparison</p>
                <h2>See what changed</h2>
              </div>
              {beforeVersion && afterVersion && String(beforeVersion.id) !== String(afterVersion.id) && (
                <span className="rv-diff-summary">
                  <Plus size={14} /> {comparisonTotals.added} additions
                  <Minus size={14} /> {comparisonTotals.removed} removals
                </span>
              )}
            </div>

            {versions.length >= 2 ? (
              <>
                <div className="rv-selector-grid">
                  <VersionSelect label="Earlier version" value={beforeVersionId} versions={versions} onChange={setBeforeVersionId} />
                  <ArrowLeftRight className="rv-switch-icon" size={22} />
                  <VersionSelect label="Later version" value={afterVersionId} versions={versions} onChange={setAfterVersionId} />
                </div>

                {String(beforeVersionId) === String(afterVersionId) ? (
                  <div className="rv-note">Choose two different versions to see a meaningful comparison.</div>
                ) : (
                  <div className="rv-diff-grid">
                    {comparison.map((section) => (
                      <section className="rv-diff-card" key={section.key}>
                        <div className="rv-diff-title"><FileDiff size={16} /> <strong>{section.title}</strong></div>
                        <DiffGroup label="Added in later version" tone="added" items={section.added} />
                        <DiffGroup label="Removed from earlier version" tone="removed" items={section.removed} />
                        {!section.added.length && !section.removed.length && <p className="rv-unchanged">No meaningful changes detected.</p>}
                      </section>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rv-note">Save one more version from Resume Builder to unlock side-by-side comparison.</div>
            )}
          </section>

          <main className="rv-content-grid">
            <section className="rv-list-panel">
              <div className="rv-section-head compact">
                <div>
                  <p className="rv-eyebrow">Version list</p>
                  <h2>{filteredVersions.length} matching versions</h2>
                </div>
                <span className="rv-count-pill">{versions.length} total</span>
              </div>

              {filteredVersions.length ? (
                <div className="rv-version-list">
                  {filteredVersions.map((version) => {
                    const selected = String(version.id) === String(selectedVersion?.id);
                    const isBefore = String(version.id) === String(beforeVersionId);
                    const isAfter = String(version.id) === String(afterVersionId);
                    const actionIsLoading = actionLoading === `duplicate-${version.id}` || actionLoading === `delete-${version.id}`;

                    return (
                      <article className={`rv-version-card ${selected ? "selected" : ""}`} key={version.id}>
                        <button className="rv-card-main" onClick={() => setSelectedVersionId(version.id)}>
                          <div className="rv-version-top">
                            <span className="rv-file-icon"><FileText size={17} /></span>
                            <div>
                              <h3>{version.versionName || "Saved Resume Version"}</h3>
                              <p>{formatShortDate(version.createdAt)} · {version.templateName || "ATS Professional"}</p>
                            </div>
                            <span className="rv-score-chip">{Number(version.atsScore ?? 0)}%</span>
                          </div>
                          <div className="rv-card-tags">
                            {isBefore && <span className="rv-tag before">Earlier</span>}
                            {isAfter && <span className="rv-tag after">Later</span>}
                            {!isBefore && !isAfter && <span className="rv-tag neutral">Saved version</span>}
                            <span>{getVersionSections(version).length} sections</span>
                          </div>
                        </button>

                        <div className="rv-card-actions">
                          <button className="rv-small-btn" onClick={() => setSelectedVersionId(version.id)}><Eye size={13} /> View</button>
                          <button className="rv-small-btn" onClick={() => chooseVersion("before", version)}><GitCompareArrows size={13} /> Earlier</button>
                          <button className="rv-small-btn" onClick={() => chooseVersion("after", version)}><ArrowLeftRight size={13} /> Later</button>
                          <button
                            className="rv-icon-btn"
                            title="Duplicate version"
                            onClick={() => handleDuplicate(version.id)}
                            disabled={actionIsLoading}
                          >
                            {actionLoading === `duplicate-${version.id}` ? <Loader2 className="rv-spin" size={15} /> : <Copy size={15} />}
                          </button>
                          <button
                            className="rv-icon-btn danger"
                            title="Delete version"
                            onClick={() => handleDelete(version.id)}
                            disabled={actionIsLoading}
                          >
                            {actionLoading === `delete-${version.id}` ? <Loader2 className="rv-spin" size={15} /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rv-empty-filter">
                  <Search size={20} />
                  <strong>No versions match this search</strong>
                  <span>Try another version name, template or keyword.</span>
                </div>
              )}
            </section>

            <section className="rv-preview-panel">
              {selectedVersion ? (
                <>
                  <div className="rv-preview-head">
                    <div>
                      <p className="rv-eyebrow">Version preview</p>
                      <h2>{selectedVersion.versionName || "Saved Resume Version"}</h2>
                      <p>{selectedVersion.templateName || "ATS Professional"} · {Number(selectedVersion.atsScore ?? 0)}% ATS score · Saved {formatDate(selectedVersion.createdAt)}</p>
                    </div>
                    <div className="rv-preview-actions">
                      <button className="rv-secondary-btn" onClick={() => handleDownloadText()}><Download size={15} /> Export TXT</button>
                      <button className="rv-primary-btn" onClick={handlePrint}><Printer size={15} /> Print / Save PDF</button>
                    </div>
                  </div>

                  <div className="rv-preview-sections">
                    {getVersionSections(selectedVersion).length ? (
                      getVersionSections(selectedVersion).map((section) => (
                        <PreviewSection key={section.key} title={section.title} value={section.value} />
                      ))
                    ) : (
                      <div className="rv-empty-preview">No structured sections are available. Use the full text below.</div>
                    )}
                  </div>

                  <section className="rv-full-text-section">
                    <div className="rv-full-text-title"><FileText size={16} /> Full resume text</div>
                    <pre>{buildVersionText(selectedVersion) || "No resume content available."}</pre>
                  </section>
                </>
              ) : (
                <div className="rv-state-card rv-detail-empty">
                  <Eye size={26} />
                  <h2>Select a saved version</h2>
                  <p>Choose a version from the library to preview and export its content.</p>
                </div>
              )}
            </section>
          </main>
        </>
      )}
    </div>
  );
};

const MetricCard = ({ icon, label, value, helper }) => (
  <article className="rv-metric-card">
    <span className="rv-metric-icon">{icon}</span>
    <div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{helper}</span>
    </div>
  </article>
);

const VersionSelect = ({ label, value, versions, onChange }) => (
  <label className="rv-version-select">
    <span>{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {versions.map((version) => (
        <option key={version.id} value={version.id}>
          {version.versionName || `Version #${version.id}`} · {formatShortDate(version.createdAt)}
        </option>
      ))}
    </select>
  </label>
);

const DiffGroup = ({ label, tone, items }) => {
  if (!items.length) return null;
  return (
    <div className={`rv-diff-group ${tone}`}>
      <strong>{tone === "added" ? <Plus size={14} /> : <Minus size={14} />}{label}</strong>
      <ul>{items.map((item, index) => <li key={`${tone}-${index}`}>{item}</li>)}</ul>
    </div>
  );
};

const PreviewSection = ({ title, value }) => {
  const items = safeArray(value);
  const isBulletSection = !["Professional Summary", "Education"].includes(title);

  return (
    <section className="rv-preview-section">
      <h3>{title}</h3>
      {isBulletSection && items.length > 1 ? (
        <ul>{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul>
      ) : (
        <p>{items.join("\n") || "No content available."}</p>
      )}
    </section>
  );
};

const styles = `
  * { box-sizing: border-box; }
  .rv-page { width: 100%; max-width: 1620px; margin: 0 auto; padding: 4px 2px 44px; color: #e5e7eb; }
  .rv-hero, .rv-toolbar, .rv-compare-panel, .rv-list-panel, .rv-preview-panel, .rv-state-card, .rv-metric-card { border: 1px solid rgba(148,163,184,.15); background: rgba(15,23,42,.78); box-shadow: 0 20px 45px rgba(2,6,23,.14); }
  .rv-hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 27px; border-radius: 24px; background: linear-gradient(135deg, rgba(124,58,237,.26), rgba(15,23,42,.84)); }
  .rv-eyebrow { margin: 0; color: #c4b5fd; font-size: 11px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
  .rv-hero h1 { margin: 7px 0 0; color: white; font-size: clamp(29px, 3.2vw, 42px); letter-spacing: -1.25px; }
  .rv-hero p:not(.rv-eyebrow) { max-width: 750px; margin: 10px 0 0; color: #cbd5e1; line-height: 1.65; font-size: 14px; }
  .rv-hero-actions, .rv-preview-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 9px; }
  .rv-primary-btn, .rv-secondary-btn, .rv-small-btn, .rv-icon-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border-radius: 10px; font: inherit; font-weight: 850; cursor: pointer; transition: .18s ease; }
  .rv-primary-btn { min-height: 39px; border: 0; padding: 0 13px; color: white; background: linear-gradient(135deg,#8b5cf6,#4f46e5); font-size: 12px; }
  .rv-primary-btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
  .rv-secondary-btn { min-height: 39px; border: 1px solid rgba(196,181,253,.28); padding: 0 13px; color: #ddd6fe; background: rgba(30,41,59,.78); font-size: 12px; }
  .rv-secondary-btn:hover { background: rgba(71,85,105,.58); }
  .rv-primary-btn:disabled, .rv-secondary-btn:disabled, .rv-small-btn:disabled, .rv-icon-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
  .rv-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 20px; }
  .rv-metric-card { display: flex; align-items: flex-start; gap: 12px; min-height: 122px; padding: 16px; border-radius: 18px; }
  .rv-metric-icon { display: grid; flex: 0 0 auto; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: #ddd6fe; background: rgba(139,92,246,.18); }
  .rv-metric-card p { margin: 0; color: #94a3b8; font-size: 11px; font-weight: 800; }
  .rv-metric-card strong { display: block; margin-top: 5px; color: white; font-size: 25px; letter-spacing: -.7px; }
  .rv-metric-card div > span { display: block; margin-top: 4px; color: #64748b; font-size: 10px; line-height: 1.4; }
  .rv-toolbar { display: grid; grid-template-columns: minmax(250px, 1fr) 180px; gap: 12px; align-items: end; margin-top: 20px; padding: 14px; border-radius: 17px; }
  .rv-search-field { display: flex; align-items: center; gap: 9px; min-height: 42px; padding: 0 12px; border: 1px solid rgba(148,163,184,.2); border-radius: 10px; color: #94a3b8; background: rgba(30,41,59,.66); }
  .rv-search-field:focus-within { border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(139,92,246,.1); }
  .rv-search-field input { width: 100%; outline: none; border: 0; color: #f8fafc; background: transparent; font: inherit; font-size: 12px; }
  .rv-search-field input::placeholder { color: #64748b; }
  .rv-select-field { display: grid; gap: 6px; color: #94a3b8; font-size: 10px; font-weight: 850; letter-spacing: .06em; text-transform: uppercase; }
  .rv-select-field select, .rv-version-select select { min-height: 42px; width: 100%; outline: none; border: 1px solid rgba(148,163,184,.2); border-radius: 10px; color: #e2e8f0; background: rgba(30,41,59,.66); padding: 0 10px; font: inherit; font-size: 12px; letter-spacing: 0; text-transform: none; }
  .rv-compare-panel { margin-top: 20px; padding: 18px; border-radius: 22px; }
  .rv-section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  .rv-section-head h2 { margin: 5px 0 0; color: white; font-size: 19px; }
  .rv-section-head.compact { padding-bottom: 14px; border-bottom: 1px solid rgba(148,163,184,.12); }
  .rv-diff-summary, .rv-count-pill { display: inline-flex; align-items: center; gap: 6px; padding: 7px 9px; border-radius: 999px; color: #ddd6fe; background: rgba(139,92,246,.15); font-size: 10px; font-weight: 900; }
  .rv-diff-summary svg:first-child { color: #86efac; } .rv-diff-summary svg:nth-child(2) { margin-left: 3px; color: #fca5a5; }
  .rv-selector-grid { display: grid; grid-template-columns: minmax(0,1fr) 38px minmax(0,1fr); gap: 12px; align-items: end; margin-top: 16px; }
  .rv-version-select { display: grid; gap: 6px; color: #cbd5e1; font-size: 11px; font-weight: 850; }
  .rv-version-select select:focus, .rv-select-field select:focus { border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(139,92,246,.1); }
  .rv-switch-icon { justify-self: center; margin-bottom: 9px; color: #c4b5fd; }
  .rv-note { margin-top: 14px; padding: 12px; border: 1px dashed rgba(167,139,250,.31); border-radius: 13px; color: #c4b5fd; font-size: 12px; line-height: 1.5; }
  .rv-diff-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; margin-top: 16px; }
  .rv-diff-card { min-width: 0; padding: 14px; border: 1px solid rgba(148,163,184,.13); border-radius: 16px; background: rgba(30,41,59,.34); }
  .rv-diff-title { display: flex; align-items: center; gap: 7px; color: white; font-size: 12px; } .rv-diff-title svg { color: #c4b5fd; }
  .rv-diff-group { margin-top: 11px; padding: 10px; border-radius: 11px; } .rv-diff-group strong { display: flex; align-items: center; gap: 5px; font-size: 10px; }
  .rv-diff-group ul { margin: 7px 0 0 16px; padding: 0; font-size: 10px; line-height: 1.5; } .rv-diff-group li { margin: 4px 0; }
  .rv-diff-group.added { color: #bbf7d0; background: rgba(34,197,94,.09); } .rv-diff-group.removed { color: #fecaca; background: rgba(239,68,68,.09); }
  .rv-unchanged { margin: 12px 0 0; color: #94a3b8; font-size: 10px; }
  .rv-content-grid { display: grid; grid-template-columns: minmax(355px,.82fr) minmax(520px,1.18fr); gap: 20px; margin-top: 20px; align-items: start; }
  .rv-list-panel, .rv-preview-panel { border-radius: 22px; padding: 17px; }
  .rv-version-list { display: grid; gap: 10px; max-height: 840px; margin-top: 14px; overflow: auto; padding-right: 3px; }
  .rv-version-card { overflow: hidden; border: 1px solid rgba(148,163,184,.14); border-radius: 16px; background: rgba(30,41,59,.36); transition: .18s ease; }
  .rv-version-card:hover { border-color: rgba(167,139,250,.46); background: rgba(51,65,85,.42); } .rv-version-card.selected { border-color: rgba(167,139,250,.82); box-shadow: 0 0 0 1px rgba(139,92,246,.13); background: rgba(76,29,149,.16); }
  .rv-card-main { width: 100%; border: 0; padding: 13px; color: inherit; text-align: left; background: transparent; cursor: pointer; }
  .rv-version-top { display: flex; align-items: flex-start; gap: 9px; }
  .rv-file-icon { display: grid; flex: 0 0 auto; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: #c4b5fd; background: rgba(139,92,246,.16); }
  .rv-version-top > div { min-width: 0; flex: 1; } .rv-version-top h3 { overflow: hidden; margin: 0; color: #f8fafc; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; } .rv-version-top p { margin: 5px 0 0; color: #94a3b8; font-size: 10px; }
  .rv-score-chip { flex: 0 0 auto; padding: 6px 7px; border-radius: 8px; color: #86efac; background: rgba(34,197,94,.11); font-size: 11px; font-weight: 900; }
  .rv-card-tags { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 10px; color: #94a3b8; font-size: 10px; }
  .rv-tag { padding: 4px 6px; border-radius: 999px; font-size: 9px; font-weight: 850; } .rv-tag.before { color: #bfdbfe; background: rgba(59,130,246,.15); } .rv-tag.after { color: #bbf7d0; background: rgba(34,197,94,.13); } .rv-tag.neutral { color: #c4b5fd; background: rgba(139,92,246,.13); }
  .rv-card-actions { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 13px; border-top: 1px solid rgba(148,163,184,.11); }
  .rv-small-btn { min-height: 29px; padding: 0 7px; border: 1px solid rgba(148,163,184,.17); color: #cbd5e1; background: rgba(15,23,42,.44); font-size: 9px; } .rv-small-btn:hover { background: rgba(71,85,105,.54); }
  .rv-icon-btn { width: 29px; height: 29px; border: 1px solid rgba(148,163,184,.17); color: #cbd5e1; background: rgba(15,23,42,.44); } .rv-icon-btn:hover { background: rgba(71,85,105,.54); } .rv-icon-btn.danger:hover { color: #fecaca; background: rgba(239,68,68,.13); }
  .rv-preview-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding-bottom: 17px; border-bottom: 1px solid rgba(148,163,184,.12); }
  .rv-preview-head h2 { margin: 5px 0 0; color: white; font-size: clamp(21px,2.2vw,28px); letter-spacing: -.6px; } .rv-preview-head > div:first-child > p:last-child { margin: 7px 0 0; color: #94a3b8; font-size: 11px; line-height: 1.5; }
  .rv-preview-sections { display: grid; gap: 0; margin-top: 2px; }
  .rv-preview-section { padding: 15px 0; border-bottom: 1px solid rgba(148,163,184,.11); } .rv-preview-section h3, .rv-full-text-title { display: flex; align-items: center; gap: 7px; margin: 0; color: #c4b5fd; font-size: 11px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; }
  .rv-preview-section p { margin: 8px 0 0; color: #cbd5e1; font-size: 12px; line-height: 1.65; white-space: pre-wrap; }
  .rv-preview-section ul { margin: 8px 0 0 17px; padding: 0; color: #cbd5e1; font-size: 12px; line-height: 1.6; } .rv-preview-section li { margin: 4px 0; }
  .rv-full-text-section { margin-top: 16px; padding: 15px; border: 1px solid rgba(148,163,184,.14); border-radius: 15px; background: #020617; }
  .rv-full-text-section pre { max-height: 350px; margin: 11px 0 0; overflow: auto; color: #e2e8f0; white-space: pre-wrap; font-family: inherit; font-size: 11px; line-height: 1.65; }
  .rv-state-card { min-height: 320px; display: grid; place-content: center; justify-items: center; gap: 10px; margin-top: 20px; padding: 25px; border-radius: 22px; color: #a78bfa; text-align: center; }
  .rv-state-card h2 { margin: 2px 0 0; color: white; font-size: 18px; } .rv-state-card p { max-width: 490px; margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6; }
  .rv-error-card { color: #fca5a5; } .rv-detail-empty { min-height: 650px; margin-top: 0; }
  .rv-empty-filter, .rv-empty-preview { min-height: 210px; display: grid; place-content: center; justify-items: center; gap: 8px; margin-top: 14px; padding: 20px; border: 1px dashed rgba(148,163,184,.25); border-radius: 16px; color: #94a3b8; font-size: 12px; text-align: center; }
  .rv-empty-filter strong { color: #e2e8f0; }
  .rv-spin { animation: rv-spin .8s linear infinite; } @keyframes rv-spin { to { transform: rotate(360deg); } }
  @media (max-width: 1140px) { .rv-content-grid { grid-template-columns: 1fr; } .rv-version-list { max-height: 440px; } .rv-detail-empty { min-height: 300px; } }
  @media (max-width: 820px) { .rv-stats-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
  @media (max-width: 650px) { .rv-page { padding-bottom: 24px; } .rv-hero, .rv-preview-head { display: grid; } .rv-hero { padding: 20px; } .rv-hero-actions, .rv-preview-actions { justify-content: stretch; } .rv-hero-actions button, .rv-preview-actions button { flex: 1 1 100%; } .rv-stats-grid, .rv-toolbar, .rv-diff-grid, .rv-selector-grid { grid-template-columns: 1fr; } .rv-switch-icon { transform: rotate(90deg); margin: 0; } .rv-diff-summary { align-self: flex-start; } }
`;

export default ResumeVersionsPage;
