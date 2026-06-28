import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
import {
  Award,
  ArrowDown,
  ArrowUp,
  Bold,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileText,
  History,
  Layers3,
  LayoutTemplate,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  Type,
  Wand2,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import {
  getUserStorageItem,
  removeUserStorageItem,
  setUserStorageItem,
} from "../utils/userStorage";
import { analyzeKeywordMatch } from "../utils/resumeKeywordMatch";

const BUILDER_STATE_KEY = "professionalResumeBuilderState";

const TEMPLATE_OPTIONS = [
  {
    name: "ATS Professional",
    description: "Clean recruiter-friendly layout",
    accent: "#2563eb",
    mode: "classic",
  },
  {
    name: "Modern Developer",
    description: "Tech profile with skills sidebar",
    accent: "#7c3aed",
    mode: "sidebar",
  },
  {
    name: "Corporate Clean",
    description: "Executive professional format",
    accent: "#0f766e",
    mode: "corporate",
  },
  {
    name: "Minimal Resume",
    description: "Simple one-page ATS layout",
    accent: "#475569",
    mode: "minimal",
  },
  {
    name: "Oxford",
    description: "Traditional serif professional layout",
    accent: "#1f3a5f",
    mode: "oxford",
  },
  {
    name: "Executive Blue Header",
    description: "Classic dark header with contact panel",
    accent: "#123f67",
    mode: "blue-header",
  },
];

const TABS = [
  "Details",
  "Summary",
  "Skills",
  "Experience",
  "Projects",
  "Certifications",
  "Achievements",
  "Education",
  "Layout",
];

const STANDARD_SECTION_DEFINITIONS = [
  { id: "system-summary", type: "system", key: "summary", title: "Professional Summary" },
  { id: "system-skills", type: "system", key: "skills", title: "Key Skills" },
  { id: "system-experience", type: "system", key: "experience", title: "Professional Experience" },
  { id: "system-projects", type: "system", key: "projects", title: "Projects" },
  { id: "system-certifications", type: "system", key: "certifications", title: "Certifications" },
  { id: "system-achievements", type: "system", key: "achievements", title: "Achievements" },
  { id: "system-education", type: "system", key: "education", title: "Education" },
];

const createClientId = (prefix = "section") => {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `${prefix}-${uuid}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const defaultSectionLayout = () =>
  STANDARD_SECTION_DEFINITIONS.map((section) => ({
    ...section,
    hidden: false,
    subSections: [],
  }));

const normalizeSubSections = (value) =>
  (Array.isArray(value) ? value : [])
    .map((subSection) => ({
      id: text(subSection?.id) || createClientId("sub"),
      title: text(subSection?.title) || "New Subsection",
      bullets: stringArray(subSection?.bullets),
    }))
    .filter((subSection) => subSection.title || subSection.bullets.length);

const normalizeSectionLayout = (value) => {
  const incoming = Array.isArray(value) ? value : [];
  const byKey = new Map(STANDARD_SECTION_DEFINITIONS.map((section) => [section.key, section]));
  const usedSystemKeys = new Set();
  const normalized = [];

  incoming.forEach((section) => {
    const key = text(section?.key).toLowerCase();
    const definition = byKey.get(key);

    if (definition && !usedSystemKeys.has(key)) {
      usedSystemKeys.add(key);
      normalized.push({
        ...definition,
        id: definition.id,
        // System sections may be renamed by the user without disconnecting
        // them from the underlying structured resume data.
        title: text(section?.title) || definition.title,
        // A deleted system section is hidden, not destroyed. This lets users
        // restore it later without losing the original resume data.
        hidden: Boolean(section?.hidden),
        subSections: normalizeSubSections(section?.subSections),
      });
      return;
    }

    if (text(section?.type).toLowerCase() === "custom") {
      normalized.push({
        id: text(section?.id) || createClientId("section"),
        type: "custom",
        key: "",
        title: text(section?.title) || "Custom Section",
        bullets: stringArray(section?.bullets),
        hidden: false,
        subSections: normalizeSubSections(section?.subSections),
      });
    }
  });

  STANDARD_SECTION_DEFINITIONS.forEach((definition) => {
    if (!usedSystemKeys.has(definition.key)) {
      normalized.push({ ...definition, hidden: false, subSections: [] });
    }
  });

  return normalized;
};

const FONT_OPTIONS = [
  { label: "Modern Sans", value: "Arial, Helvetica, sans-serif" },
  { label: "Professional Calibri", value: "Calibri, Candara, 'Segoe UI', Arial, sans-serif" },
  { label: "Classic Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Executive Cambria", value: "Cambria, Georgia, serif" },
];

const ACTION_PROMPTS = {
  "Improve Summary":
    "Rewrite my professional summary as exactly four concise factual sentences in one compact paragraph. Use 48 to 58 words total with no manual line breaks. Include my role, verified experience, domain, strongest supported competencies, and factual responsibilities. Naturally use 3 to 5 high-priority job-description keywords only when supported by my resume. Do not invent claims, skills, or metrics.",
  "Add Metrics":
    "Improve project and experience bullets with measurable impact only where the existing resume supports it. Use [add measurable result] placeholders when a factual metric is missing.",
  "Make ATS Friendly":
    "Improve this resume for ATS readability. Use strong relevant job-description keywords naturally, keep the layout simple, and avoid keyword stuffing.",
  "Rewrite Project Bullets":
    "Rewrite project bullets using action verbs, clear technologies, responsibilities, and business impact. Keep every fact accurate. Keep every original project name unchanged and keep project entries inside the Projects section.",
  "Shorten Resume":
    "Reduce repetition and make the resume concise while preserving important skills, impact, projects, and experience.",
  "Fix Grammar":
    "Fix grammar, tense, punctuation, and clarity. Keep all facts and technologies unchanged.",
  "Match This JD":
    "Tailor the professional summary, skills, experience bullets, and projects to the job description while keeping all information factual. Preserve every original project title and never convert a project into an employment role.",
};

const emptyResume = {
  templateName: "ATS Professional",
  basics: {
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
  },
  professionalSummary: "",
  skillGroups: [{ category: "Relevant Skills", items: [] }],
  experience: [],
  projects: [],
  certifications: [],
  achievements: [],
  education: [],
  skills: [],
  experienceBullets: [],
  projectBullets: [],
  educationText: "",
  fullResumeText: "",
  sectionLayout: defaultSectionLayout(),
};

const safeJsonParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const text = (value) => String(value || "").trim();

const isInvalidCompanyLabel = (value, jobTitle = "") => {
  const company = text(value).toLowerCase();
  const title = text(jobTitle).toLowerCase();
  if (!company) return false;

  return (
    company === title ||
    [
      "engineer",
      "developer",
      "analyst",
      "manager",
      "consultant",
      "specialist",
      "company",
      "organization",
      "n/a",
      "na",
      "unknown",
    ].includes(company)
  );
};

const isInvalidLocationLabel = (value) => {
  const location = text(value).toLowerCase();
  return [
    "engineer",
    "developer",
    "analyst",
    "manager",
    "consultant",
    "specialist",
    "company",
    "organization",
    "n/a",
    "na",
    "unknown",
  ].includes(location);
};

const stringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,/)
      .map((item) => item.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeResume = (source, selectedTemplate = "ATS Professional") => {
  const resume = source || {};
  const basics = {
    ...emptyResume.basics,
    ...(resume.basics || {}),
  };

  let skillGroups = Array.isArray(resume.skillGroups)
    ? resume.skillGroups
        .map((group) => ({
          category: text(group?.category) || "Relevant Skills",
          items: stringArray(group?.items),
        }))
        .filter((group) => group.category || group.items.length)
    : [];

  if (!skillGroups.length && stringArray(resume.skills).length) {
    skillGroups = [
      {
        category: "Relevant Skills",
        items: stringArray(resume.skills),
      },
    ];
  }

  if (!skillGroups.length) {
    skillGroups = [{ category: "Relevant Skills", items: [] }];
  }

  const experience = Array.isArray(resume.experience)
    ? resume.experience.map((item) => {
        const jobTitle = text(item?.jobTitle);
        const rawCompany = text(item?.company);
        const rawLocation = text(item?.location);

        return {
          jobTitle,
          company: isInvalidCompanyLabel(rawCompany, jobTitle) ? "" : rawCompany,
          location: isInvalidLocationLabel(rawLocation) ? "" : rawLocation,
          startDate: text(item?.startDate),
          endDate: text(item?.endDate),
          bullets: stringArray(item?.bullets),
          jobTitleBold: item?.jobTitleBold !== false,
          companyBold: item?.companyBold !== false,
        };
      })
    : [];

  const projects = Array.isArray(resume.projects)
    ? resume.projects.map((item) => ({
        name: text(item?.name),
        startDate: text(item?.startDate),
        endDate: text(item?.endDate),
        bullets: stringArray(item?.bullets),
        nameBold: item?.nameBold !== false,
      }))
    : [];

  const certifications = Array.isArray(resume.certifications)
    ? resume.certifications.map((item) => ({
        title: text(item?.title || item?.name),
        issuer: text(item?.issuer),
        year: text(item?.year),
        details: text(item?.details),
      }))
    : [];

  const achievements = Array.isArray(resume.achievements)
    ? resume.achievements
        .map((item) =>
          typeof item === "string"
            ? { title: text(item), details: "" }
            : { title: text(item?.title), details: text(item?.details) }
        )
        .filter((item) => item.title || item.details)
    : [];

  const education = Array.isArray(resume.education)
    ? resume.education.map((item) => ({
        degree: text(item?.degree),
        institution: text(item?.institution),
        location: text(item?.location),
        startDate: text(item?.startDate),
        endDate: text(item?.endDate),
        details: text(item?.details),
        degreeBold: item?.degreeBold !== false,
        institutionBold: item?.institutionBold !== false,
      }))
    : [];

  return {
    ...emptyResume,
    ...resume,
    templateName: resume.templateName || selectedTemplate,
    basics,
    professionalSummary: text(resume.professionalSummary || resume.summary),
    skillGroups,
    experience,
    projects,
    certifications,
    achievements,
    education,
    sectionLayout: normalizeSectionLayout(resume.sectionLayout),
  };
};

const getSystemSectionTextLines = (resume, key) => {
  const normalized = resume || emptyResume;

  if (key === "summary") {
    return text(normalized.professionalSummary) ? [text(normalized.professionalSummary)] : [];
  }

  if (key === "skills") {
    return (normalized.skillGroups || [])
      .filter((group) => Array.isArray(group.items) && group.items.length)
      .map((group) => `${text(group.category) || "Relevant Skills"}: ${group.items.join(", ")}`);
  }

  if (key === "experience") {
    return (normalized.experience || []).flatMap((item) => [
      [item.jobTitle, item.company].filter(Boolean).join(" | "),
      [item.location, [item.startDate, item.endDate].filter(Boolean).join(" - ")]
        .filter(Boolean)
        .join(" | "),
      ...(item.bullets || []).map((bullet) => `• ${bullet}`),
    ].filter(Boolean));
  }

  if (key === "projects") {
    return (normalized.projects || []).flatMap((item) => [
      text(item.name),
      [item.startDate, item.endDate].filter(Boolean).join(" - "),
      ...(item.bullets || []).map((bullet) => `• ${bullet}`),
    ].filter(Boolean));
  }

  if (key === "certifications") {
    return (normalized.certifications || []).flatMap((item) => [
      [item.title, item.issuer, item.year].filter(Boolean).join(" | "),
      text(item.details),
    ].filter(Boolean));
  }

  if (key === "achievements") {
    return (normalized.achievements || [])
      .map((item) => `• ${[item.title, item.details].filter(Boolean).join(" - ")}`)
      .filter(Boolean);
  }

  if (key === "education") {
    return (normalized.education || []).flatMap((item) => [
      text(item.degree),
      [item.institution, item.location].filter(Boolean).join(" | "),
      [item.startDate, item.endDate].filter(Boolean).join(" - "),
      text(item.details),
    ].filter(Boolean));
  }

  return [];
};

const getSectionSnapshot = (resume, section) =>
  section?.type === "system"
    ? getSystemSectionTextLines(resume, section.key)
    : stringArray(section?.bullets);

const buildResumeText = (resume) => {
  const lines = [];
  const basics = resume?.basics || {};
  const layout = normalizeSectionLayout(resume?.sectionLayout);

  const add = (value = "") => {
    if (text(value)) lines.push(text(value));
  };

  add(basics.fullName);
  add(basics.headline);
  add([basics.email, basics.phone, basics.location, basics.linkedin].filter(Boolean).join(" | "));

  layout.forEach((section) => {
    if (section.hidden) return;

    const sectionLines = getSectionSnapshot(resume, section);
    const subSections = Array.isArray(section.subSections) ? section.subSections : [];
    const hasContent = sectionLines.length || subSections.some((subSection) => text(subSection.title) || (subSection.bullets || []).length);
    if (!hasContent) return;

    add(section.title || "Custom Section");
    sectionLines.forEach(add);
    subSections.forEach((subSection) => {
      if (!text(subSection.title) && !(subSection.bullets || []).length) return;
      add(subSection.title || "Subsection");
      (subSection.bullets || []).forEach((bullet) => add(`• ${bullet}`));
    });
  });

  return lines.join("\n");
};

const getTemplate = (templateName) =>
  TEMPLATE_OPTIONS.find((template) => template.name === templateName) ||
  TEMPLATE_OPTIONS[0];


// PDF export prints the actual on-screen resume preview. This keeps the selected
// template, sidebar/Oxford layout, font, accent colors, and bold text identical.
const ResumeBuilderPage = () => {
  const savedState = useMemo(
    () => safeJsonParse(getUserStorageItem(BUILDER_STATE_KEY), null),
    []
  );

  const [resumes, setResumes] = useState([]);
  const [history, setHistory] = useState([]);
  const [resumeId, setResumeId] = useState(savedState?.resumeId || "");
  const [jobDescription, setJobDescription] = useState(
    savedState?.jobDescription || ""
  );
  const [templateName, setTemplateName] = useState(
    savedState?.templateName || "ATS Professional"
  );
  const [fontFamily, setFontFamily] = useState(
    savedState?.fontFamily || FONT_OPTIONS[0].value
  );
  const [generatedResume, setGeneratedResume] = useState(
    savedState?.generatedResume
      ? normalizeResume(savedState.generatedResume, savedState.templateName)
      : null
  );
  const [activeTab, setActiveTab] = useState(savedState?.activeTab || "Details");
  const [aiPrompt, setAiPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [latestHistoryId, setLatestHistoryId] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const selectedTemplate = getTemplate(templateName);
  const keywordMatch = useMemo(
    () =>
      analyzeKeywordMatch(
        generatedResume ? buildResumeText(generatedResume) : "",
        jobDescription
      ),
    [generatedResume, jobDescription]
  );

  useEffect(() => {
    const loadPage = async () => {
      await Promise.all([fetchResumes(), fetchHistory()]);
      setHydrated(true);
    };

    loadPage();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    setUserStorageItem(
      BUILDER_STATE_KEY,
      JSON.stringify({
        resumeId,
        jobDescription,
        templateName,
        fontFamily,
        generatedResume,
        activeTab,
      })
    );
  }, [hydrated, resumeId, jobDescription, templateName, fontFamily, generatedResume, activeTab]);

  const fetchResumes = async () => {
    try {
      const response = await axiosInstance.get("/api/resume/my-resumes");
      const list = Array.isArray(response.data) ? response.data : [];
      setResumes(list);

      const savedResume = safeJsonParse(getUserStorageItem("selectedResume"));

      if (
        resumeId &&
        list.some((resume) => Number(resume.id) === Number(resumeId))
      ) {
        return;
      }

      if (
        savedResume?.id &&
        list.some((resume) => Number(resume.id) === Number(savedResume.id))
      ) {
        setResumeId(savedResume.id);
        return;
      }

      if (list.length) {
        setResumeId(list[0].id);
        setUserStorageItem("selectedResume", JSON.stringify(list[0]));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load uploaded resumes");
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axiosInstance.get("/api/resume-builder/history");
      const list = Array.isArray(response.data) ? response.data : [];
      setHistory(list);

      if (list.length) {
        setLatestHistoryId((current) => current || list[0].id);
      }

      return list;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setHistoryLoading(false);
    }
  };

  const persistResume = (nextResume, options = {}) => {
    const shouldPreserveLayout = Boolean(options.preserveLayout);
    const nextHasLayout = Array.isArray(nextResume?.sectionLayout);
    const resumeWithLayout = shouldPreserveLayout && !nextHasLayout && generatedResume?.sectionLayout
      ? { ...nextResume, sectionLayout: generatedResume.sectionLayout }
      : nextResume;

    const normalized = normalizeResume(resumeWithLayout, templateName);
    setGeneratedResume(normalized);
  };

  const updateResume = (updater) => {
    setGeneratedResume((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return normalizeResume(next, templateName);
    });
  };

  const updateBasics = (field, value) => {
    updateResume((current) => ({
      ...current,
      basics: {
        ...current.basics,
        [field]: value,
      },
    }));
  };

  const updateGroup = (groupIndex, changes) => {
    updateResume((current) => ({
      ...current,
      skillGroups: current.skillGroups.map((group, index) =>
        index === groupIndex ? { ...group, ...changes } : group
      ),
    }));
  };

  const updateSectionItem = (section, index, changes) => {
    updateResume((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item
      ),
    }));
  };

  const updateBullet = (section, itemIndex, bulletIndex, value) => {
    updateResume((current) => ({
      ...current,
      [section]: current[section].map((item, index) => {
        if (index !== itemIndex) return item;

        const bullets = [...item.bullets];
        bullets[bulletIndex] = value;
        return { ...item, bullets };
      }),
    }));
  };

  const addBullet = (section, itemIndex) => {
    updateResume((current) => ({
      ...current,
      [section]: current[section].map((item, index) =>
        index === itemIndex
          ? { ...item, bullets: [...item.bullets, "Add achievement or responsibility"] }
          : item
      ),
    }));
  };

  const removeBullet = (section, itemIndex, bulletIndex) => {
    updateResume((current) => ({
      ...current,
      [section]: current[section].map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              bullets: item.bullets.filter(
                (_, indexToKeep) => indexToKeep !== bulletIndex
              ),
            }
          : item
      ),
    }));
  };

  const updateSectionLayout = (updater) => {
    updateResume((current) => ({
      ...current,
      sectionLayout: normalizeSectionLayout(
        typeof updater === "function" ? updater(current.sectionLayout || []) : updater
      ),
    }));
  };

  const moveMainSection = (sectionIndex, direction) => {
    updateSectionLayout((layout) => {
      const nextIndex = sectionIndex + direction;
      if (nextIndex < 0 || nextIndex >= layout.length) return layout;
      const next = [...layout];
      [next[sectionIndex], next[nextIndex]] = [next[nextIndex], next[sectionIndex]];
      return next;
    });
  };

  const cloneSubSection = (subSection, titleSuffix = " (Copy)") => ({
    id: createClientId("sub"),
    title: `${text(subSection?.title) || "Subsection"}${titleSuffix}`,
    bullets: [...stringArray(subSection?.bullets)],
  });

  const duplicateMainSection = (sectionIndex) => {
    updateResume((current) => {
      const layout = normalizeSectionLayout(current.sectionLayout);
      const source = layout[sectionIndex];
      if (!source) return current;

      const copy = {
        id: createClientId("section"),
        type: "custom",
        key: "",
        title: `${text(source.title) || "Section"} (Copy)`,
        bullets: getSectionSnapshot(current, source),
        subSections: (source.subSections || []).map((subSection) => cloneSubSection(subSection, "")),
      };

      const next = [...layout];
      next.splice(sectionIndex + 1, 0, copy);
      return { ...current, sectionLayout: next };
    });
  };

  const addCustomSection = () => {
    updateSectionLayout((layout) => [
      ...layout,
      {
        id: createClientId("section"),
        type: "custom",
        key: "",
        title: "Custom Section",
        bullets: ["Add a relevant detail"],
        subSections: [],
      },
    ]);
  };

  const updateLayoutSection = (sectionIndex, changes) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) =>
        index === sectionIndex ? { ...section, ...changes } : section
      )
    );
  };

  const removeMainSection = (sectionIndex) => {
    updateSectionLayout((layout) => {
      const target = layout[sectionIndex];
      if (!target) return layout;

      // System sections keep their source data but are hidden from preview,
      // PDF and exported text. Custom sections are removed completely.
      if (target.type === "system") {
        return layout.map((section, index) =>
          index === sectionIndex ? { ...section, hidden: true } : section
        );
      }

      return layout.filter((_, index) => index !== sectionIndex);
    });
  };

  const restoreSystemSection = (sectionKey) => {
    updateSectionLayout((layout) =>
      layout.map((section) =>
        section.type === "system" && section.key === sectionKey
          ? { ...section, hidden: false }
          : section
      )
    );
  };

  const resetSectionTitle = (sectionIndex) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) => {
        if (index !== sectionIndex || section.type !== "system") return section;
        const definition = STANDARD_SECTION_DEFINITIONS.find((item) => item.key === section.key);
        return { ...section, title: definition?.title || section.title };
      })
    );
  };

  const addCustomSectionBullet = (sectionIndex) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) =>
        index === sectionIndex
          ? { ...section, bullets: [...stringArray(section.bullets), "Add a relevant detail"] }
          : section
      )
    );
  };

  const updateCustomSectionBullet = (sectionIndex, bulletIndex, value) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) => {
        if (index !== sectionIndex) return section;
        const bullets = [...stringArray(section.bullets)];
        bullets[bulletIndex] = value;
        return { ...section, bullets };
      })
    );
  };

  const removeCustomSectionBullet = (sectionIndex, bulletIndex) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) =>
        index === sectionIndex
          ? { ...section, bullets: stringArray(section.bullets).filter((_, itemIndex) => itemIndex !== bulletIndex) }
          : section
      )
    );
  };

  const addSubSection = (sectionIndex) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              subSections: [
                ...(section.subSections || []),
                { id: createClientId("sub"), title: "New Subsection", bullets: ["Add a relevant detail"] },
              ],
            }
          : section
      )
    );
  };

  const moveSubSection = (sectionIndex, subIndex, direction) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) => {
        if (index !== sectionIndex) return section;
        const subSections = [...(section.subSections || [])];
        const nextIndex = subIndex + direction;
        if (nextIndex < 0 || nextIndex >= subSections.length) return section;
        [subSections[subIndex], subSections[nextIndex]] = [subSections[nextIndex], subSections[subIndex]];
        return { ...section, subSections };
      })
    );
  };

  const updateSubSection = (sectionIndex, subIndex, changes) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              subSections: (section.subSections || []).map((subSection, indexToUpdate) =>
                indexToUpdate === subIndex ? { ...subSection, ...changes } : subSection
              ),
            }
          : section
      )
    );
  };

  const duplicateSubSection = (sectionIndex, subIndex) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) => {
        if (index !== sectionIndex) return section;
        const source = (section.subSections || [])[subIndex];
        if (!source) return section;
        const subSections = [...(section.subSections || [])];
        subSections.splice(subIndex + 1, 0, cloneSubSection(source));
        return { ...section, subSections };
      })
    );
  };

  const removeSubSection = (sectionIndex, subIndex) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) =>
        index === sectionIndex
          ? { ...section, subSections: (section.subSections || []).filter((_, itemIndex) => itemIndex !== subIndex) }
          : section
      )
    );
  };

  const addSubSectionBullet = (sectionIndex, subIndex) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) => {
        if (index !== sectionIndex) return section;
        return {
          ...section,
          subSections: (section.subSections || []).map((subSection, itemIndex) =>
            itemIndex === subIndex
              ? { ...subSection, bullets: [...stringArray(subSection.bullets), "Add a relevant detail"] }
              : subSection
          ),
        };
      })
    );
  };

  const updateSubSectionBullet = (sectionIndex, subIndex, bulletIndex, value) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) => {
        if (index !== sectionIndex) return section;
        return {
          ...section,
          subSections: (section.subSections || []).map((subSection, itemIndex) => {
            if (itemIndex !== subIndex) return subSection;
            const bullets = [...stringArray(subSection.bullets)];
            bullets[bulletIndex] = value;
            return { ...subSection, bullets };
          }),
        };
      })
    );
  };

  const removeSubSectionBullet = (sectionIndex, subIndex, bulletIndex) => {
    updateSectionLayout((layout) =>
      layout.map((section, index) => {
        if (index !== sectionIndex) return section;
        return {
          ...section,
          subSections: (section.subSections || []).map((subSection, itemIndex) =>
            itemIndex === subIndex
              ? { ...subSection, bullets: stringArray(subSection.bullets).filter((_, itemIndexToKeep) => itemIndexToKeep !== bulletIndex) }
              : subSection
          ),
        };
      })
    );
  };

  const handleResumeSelection = (event) => {
    const nextId = Number(event.target.value);
    const selectedResume = resumes.find(
      (resume) => Number(resume.id) === nextId
    );

    setResumeId(nextId);

    if (selectedResume) {
      setUserStorageItem("selectedResume", JSON.stringify(selectedResume));
    }
  };

  const handleTemplateChange = (nextTemplate) => {
    setTemplateName(nextTemplate.name);

    if (generatedResume) {
      updateResume((current) => ({
        ...current,
        templateName: nextTemplate.name,
      }));
    }
  };

  const handleGenerate = async () => {
    if (!resumeId) {
      toast.error("Please select an uploaded resume");
      return;
    }

    if (!jobDescription.trim()) {
      toast.error("Please paste a job description");
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post("/api/resume-builder/generate", {
        resumeId: Number(resumeId),
        jobDescription: jobDescription.trim(),
        templateName,
      });

      persistResume({
        ...response.data,
        templateName: response.data.templateName || templateName,
      });

      const updatedHistory = await fetchHistory();
      setLatestHistoryId(updatedHistory[0]?.id || null);
      toast.success("AI resume generated successfully");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to generate AI resume"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAiAction = (action) => {
    setAiPrompt(ACTION_PROMPTS[action]);
    toast.success(`${action} prompt added`);
  };

  const handleRefine = async () => {
    if (!generatedResume) {
      toast.error("Generate a resume first");
      return;
    }

    if (!aiPrompt.trim()) {
      toast.error("Enter an AI refinement instruction");
      return;
    }

    try {
      setRefining(true);

      const response = await axiosInstance.post("/api/resume-builder/refine", {
        resumeId: Number(resumeId),
        jobDescription: jobDescription.trim(),
        userPrompt: aiPrompt.trim(),
        templateName,
        resume: {
          ...generatedResume,
          fullResumeText: buildResumeText(generatedResume),
        },
      });

      persistResume(
        {
          ...response.data,
          templateName: response.data.templateName || templateName,
        },
        { preserveLayout: true }
      );

      const updatedHistory = await fetchHistory();
      setLatestHistoryId(updatedHistory[0]?.id || null);
      toast.success("AI refinement applied");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "AI refinement failed"
      );
    } finally {
      setRefining(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!latestHistoryId) {
      toast.error("Generate or refine a resume before saving a version");
      return;
    }

    try {
      setSavingVersion(true);
      await axiosInstance.post(
        `/api/resume-builder/history/${latestHistoryId}/save-version`
      );
      toast.success("Resume version saved");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Failed to save resume version"
      );
    } finally {
      setSavingVersion(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generatedResume) {
      toast.error("Generate a resume first");
      return;
    }

    const resumeElement = document.getElementById("resume-print-area");
    if (!resumeElement) {
      toast.error("Resume preview is not ready for PDF export");
      return;
    }

    const copyComputedStyles = (source, target) => {
      const sourceStyle = window.getComputedStyle(source);
      const styleProperties = [
        "display",
        "position",
        "box-sizing",
        "width",
        "height",
        "min-height",
        "max-width",
        "margin",
        "padding",
        "background",
        "background-color",
        "background-image",
        "color",
        "font-family",
        "font-size",
        "font-weight",
        "font-style",
        "line-height",
        "letter-spacing",
        "text-align",
        "border",
        "border-top",
        "border-right",
        "border-bottom",
        "border-left",
        "border-radius",
        "box-shadow",
        "grid-template-columns",
        "grid-template-rows",
        "grid-column",
        "grid-row",
        "gap",
        "column-gap",
        "row-gap",
        "align-items",
        "justify-content",
        "flex-direction",
        "flex-wrap",
        "overflow",
        "overflow-wrap",
        "white-space",
        "list-style",
        "list-style-type",
        "opacity",
        "transform",
        "visibility",
      ];

      styleProperties.forEach((property) => {
        target.style.setProperty(property, sourceStyle.getPropertyValue(property));
      });

      Array.from(source.children).forEach((sourceChild, index) => {
        const targetChild = target.children[index];
        if (targetChild) {
          copyComputedStyles(sourceChild, targetChild);
        }
      });
    };

    let exportHost;

    try {
      setDownloadingPdf(true);
      toast.loading("Capturing the live resume design...", { id: "resume-pdf" });

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Export a fixed desktop-size clone. This prevents responsive CSS from
      // collapsing the purple sidebar into a normal one-column resume.
      exportHost = document.createElement("div");
      exportHost.setAttribute("aria-hidden", "true");
      exportHost.style.cssText = [
        "position:fixed",
        "left:-20000px",
        "top:0",
        "width:794px",
        "margin:0",
        "padding:0",
        "overflow:visible",
        "pointer-events:none",
        "z-index:-1",
        "background:#ffffff",
      ].join(";");

      const exportResume = resumeElement.cloneNode(true);
      exportResume.id = "resume-visual-export";
      copyComputedStyles(resumeElement, exportResume);

      exportResume.style.setProperty("width", "794px", "important");
      exportResume.style.setProperty("max-width", "794px", "important");
      exportResume.style.setProperty("min-height", "1123px", "important");
      exportResume.style.setProperty("margin", "0", "important");
      exportResume.style.setProperty("box-shadow", "none", "important");
      exportResume.style.setProperty("transform", "none", "important");

      if (resumeElement.classList.contains("resume-sidebar-layout")) {
        exportResume.style.setProperty("display", "grid", "important");
        exportResume.style.setProperty("grid-template-columns", "246px 548px", "important");
        exportResume.style.setProperty("padding", "0", "important");

        const sourceSidebar = resumeElement.querySelector(".resume-side-column");
        const exportSidebar = exportResume.querySelector(".resume-side-column");
        const exportMain = exportResume.querySelector(".resume-main-column");

        if (sourceSidebar && exportSidebar) {
          const sidebarStyle = window.getComputedStyle(sourceSidebar);
          exportSidebar.style.setProperty("display", "block", "important");
          exportSidebar.style.setProperty("background", sidebarStyle.background, "important");
          exportSidebar.style.setProperty("background-color", sidebarStyle.backgroundColor, "important");
          exportSidebar.style.setProperty("color", sidebarStyle.color, "important");
          exportSidebar.style.setProperty("min-height", "100%", "important");
        }

        if (exportMain) {
          exportMain.style.setProperty("display", "block", "important");
          exportMain.style.setProperty("background", "#ffffff", "important");
        }
      }

      exportHost.appendChild(exportResume);
      document.body.appendChild(exportHost);

      await new Promise((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(resolve);
        });
      });

      if (resumeElement.classList.contains("resume-sidebar-layout")) {
        const exportSidebar = exportResume.querySelector(".resume-side-column");
        if (exportSidebar) {
          exportSidebar.style.setProperty(
            "min-height",
            `${Math.max(1123, exportResume.scrollHeight)}px`,
            "important"
          );
        }
      }

      const canvas = await html2canvas(exportResume, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        height: exportResume.scrollHeight,
        windowWidth: 794,
        windowHeight: exportResume.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imageWidth = pdfWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      const imageData = canvas.toDataURL("image/png", 1.0);

      let heightRemaining = imageHeight;
      let imageY = 0;

      pdf.addImage(imageData, "PNG", 0, imageY, imageWidth, imageHeight, undefined, "FAST");
      heightRemaining -= pdfHeight;

      while (heightRemaining > 0.5) {
        imageY = heightRemaining - imageHeight;
        pdf.addPage("a4", "portrait");
        pdf.addImage(imageData, "PNG", 0, imageY, imageWidth, imageHeight, undefined, "FAST");
        heightRemaining -= pdfHeight;
      }

      const fileName = (generatedResume.basics?.fullName || "optimized-resume")
        .replace(/[^a-z0-9]/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

      pdf.save(`${fileName || "optimized-resume"}-visual.pdf`);
      toast.success("Exact visual PDF downloaded", { id: "resume-pdf" });
    } catch (error) {
      console.error("Visual PDF export failed:", error);
      toast.error("PDF download failed. Please try again.", { id: "resume-pdf" });
    } finally {
      exportHost?.remove();
      setDownloadingPdf(false);
    }
  };

  const handleDuplicate = () => {
    if (!generatedResume) {
      toast.error("Generate a resume first");
      return;
    }

    const duplicate = JSON.parse(JSON.stringify(generatedResume));
    persistResume(duplicate);
    toast.success("Editable copy created");
  };

  const clearSavedDraft = () => {
    removeUserStorageItem(BUILDER_STATE_KEY);
    setGeneratedResume(null);
    setJobDescription("");
    setAiPrompt("");
    setActiveTab("Details");
    toast.success("Builder draft cleared");
  };

  const openHistory = (item) => {
    const source = item.response || item.resume || item.generatedResume || item;
    const restored = normalizeResume(source, item.templateName || templateName);

    if (!restored.basics.fullName && !restored.professionalSummary) {
      toast.error("This history item does not include preview content");
      return;
    }

    persistResume(restored);
    setTemplateName(restored.templateName || item.templateName || templateName);
    setJobDescription(item.jobDescription || jobDescription);
    setLatestHistoryId(item.id);
    toast.success("Resume history loaded");
  };

  const renderEditor = () => {
    if (!generatedResume) {
      return (
        <div className="rb-editor-empty">
          <Sparkles size={30} />
          <h3>Generate your first AI resume</h3>
          <p>
            Select an uploaded resume, paste a job description, choose a template,
            and click Generate.
          </p>
        </div>
      );
    }

    if (activeTab === "Details") {
      return (
        <div className="rb-editor-section">
          <SectionHeading
            title="Personal Details"
            subtitle="Use only details you want recruiters to see."
          />
          <div className="rb-form-grid">
            <TextField
              label="Full Name"
              value={generatedResume.basics.fullName}
              onChange={(value) => updateBasics("fullName", value)}
            />
            <TextField
              label="Professional Headline"
              value={generatedResume.basics.headline}
              onChange={(value) => updateBasics("headline", value)}
            />
            <TextField
              label="Email"
              value={generatedResume.basics.email}
              onChange={(value) => updateBasics("email", value)}
            />
            <TextField
              label="Phone"
              value={generatedResume.basics.phone}
              onChange={(value) => updateBasics("phone", value)}
            />
            <TextField
              label="Location"
              value={generatedResume.basics.location}
              onChange={(value) => updateBasics("location", value)}
            />
            <TextField
              label="LinkedIn / Portfolio"
              value={generatedResume.basics.linkedin}
              onChange={(value) => updateBasics("linkedin", value)}
            />
          </div>
        </div>
      );
    }

    if (activeTab === "Summary") {
      return (
        <div className="rb-editor-section">
          <SectionHeading
            title="Professional Summary"
            subtitle="Use four concise sentences in one compact paragraph with verified role keywords."
          />
          <RichTextArea
            className="rb-summary-editor"
            value={generatedResume.professionalSummary}
            onChange={(value) =>
              updateResume((current) => ({
                ...current,
                professionalSummary: value,
              }))
            }
            placeholder="Write a compact four-sentence summary. Select text and use Bold when required."
          />
        </div>
      );
    }

    if (activeTab === "Skills") {
      return (
        <div className="rb-editor-section">
          <SectionHeading
            title="Technical Skills"
            subtitle="Group related skills to keep the resume easy to scan."
            action={
              <button
                className="rb-secondary-btn"
                onClick={() =>
                  updateResume((current) => ({
                    ...current,
                    skillGroups: [
                      ...current.skillGroups,
                      { category: "New Skill Group", items: [] },
                    ],
                  }))
                }
              >
                <Plus size={15} /> Add Group
              </button>
            }
          />

          <div className="rb-editor-stack">
            {generatedResume.skillGroups.map((group, groupIndex) => (
              <div className="rb-edit-card" key={`${group.category}-${groupIndex}`}>
                <div className="rb-edit-card-head">
                  <input
                    className="rb-card-title-input"
                    value={group.category}
                    onChange={(event) =>
                      updateGroup(groupIndex, { category: event.target.value })
                    }
                  />
                  <button
                    className="rb-icon-btn danger"
                    title="Remove skill group"
                    onClick={() =>
                      updateResume((current) => ({
                        ...current,
                        skillGroups: current.skillGroups.filter(
                          (_, index) => index !== groupIndex
                        ),
                      }))
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="rb-skill-editor">
                  {group.items.map((skill, skillIndex) => (
                    <div className="rb-skill-row" key={`${skill}-${skillIndex}`}>
                      <input
                        value={skill}
                        onChange={(event) => {
                          const items = [...group.items];
                          items[skillIndex] = event.target.value;
                          updateGroup(groupIndex, { items });
                        }}
                      />
                      <button
                        className="rb-icon-btn danger"
                        onClick={() => {
                          const items = group.items.filter(
                            (_, index) => index !== skillIndex
                          );
                          updateGroup(groupIndex, { items });
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  className="rb-add-line-btn"
                  onClick={() =>
                    updateGroup(groupIndex, {
                      items: [...group.items, "New Skill"],
                    })
                  }
                >
                  <Plus size={14} /> Add Skill
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === "Experience") {
      return (
        <ItemEditor
          type="experience"
          items={generatedResume.experience}
          onChange={(index, changes) => updateSectionItem("experience", index, changes)}
          onAdd={() =>
            updateResume((current) => ({
              ...current,
              experience: [
                ...current.experience,
                {
                  jobTitle: "Job Title",
                  company: "Company Name",
                  location: "",
                  startDate: "",
                  endDate: "",
                  bullets: ["Add achievement or responsibility"],
                  jobTitleBold: true,
                  companyBold: true,
                },
              ],
            }))
          }
          onRemove={(index) =>
            updateResume((current) => ({
              ...current,
              experience: current.experience.filter(
                (_, itemIndex) => itemIndex !== index
              ),
            }))
          }
          onAddBullet={(index) => addBullet("experience", index)}
          onUpdateBullet={(itemIndex, bulletIndex, value) =>
            updateBullet("experience", itemIndex, bulletIndex, value)
          }
          onRemoveBullet={(itemIndex, bulletIndex) =>
            removeBullet("experience", itemIndex, bulletIndex)
          }
        />
      );
    }

    if (activeTab === "Projects") {
      return (
        <ItemEditor
          type="projects"
          items={generatedResume.projects}
          onChange={(index, changes) => updateSectionItem("projects", index, changes)}
          onAdd={() =>
            updateResume((current) => ({
              ...current,
              projects: [
                ...current.projects,
                {
                  name: "Project Name",
                  startDate: "",
                  endDate: "",
                  bullets: ["Add project achievement"],
                  nameBold: true,
                },
              ],
            }))
          }
          onRemove={(index) =>
            updateResume((current) => ({
              ...current,
              projects: current.projects.filter(
                (_, itemIndex) => itemIndex !== index
              ),
            }))
          }
          onAddBullet={(index) => addBullet("projects", index)}
          onUpdateBullet={(itemIndex, bulletIndex, value) =>
            updateBullet("projects", itemIndex, bulletIndex, value)
          }
          onRemoveBullet={(itemIndex, bulletIndex) =>
            removeBullet("projects", itemIndex, bulletIndex)
          }
        />
      );
    }

    if (activeTab === "Certifications") {
      return (
        <SimpleEntryEditor
          title="Certifications"
          subtitle="Show only credentials that are present in the source resume."
          icon={<Award size={18} />}
          items={generatedResume.certifications}
          fields={[
            { key: "title", label: "Certification" },
            { key: "issuer", label: "Issuer" },
            { key: "year", label: "Year" },
            { key: "details", label: "Details" },
          ]}
          addLabel="Add Certification"
          onChange={(index, changes) => updateSectionItem("certifications", index, changes)}
          onAdd={() =>
            updateResume((current) => ({
              ...current,
              certifications: [
                ...current.certifications,
                { title: "Certification", issuer: "", year: "", details: "" },
              ],
            }))
          }
          onRemove={(index) =>
            updateResume((current) => ({
              ...current,
              certifications: current.certifications.filter(
                (_, itemIndex) => itemIndex !== index
              ),
            }))
          }
        />
      );
    }

    if (activeTab === "Achievements") {
      return (
        <SimpleEntryEditor
          title="Achievements"
          subtitle="Keep genuine awards, recognitions, and accomplishments from the original resume."
          icon={<Trophy size={18} />}
          items={generatedResume.achievements}
          fields={[
            { key: "title", label: "Achievement" },
            { key: "details", label: "Details" },
          ]}
          addLabel="Add Achievement"
          onChange={(index, changes) => updateSectionItem("achievements", index, changes)}
          onAdd={() =>
            updateResume((current) => ({
              ...current,
              achievements: [
                ...current.achievements,
                { title: "Achievement", details: "" },
              ],
            }))
          }
          onRemove={(index) =>
            updateResume((current) => ({
              ...current,
              achievements: current.achievements.filter(
                (_, itemIndex) => itemIndex !== index
              ),
            }))
          }
        />
      );
    }

    if (activeTab === "Layout") {
      return (
        <ResumeOutlineEditor
          layout={generatedResume.sectionLayout}
          onMoveMain={moveMainSection}
          onDuplicateMain={duplicateMainSection}
          onAddCustom={addCustomSection}
          onUpdateSection={updateLayoutSection}
          onRemoveMain={removeMainSection}
          onRestoreSystem={restoreSystemSection}
          onResetSectionTitle={resetSectionTitle}
          onAddCustomBullet={addCustomSectionBullet}
          onUpdateCustomBullet={updateCustomSectionBullet}
          onRemoveCustomBullet={removeCustomSectionBullet}
          onAddSubSection={addSubSection}
          onMoveSubSection={moveSubSection}
          onUpdateSubSection={updateSubSection}
          onDuplicateSubSection={duplicateSubSection}
          onRemoveSubSection={removeSubSection}
          onAddSubSectionBullet={addSubSectionBullet}
          onUpdateSubSectionBullet={updateSubSectionBullet}
          onRemoveSubSectionBullet={removeSubSectionBullet}
        />
      );
    }

    return (
      <EducationEditor
        items={generatedResume.education}
        onChange={(index, changes) => updateSectionItem("education", index, changes)}
        onAdd={() =>
          updateResume((current) => ({
            ...current,
            education: [
              ...current.education,
              {
                degree: "Degree",
                institution: "Institution",
                location: "",
                startDate: "",
                endDate: "",
                details: "",
                degreeBold: true,
                institutionBold: true,
              },
            ],
          }))
        }
        onRemove={(index) =>
          updateResume((current) => ({
            ...current,
            education: current.education.filter(
              (_, itemIndex) => itemIndex !== index
            ),
          }))
        }
      />
    );
  };

  return (
    <div className="rb-app">
      <style>{styles}</style>

      <header className="rb-topbar no-print">
        <div>
          <p className="rb-eyebrow">AI Resume Studio</p>
          <h1>Build a professional, job-tailored resume</h1>
          <p className="rb-subtitle">
            Edit every section, switch templates instantly, save versions, and
            refine content with AI.
          </p>
        </div>

        <div className="rb-header-status" aria-label="Resume builder status">
          <span><CheckCircle2 size={15} /> Auto-save enabled</span>
          <span className="rb-header-status-muted">ATS-ready workspace</span>
        </div>
      </header>

      <section className="rb-setup-panel no-print">
        <div className="rb-setup-field">
          <label>
            <FileText size={15} /> Uploaded Resume
          </label>
          <div className="rb-select-wrap">
            <select value={resumeId} onChange={handleResumeSelection}>
              <option value="">Select uploaded resume</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.fileName || `Resume #${resume.id}`}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="rb-setup-field rb-jd-field">
          <label>
            <BriefcaseBusiness size={15} /> Target Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the target job description here..."
          />
        </div>

        <button className="rb-generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
          {loading ? "Generating..." : "Generate AI Resume"}
        </button>
      </section>

      <section className="rb-template-section no-print">
        <div className="rb-section-label-row">
          <div>
            <p className="rb-mini-label">Choose a template</p>
            <h2>Professional layouts</h2>
          </div>
          <span className="rb-template-selected">
            <LayoutTemplate size={15} /> {templateName}
          </span>
        </div>

        <div className="rb-template-grid">
          {TEMPLATE_OPTIONS.map((template) => (
            <button
              key={template.name}
              className={`rb-template-card ${
                templateName === template.name ? "active" : ""
              }`}
              onClick={() => handleTemplateChange(template)}
              type="button"
            >
              <span
                className="rb-template-preview"
                style={{ "--template-accent": template.accent }}
              >
                <i />
                <b />
                <em />
              </span>
              <span className="rb-template-copy">
                <strong>{template.name}</strong>
                <small>{template.description}</small>
              </span>
              {templateName === template.name && <CheckCircle2 size={18} />}
            </button>
          ))}
        </div>
      </section>

      <section className="rb-match-panel no-print">
        <div className="rb-match-heading">
          <div>
            <p className="rb-mini-label">Job description match</p>
            <h2>Keyword coverage</h2>
            <p>
              Review matched and missing job-description terms here. Add a missing term only when it is genuinely supported by the candidate’s original experience.
            </p>
          </div>

          <div className="rb-match-score" aria-label={`Keyword match score ${keywordMatch.score}%`}>
            <strong>{keywordMatch.score}%</strong>
            <span>match</span>
          </div>
        </div>

        {jobDescription.trim() ? (
          <div className="rb-match-grid">
            <div className="rb-keyword-column matched">
              <div className="rb-keyword-title">
                <CheckCircle2 size={16} /> Matched ({keywordMatch.matchedKeywords.length})
              </div>
              <div className="rb-keyword-chips">
                {keywordMatch.matchedKeywords.length ? (
                  keywordMatch.matchedKeywords.map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))
                ) : (
                  <small>Generate or edit a resume to see matches.</small>
                )}
              </div>
            </div>

            <div className="rb-keyword-column missing">
              <div className="rb-keyword-title">
                <Layers3 size={16} /> Missing ({keywordMatch.missingKeywords.length})
              </div>
              <div className="rb-keyword-chips">
                {keywordMatch.missingKeywords.length ? (
                  keywordMatch.missingKeywords.map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))
                ) : (
                  <small>No high-priority missing terms found.</small>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rb-match-empty">Paste a target job description to analyze keyword coverage.</div>
        )}
      </section>

      <main className="rb-workspace">
        <section className="rb-editor-panel no-print">
          <div className="rb-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="rb-editor-content">{renderEditor()}</div>

          <div className="rb-ai-panel">
            <div className="rb-ai-heading">
              <span className="rb-ai-icon">
                <Bot size={17} />
              </span>
              <div>
                <strong>AI Content Assistant</strong>
                <p>Apply a targeted improvement to the structured resume.</p>
              </div>
            </div>

            <div className="rb-action-chips">
              {Object.keys(ACTION_PROMPTS).map((action) => (
                <button key={action} onClick={() => handleAiAction(action)}>
                  <Wand2 size={13} /> {action}
                </button>
              ))}
            </div>

            <textarea
              className="rb-textarea"
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              placeholder="Example: Rewrite project bullets for a Java Full Stack Developer role. Do not invent metrics."
            />

            <button
              className="rb-primary-btn rb-refine-btn"
              onClick={handleRefine}
              disabled={!generatedResume || refining}
            >
              {refining ? <Loader2 className="spin" size={16} /> : <Bot size={16} />}
              {refining ? "Applying AI..." : "Apply AI Refinement"}
            </button>
          </div>

          <div className="rb-history-panel">
            <div className="rb-history-title">
              <History size={17} />
              <strong>Recent Builder History</strong>
            </div>

            {historyLoading ? (
              <p className="rb-muted">Loading history...</p>
            ) : history.length ? (
              <div className="rb-history-list">
                {history.slice(0, 5).map((item) => (
                  <button key={item.id} onClick={() => openHistory(item)}>
                    <span>
                      <strong>{item.templateName || "Resume Draft"}</strong>
                      <small>
                        Resume #{item.resumeId} ·{" "}
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : "Saved draft"}
                      </small>
                    </span>
                    <RefreshCw size={15} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="rb-muted">Your generated versions will appear here.</p>
            )}
          </div>

          <button className="rb-clear-btn" onClick={clearSavedDraft}>
            Clear local draft
          </button>
        </section>

        <section className="rb-preview-panel">
          <div className="rb-preview-stage">
            <div className="rb-preview-actions-panel no-print">
              <div className="rb-preview-title-group">
              <p className="rb-mini-label">Live Resume Preview</p>
              <h2>{generatedResume ? templateName : "Your resume preview"}</h2>
              <p>PDF export captures this exact live template, font, colors, and formatting.</p>
            </div>

            <div className="rb-preview-controls">
              <label className="rb-font-picker rb-font-picker-preview" title="Choose the font used in this resume">
                <Type size={16} />
                <span>Font</span>
                <select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)}>
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="rb-preview-action-btn"
                onClick={handleDuplicate}
                disabled={!generatedResume}
                title="Create an editable duplicate"
              >
                <Copy size={15} /> Duplicate
              </button>

              <button
                className="rb-preview-action-btn"
                onClick={handleSaveVersion}
                disabled={!latestHistoryId || savingVersion}
                title="Save this generated resume as a version"
              >
                {savingVersion ? <Loader2 className="spin" size={15} /> : <Save size={15} />}
                Save version
              </button>

              <button
                className="rb-preview-download-btn"
                onClick={handleDownloadPdf}
                disabled={!generatedResume || downloadingPdf}
              >
                {downloadingPdf ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                {downloadingPdf ? "Preparing PDF..." : "Download Exact PDF"}
              </button>

              <span className="rb-preview-status">
                <span />
                Auto-saved
              </span>
              </div>
            </div>

            <div className="rb-preview-document">
              <ResumePreview
                resume={generatedResume}
                template={selectedTemplate}
                fontFamily={fontFamily}
                emptyMessage="Generate an AI resume to see the professional live preview."
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const TextField = ({ label, value, onChange }) => (
  <label className="rb-field">
    <span>{label}</span>
    <input value={value} onChange={(event) => onChange(event.target.value)} />
  </label>
);

const RichTextArea = ({ value, onChange, placeholder, className = "", compact = false }) => {
  const textareaRef = useRef(null);

  const applyBold = () => {
    const target = textareaRef.current;
    if (!target) return;

    const start = target.selectionStart;
    const end = target.selectionEnd;
    const selectedText = value.slice(start, end) || "bold text";
    const nextValue = `${value.slice(0, start)}**${selectedText}**${value.slice(end)}`;

    onChange(nextValue);

    requestAnimationFrame(() => {
      target.focus();
      const selectionStart = start + 2;
      target.setSelectionRange(selectionStart, selectionStart + selectedText.length);
    });
  };

  return (
    <div className={`rb-rich-text-editor ${compact ? "compact" : ""} ${className}`}>
      <div className="rb-rich-toolbar">
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={applyBold}>
          <Bold size={14} /> Bold
        </button>
        <span>Select words, then click Bold</span>
      </div>
      <textarea
        ref={textareaRef}
        className="rb-rich-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

const SectionHeading = ({ title, subtitle, action }) => (
  <div className="rb-editor-heading">
    <div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
    {action}
  </div>
);

const FormatToggle = ({ label, active = true, onClick }) => (
  <button
    type="button"
    className={`rb-format-toggle ${active ? "active" : ""}`}
    onClick={onClick}
    title={`${active ? "Remove" : "Apply"} bold formatting for ${label.toLowerCase()}`}
  >
    <Bold size={13} /> {label}
  </button>
);

const ItemEditor = ({
  type,
  items,
  onChange,
  onAdd,
  onRemove,
  onAddBullet,
  onUpdateBullet,
  onRemoveBullet,
}) => {
  const isExperience = type === "experience";
  const title = isExperience ? "Professional Experience" : "Projects";

  return (
    <div className="rb-editor-section">
      <SectionHeading
        title={title}
        subtitle={
          isExperience
            ? "Use action verbs and clear impact statements."
            : "Keep the original project name exact; show technologies, responsibilities, and verified outcomes."
        }
        action={
          <button className="rb-secondary-btn" onClick={onAdd}>
            <Plus size={15} /> Add {isExperience ? "Experience" : "Project"}
          </button>
        }
      />

      <div className="rb-editor-stack">
        {items.map((item, itemIndex) => (
          <div className="rb-edit-card" key={`${type}-${itemIndex}`}>
            <div className="rb-edit-card-head">
              <strong>{isExperience ? "Experience Entry" : "Project Entry"} {itemIndex + 1}</strong>
              <button className="rb-icon-btn danger" onClick={() => onRemove(itemIndex)}>
                <Trash2 size={15} />
              </button>
            </div>

            <div className="rb-form-grid">
              {isExperience ? (
                <>
                  <TextField
                    label="Job Title"
                    value={item.jobTitle}
                    onChange={(value) => onChange(itemIndex, { jobTitle: value })}
                  />
                  <TextField
                    label="Company"
                    value={item.company}
                    onChange={(value) => onChange(itemIndex, { company: value })}
                  />
                  <TextField
                    label="Location"
                    value={item.location}
                    onChange={(value) => onChange(itemIndex, { location: value })}
                  />
                </>
              ) : (
                <TextField
                  label="Project Name"
                  value={item.name}
                  onChange={(value) => onChange(itemIndex, { name: value })}
                />
              )}
              <TextField
                label="Start Date"
                value={item.startDate}
                onChange={(value) => onChange(itemIndex, { startDate: value })}
              />
              <TextField
                label="End Date"
                value={item.endDate}
                onChange={(value) => onChange(itemIndex, { endDate: value })}
              />
            </div>

            <div className="rb-format-row">
              <span>Preview & PDF formatting</span>
              {isExperience ? (
                <>
                  <FormatToggle
                    label="Job Title"
                    active={item.jobTitleBold !== false}
                    onClick={() => onChange(itemIndex, { jobTitleBold: item.jobTitleBold === false })}
                  />
                  <FormatToggle
                    label="Company"
                    active={item.companyBold !== false}
                    onClick={() => onChange(itemIndex, { companyBold: item.companyBold === false })}
                  />
                </>
              ) : (
                <FormatToggle
                  label="Project Title"
                  active={item.nameBold !== false}
                  onClick={() => onChange(itemIndex, { nameBold: item.nameBold === false })}
                />
              )}
            </div>

            <div className="rb-bullet-section">
              <span>Bullet Points</span>
              {item.bullets.map((bullet, bulletIndex) => (
                <div className="rb-bullet-edit-row" key={`${bulletIndex}-${bullet}`}>
                  <span>•</span>
                  <RichTextArea
                    compact
                    value={bullet}
                    onChange={(value) =>
                      onUpdateBullet(itemIndex, bulletIndex, value)
                    }
                    placeholder="Write a clear bullet point..."
                  />
                  <button
                    className="rb-icon-btn danger"
                    onClick={() => onRemoveBullet(itemIndex, bulletIndex)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button className="rb-add-line-btn" onClick={() => onAddBullet(itemIndex)}>
                <Plus size={14} /> Add Bullet
              </button>
            </div>
          </div>
        ))}

        {!items.length && (
          <div className="rb-editor-empty compact">
            <Layers3 size={24} />
            <p>No entries yet. Add one to start editing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SimpleEntryEditor = ({
  title,
  subtitle,
  icon,
  items,
  fields,
  addLabel,
  onChange,
  onAdd,
  onRemove,
}) => (
  <div className="rb-editor-section">
    <SectionHeading
      title={title}
      subtitle={subtitle}
      action={
        <button className="rb-secondary-btn" onClick={onAdd}>
          <Plus size={15} /> {addLabel}
        </button>
      }
    />

    <div className="rb-editor-stack">
      {items.map((item, index) => (
        <div className="rb-edit-card" key={`${title}-${index}`}>
          <div className="rb-edit-card-head">
            <span className="rb-inline-icon">{icon}</span>
            <strong>{title.slice(0, -1)} {index + 1}</strong>
            <button className="rb-icon-btn danger" onClick={() => onRemove(index)}>
              <Trash2 size={15} />
            </button>
          </div>
          <div className="rb-form-grid">
            {fields.map((field) => (
              <TextField
                key={field.key}
                label={field.label}
                value={item[field.key] || ""}
                onChange={(value) => onChange(index, { [field.key]: value })}
              />
            ))}
          </div>
        </div>
      ))}

      {!items.length && (
        <div className="rb-editor-empty compact">
          {icon}
          <p>No {title.toLowerCase()} were found in this resume.</p>
        </div>
      )}
    </div>
  </div>
);

const EducationEditor = ({ items, onChange, onAdd, onRemove }) => (
  <div className="rb-editor-section">
    <SectionHeading
      title="Education"
      subtitle="Add education that is relevant to your target role."
      action={
        <button className="rb-secondary-btn" onClick={onAdd}>
          <Plus size={15} /> Add Education
        </button>
      }
    />

    <div className="rb-editor-stack">
      {items.map((item, index) => (
        <div className="rb-edit-card" key={`education-${index}`}>
          <div className="rb-edit-card-head">
            <strong>Education Entry {index + 1}</strong>
            <button className="rb-icon-btn danger" onClick={() => onRemove(index)}>
              <Trash2 size={15} />
            </button>
          </div>

          <div className="rb-form-grid">
            <TextField
              label="Degree"
              value={item.degree}
              onChange={(value) => onChange(index, { degree: value })}
            />
            <TextField
              label="Institution"
              value={item.institution}
              onChange={(value) => onChange(index, { institution: value })}
            />
            <TextField
              label="Location"
              value={item.location}
              onChange={(value) => onChange(index, { location: value })}
            />
            <TextField
              label="Start Date"
              value={item.startDate}
              onChange={(value) => onChange(index, { startDate: value })}
            />
            <TextField
              label="End Date"
              value={item.endDate}
              onChange={(value) => onChange(index, { endDate: value })}
            />
          </div>

          <div className="rb-format-row">
            <span>Preview & PDF formatting</span>
            <FormatToggle
              label="Degree"
              active={item.degreeBold !== false}
              onClick={() => onChange(index, { degreeBold: item.degreeBold === false })}
            />
            <FormatToggle
              label="College / Institution"
              active={item.institutionBold !== false}
              onClick={() => onChange(index, { institutionBold: item.institutionBold === false })}
            />
          </div>

          <label className="rb-field">
            <span>Details</span>
            <input
              value={item.details}
              onChange={(event) => onChange(index, { details: event.target.value })}
              placeholder="CGPA, honors, relevant coursework, etc."
            />
          </label>
        </div>
      ))}
    </div>
  </div>
);

const ResumeOutlineEditor = ({
  layout,
  onMoveMain,
  onDuplicateMain,
  onAddCustom,
  onUpdateSection,
  onRemoveMain,
  onRestoreSystem,
  onResetSectionTitle,
  onAddCustomBullet,
  onUpdateCustomBullet,
  onRemoveCustomBullet,
  onAddSubSection,
  onMoveSubSection,
  onUpdateSubSection,
  onDuplicateSubSection,
  onRemoveSubSection,
  onAddSubSectionBullet,
  onUpdateSubSectionBullet,
  onRemoveSubSectionBullet,
}) => {
  const allSections = Array.isArray(layout) ? layout : [];
  const hiddenSystemSections = allSections.filter(
    (section) => section.type === "system" && section.hidden
  );

  return (
    <div className="rb-editor-section">
      <SectionHeading
        title="Resume Layout & Custom Sections"
        subtitle="Rename, reorder, copy, hide or restore any main section. Add nested subsections and manage their bullets independently."
        action={
          <button className="rb-secondary-btn" onClick={onAddCustom}>
            <Plus size={15} /> Add Custom Section
          </button>
        }
      />

      <div className="rb-outline-list">
        {allSections.map((section, sectionIndex) => {
          if (section.hidden) return null;

          return (
            <div className="rb-outline-card" key={section.id || `${section.type}-${section.key}-${sectionIndex}`}>
              <div className="rb-outline-head">
                <div className="rb-outline-title-wrap">
                  <span className={`rb-outline-type ${section.type === "system" ? "system" : "custom"}`}>
                    {section.type === "system" ? "System" : "Custom"}
                  </span>
                  <input
                    className="rb-card-title-input"
                    value={section.title || ""}
                    onChange={(event) => onUpdateSection(sectionIndex, { title: event.target.value })}
                    aria-label="Section title"
                  />
                </div>

                <div className="rb-outline-actions">
                  <button className="rb-icon-btn" title="Move section up" disabled={sectionIndex === 0} onClick={() => onMoveMain(sectionIndex, -1)}><ArrowUp size={14} /></button>
                  <button className="rb-icon-btn" title="Move section down" disabled={sectionIndex === allSections.length - 1} onClick={() => onMoveMain(sectionIndex, 1)}><ArrowDown size={14} /></button>
                  <button className="rb-icon-btn" title="Copy section" onClick={() => onDuplicateMain(sectionIndex)}><Copy size={14} /></button>
                  {section.type === "system" && (
                    <button className="rb-icon-btn" title="Restore default section name" onClick={() => onResetSectionTitle(sectionIndex)}><RefreshCw size={14} /></button>
                  )}
                  <button
                    className="rb-icon-btn danger"
                    title={section.type === "system" ? "Hide section" : "Delete section"}
                    onClick={() => onRemoveMain(sectionIndex)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {section.type === "system" ? (
                <p className="rb-outline-note">Renaming changes the displayed title only. Hiding removes this section from the preview, visual PDF, resume text, and AI refinement payload while keeping its data available to restore.</p>
              ) : (
                <div className="rb-outline-bullets">
                  {(section.bullets || []).map((bullet, bulletIndex) => (
                    <div className="rb-outline-bullet-row" key={`${section.id}-${bulletIndex}`}>
                      <span>•</span>
                      <input value={bullet} onChange={(event) => onUpdateCustomBullet(sectionIndex, bulletIndex, event.target.value)} />
                      <button className="rb-icon-btn danger" title="Remove bullet" onClick={() => onRemoveCustomBullet(sectionIndex, bulletIndex)}><Trash2 size={13} /></button>
                    </div>
                  ))}
                  <button className="rb-add-line-btn" onClick={() => onAddCustomBullet(sectionIndex)}><Plus size={14} /> Add Bullet</button>
                </div>
              )}

              <div className="rb-subsection-toolbar">
                <strong>Subsections</strong>
                <button className="rb-secondary-btn small" onClick={() => onAddSubSection(sectionIndex)}><Plus size={14} /> Add Subsection</button>
              </div>

              {(section.subSections || []).map((subSection, subIndex) => (
                <div className="rb-subsection-card" key={subSection.id || `${sectionIndex}-${subIndex}`}>
                  <div className="rb-subsection-head">
                    <input
                      className="rb-card-title-input"
                      value={subSection.title || ""}
                      onChange={(event) => onUpdateSubSection(sectionIndex, subIndex, { title: event.target.value })}
                      aria-label="Subsection title"
                    />
                    <div className="rb-outline-actions">
                      <button className="rb-icon-btn" title="Move subsection up" disabled={subIndex === 0} onClick={() => onMoveSubSection(sectionIndex, subIndex, -1)}><ArrowUp size={14} /></button>
                      <button className="rb-icon-btn" title="Move subsection down" disabled={subIndex === section.subSections.length - 1} onClick={() => onMoveSubSection(sectionIndex, subIndex, 1)}><ArrowDown size={14} /></button>
                      <button className="rb-icon-btn" title="Copy subsection" onClick={() => onDuplicateSubSection(sectionIndex, subIndex)}><Copy size={14} /></button>
                      <button className="rb-icon-btn danger" title="Delete subsection" onClick={() => onRemoveSubSection(sectionIndex, subIndex)}><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div className="rb-outline-bullets">
                    {(subSection.bullets || []).map((bullet, bulletIndex) => (
                      <div className="rb-outline-bullet-row" key={`${subSection.id}-${bulletIndex}`}>
                        <span>•</span>
                        <input value={bullet} onChange={(event) => onUpdateSubSectionBullet(sectionIndex, subIndex, bulletIndex, event.target.value)} />
                        <button className="rb-icon-btn danger" title="Remove bullet" onClick={() => onRemoveSubSectionBullet(sectionIndex, subIndex, bulletIndex)}><Trash2 size={13} /></button>
                      </div>
                    ))}
                    <button className="rb-add-line-btn" onClick={() => onAddSubSectionBullet(sectionIndex, subIndex)}><Plus size={14} /> Add Bullet</button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {hiddenSystemSections.length > 0 && (
        <div className="rb-hidden-sections">
          <div>
            <strong>Hidden system sections</strong>
            <p>Restore a hidden section at any time. Its original resume data is still safe.</p>
          </div>
          <div className="rb-hidden-section-list">
            {hiddenSystemSections.map((section) => (
              <button key={section.id} className="rb-restore-section-btn" onClick={() => onRestoreSystem(section.key)}>
                <RefreshCw size={14} /> Restore {section.title || "Section"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ResumePreview = ({
  resume,
  template,
  fontFamily,
  emptyMessage,
}) => {
  if (!resume) {
    return (
      <div className="rb-preview-empty">
        <FileText size={44} />
        <h3>Professional resume preview</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const basics = resume.basics || {};
  const isSidebar = template.mode === "sidebar";
  const isOxford = template.mode === "oxford";
  const isBlueHeader = template.mode === "blue-header";

  // Keyword matching remains available in the analysis card, but the resume itself
  // stays clean and print-ready without colored keyword backgrounds.
  const renderRichText = (value) =>
    String(value || "")
      .split(/(\*\*[^*]+\*\*)/g)
      .map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      );

  const ContactLine = () => (
    <div className="resume-contact">
      {basics.email && (
        <span>
          <Mail size={11} /> {basics.email}
        </span>
      )}
      {basics.phone && (
        <span>
          <Phone size={11} /> {basics.phone}
        </span>
      )}
      {basics.location && (
        <span>
          <MapPin size={11} /> {basics.location}
        </span>
      )}
      {basics.linkedin && <span>{basics.linkedin}</span>}
    </div>
  );

  const layout = normalizeSectionLayout(resume.sectionLayout);

  const renderSubSections = (section) => {
    const subSections = section?.subSections || [];
    if (!subSections.length) return null;

    return subSections.map((subSection, index) => {
      const hasContent = text(subSection.title) || (subSection.bullets || []).length;
      if (!hasContent) return null;
      return (
        <div className="resume-subsection" key={subSection.id || `${section.id}-sub-${index}`}>
          {subSection.title && <h4>{renderRichText(subSection.title)}</h4>}
          {(subSection.bullets || []).length > 0 && (
            <ul className="resume-bullet-list">
              {subSection.bullets.map((bullet, bulletIndex) => (
                <li key={`${subSection.id || index}-${bulletIndex}`}>{renderRichText(bullet)}</li>
              ))}
            </ul>
          )}
        </div>
      );
    });
  };

  const SkillsContent = () => {
    const usableGroups = (resume.skillGroups || []).filter(
      (group) => Array.isArray(group.items) && group.items.length
    );
    if (!usableGroups.length) return null;

    return (
      <div className="resume-skill-groups resume-inline-skill-groups">
        <ul className="resume-key-skills-list">
          {usableGroups.map((group, index) => (
            <li key={`${group.category}-${index}`}>
              <p className="resume-skill-line">
                <strong className="resume-skill-category">{renderRichText(group.category || "Relevant Skills")}:</strong>{" "}
                <span className="resume-skill-values">
                  {group.items.map((skill, skillIndex) => (
                    <span key={`${skill}-${skillIndex}`}>
                      {renderRichText(skill)}{skillIndex < group.items.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const SystemSectionContent = ({ section }) => {
    const key = section.key;

    if (key === "summary") {
      return resume.professionalSummary ? <p className="resume-summary">{renderRichText(resume.professionalSummary)}</p> : null;
    }
    if (key === "skills") return <SkillsContent />;
    if (key === "experience") {
      return resume.experience?.length ? resume.experience.map((item, index) => (
        <div className="resume-entry" key={`experience-${index}`}>
          <div className="resume-entry-top">
            <div>
              {item.jobTitle && <h4 className={item.jobTitleBold === false ? "resume-normal-weight" : ""}>{renderRichText(item.jobTitle)}</h4>}
              {(item.company || item.location) && (
                <p className={`resume-company ${item.companyBold === false ? "" : "resume-company-bold"}`}>
                  {item.company && (item.companyBold === false ? renderRichText(item.company) : <strong>{renderRichText(item.company)}</strong>)}
                  {item.company && item.location ? " · " : ""}
                  {item.location && renderRichText(item.location)}
                </p>
              )}
            </div>
            {[item.startDate, item.endDate].filter(Boolean).length > 0 && <span>{[item.startDate, item.endDate].filter(Boolean).join(" – ")}</span>}
          </div>
          {item.bullets?.length > 0 && <ul className="resume-bullet-list">{item.bullets.map((bullet, bulletIndex) => <li key={`${bullet}-${bulletIndex}`}>{renderRichText(bullet)}</li>)}</ul>}
        </div>
      )) : null;
    }
    if (key === "projects") {
      return resume.projects?.length ? resume.projects.map((item, index) => (
        <div className="resume-entry" key={`project-${index}`}>
          <div className="resume-entry-top">
            {item.name && <h4 className={item.nameBold === false ? "resume-normal-weight" : ""}>{renderRichText(item.name)}</h4>}
            {[item.startDate, item.endDate].filter(Boolean).length > 0 && <span>{[item.startDate, item.endDate].filter(Boolean).join(" – ")}</span>}
          </div>
          {item.bullets?.length > 0 && <ul className="resume-bullet-list">{item.bullets.map((bullet, bulletIndex) => <li key={`${bullet}-${bulletIndex}`}>{renderRichText(bullet)}</li>)}</ul>}
        </div>
      )) : null;
    }
    if (key === "certifications") {
      return resume.certifications?.length ? resume.certifications.map((item, index) => (
        <div className="resume-compact-entry" key={`certification-${index}`}>
          <strong>{renderRichText(item.title)}</strong>
          {[item.issuer, item.year].filter(Boolean).length > 0 && <span>{[item.issuer, item.year].filter(Boolean).join(" · ")}</span>}
          {item.details && <p>{renderRichText(item.details)}</p>}
        </div>
      )) : null;
    }
    if (key === "achievements") {
      return resume.achievements?.length ? <ul className="resume-bullet-list resume-achievement-list">{resume.achievements.map((item, index) => (
        <li key={`achievement-${index}`}><strong>{renderRichText(item.title)}</strong>{item.details ? <> — {renderRichText(item.details)}</> : null}</li>
      ))}</ul> : null;
    }
    if (key === "education") {
      return resume.education?.length ? resume.education.map((item, index) => (
        <div className="resume-education" key={`education-${index}`}>
          <div>
            {item.degree && <h4 className={item.degreeBold === false ? "resume-normal-weight" : ""}>{renderRichText(item.degree)}</h4>}
            {(item.institution || item.location) && (
              <p className={`resume-education-school ${item.institutionBold === false ? "" : "resume-institution-bold"}`}>
                {item.institution && (item.institutionBold === false ? renderRichText(item.institution) : <strong>{renderRichText(item.institution)}</strong>)}
                {item.institution && item.location ? " · " : ""}
                {item.location && renderRichText(item.location)}
              </p>
            )}
            {item.details && <small>{renderRichText(item.details)}</small>}
          </div>
          {[item.startDate, item.endDate].filter(Boolean).length > 0 && <span>{[item.startDate, item.endDate].filter(Boolean).join(" – ")}</span>}
        </div>
      )) : null;
    }
    return null;
  };

  const OrderedContent = () => (
    <>
      {layout.map((section, index) => {
        if (section.hidden) return null;

        const systemContent = section.type === "system" ? <SystemSectionContent section={section} /> : null;
        const customBullets = section.type === "custom" ? stringArray(section.bullets) : [];
        const children = renderSubSections(section);
        const hasContent = Boolean(systemContent) || customBullets.length || Boolean(children?.some(Boolean));
        if (!hasContent) return null;

        return (
          <ResumeSection title={section.title || "Custom Section"} key={section.id || `${section.type}-${index}`}>
            {systemContent}
            {section.type === "custom" && customBullets.length > 0 && (
              <ul className="resume-bullet-list">
                {customBullets.map((bullet, bulletIndex) => <li key={`${section.id}-${bulletIndex}`}>{renderRichText(bullet)}</li>)}
              </ul>
            )}
            {children}
          </ResumeSection>
        );
      })}
    </>
  );

  return (
    <article
      id="resume-print-area"
      className={`resume-paper ${isSidebar ? "resume-sidebar-layout" : ""} ${isOxford ? "resume-oxford-layout" : ""} ${isBlueHeader ? "resume-blue-header-layout" : ""}`}
      style={{
        "--resume-accent": template.accent,
        "--resume-font": fontFamily || FONT_OPTIONS[0].value,
      }}
    >
      {isSidebar ? (
        <>
          <aside className="resume-side-column">
            {basics.fullName && <div className="resume-side-name">{basics.fullName}</div>}
            {basics.headline && <div className="resume-side-role">{basics.headline}</div>}
            <ContactLine />
          </aside>
          <div className="resume-main-column">
            <OrderedContent />
          </div>
        </>
      ) : isBlueHeader ? (
        <>
          <header className="resume-blue-header">
            <div className="resume-blue-contact-panel">
              <ContactLine />
            </div>
            <div className="resume-blue-identity">
              {basics.fullName && <h2>{basics.fullName}</h2>}
              {basics.headline && <h3>{basics.headline}</h3>}
            </div>
          </header>
          <OrderedContent />
        </>
      ) : isOxford ? (
        <>
          <header className="resume-oxford-header">
            {basics.fullName && <h2>{basics.fullName}</h2>}
            {basics.headline && <h3>{basics.headline}</h3>}
            <div className="resume-oxford-contact">
              {[basics.email, basics.phone, basics.location, basics.linkedin]
                .filter(Boolean)
                .join(" | ")}
            </div>
          </header>
          <OrderedContent />
        </>
      ) : (
        <>
          <header className="resume-header">
            {basics.fullName && <h2>{basics.fullName}</h2>}
            {basics.headline && <h3>{basics.headline}</h3>}
            <ContactLine />
          </header>
          <OrderedContent />
        </>
      )}
    </article>
  );
};

const ResumeSection = ({ title, children }) => (
  <section className="resume-section">
    <h3>{title}</h3>
    {children}
  </section>
);

const styles = `
  * { box-sizing: border-box; }
  .rb-app {
    width: 100%;
    max-width: 1760px;
    margin: 0 auto;
    padding: 8px 6px 46px;
    color: #e5e7eb;
  }
  .rb-topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 28px;
    margin-bottom: 22px;
    padding: 6px 2px 0;
  }
  .rb-eyebrow, .rb-mini-label {
    margin: 0;
    color: #a78bfa;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .rb-topbar h1 {
    margin: 8px 0 0;
    color: #ffffff;
    font-size: clamp(28px, 3vw, 43px);
    line-height: 1.08;
    letter-spacing: -1.35px;
  }
  .rb-subtitle {
    max-width: 720px;
    margin: 11px 0 0;
    color: #a8b5c9;
    font-size: 14px;
    line-height: 1.6;
  }
  .rb-top-actions, .rb-preview-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 9px;
  }
  .rb-top-actions { justify-content: flex-end; padding-top: 5px; }
  .rb-primary-btn, .rb-secondary-btn, .rb-generate-btn, .rb-clear-btn,
  .rb-preview-action-btn, .rb-preview-download-btn {
    border: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 40px;
    border-radius: 12px;
    padding: 0 14px;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    transition: transform .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease;
  }
  .rb-primary-btn, .rb-generate-btn, .rb-preview-download-btn {
    color: #ffffff;
    background: linear-gradient(135deg, #8b5cf6, #4f46e5);
    box-shadow: 0 12px 26px rgba(79, 70, 229, .26);
  }
  .rb-primary-btn:hover, .rb-generate-btn:hover, .rb-preview-download-btn:hover {
    transform: translateY(-1px);
    filter: brightness(1.06);
  }
  .rb-primary-btn:disabled, .rb-secondary-btn:disabled, .rb-generate-btn:disabled,
  .rb-preview-action-btn:disabled, .rb-preview-download-btn:disabled {
    opacity: .52;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .rb-secondary-btn, .rb-preview-action-btn {
    color: #e3dcff;
    background: rgba(30,41,59,.8);
    border: 1px solid rgba(167,139,250,.22);
  }
  .rb-secondary-btn:hover, .rb-preview-action-btn:hover {
    background: rgba(55,65,81,.88);
    border-color: rgba(196,181,253,.48);
  }
  .rb-setup-panel, .rb-template-section, .rb-match-panel, .rb-editor-panel {
    background: linear-gradient(145deg, rgba(18,27,50,.88), rgba(11,17,32,.82));
    border: 1px solid rgba(148,163,184,.15);
    box-shadow: 0 18px 42px rgba(2,6,23,.2);
  }
  .rb-setup-panel {
    display: grid;
    grid-template-columns: minmax(230px,.72fr) minmax(350px,1.75fr) minmax(188px,.48fr);
    gap: 14px;
    align-items: end;
    padding: 17px;
    border-radius: 22px;
    margin-bottom: 18px;
  }
  .rb-setup-field { min-width: 0; }
  .rb-setup-field label, .rb-field > span, .rb-bullet-section > span {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 7px;
    color: #cbd5e1;
    font-size: 12px;
    font-weight: 800;
  }
  .rb-select-wrap { position: relative; }
  .rb-select-wrap select, .rb-setup-field textarea, .rb-field input, .rb-skill-row input,
  .rb-card-title-input, .rb-textarea, .rb-bullet-edit-row textarea {
    width: 100%;
    outline: none;
    color: #f8fafc;
    background: rgba(30,41,59,.92);
    border: 1px solid rgba(148,163,184,.22);
    border-radius: 11px;
    font: inherit;
  }
  .rb-select-wrap select { appearance: none; height: 46px; padding: 0 38px 0 13px; }
  .rb-select-wrap svg { position: absolute; right: 12px; top: 15px; color: #94a3b8; pointer-events: none; }
  .rb-setup-field textarea { height: 66px; resize: vertical; padding: 10px 12px; font-size: 13px; line-height: 1.45; }
  .rb-generate-btn { min-height: 46px; border-radius: 12px; padding: 0 16px; }
  .rb-template-section, .rb-match-panel { border-radius: 22px; padding: 18px; margin-bottom: 18px; }
  .rb-section-label-row, .rb-match-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }
  .rb-section-label-row { align-items: center; margin-bottom: 15px; }
  .rb-section-label-row h2, .rb-preview-actions-panel h2, .rb-match-heading h2 {
    margin: 5px 0 0;
    color: #ffffff;
    font-size: 20px;
    line-height: 1.2;
  }
  .rb-template-selected {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #e7e0ff;
    background: rgba(139,92,246,.14);
    border: 1px solid rgba(167,139,250,.25);
    padding: 8px 11px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
  }
  .rb-template-grid { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 11px; }
  .rb-template-card {
    position: relative;
    width: 100%;
    min-height: 82px;
    border: 1px solid rgba(148,163,184,.15);
    background: rgba(30,41,59,.52);
    border-radius: 15px;
    padding: 12px;
    color: #e5e7eb;
    display: flex;
    align-items: center;
    gap: 11px;
    text-align: left;
    cursor: pointer;
    transition: .18s ease;
  }
  .rb-template-card:hover { transform: translateY(-2px); border-color: rgba(167,139,250,.48); background: rgba(55,65,81,.78); }
  .rb-template-card.active { border-color: rgba(167,139,250,.86); background: linear-gradient(135deg, rgba(109,40,217,.27), rgba(30,41,59,.7)); box-shadow: inset 0 0 0 1px rgba(196,181,253,.16); }
  .rb-template-card > svg { color: #c4b5fd; margin-left: auto; flex: 0 0 auto; }
  .rb-template-preview { width: 38px; height: 48px; border-radius: 5px; background: #f8fafc; flex: 0 0 auto; padding: 7px 5px; display: grid; gap: 4px; box-shadow: 0 5px 10px rgba(0,0,0,.25); }
  .rb-template-preview i { display: block; height: 5px; width: 62%; border-radius: 3px; background: var(--template-accent); }
  .rb-template-preview b, .rb-template-preview em { display: block; height: 3px; width: 100%; border-radius: 3px; background: #cbd5e1; }
  .rb-template-preview em { width: 84%; }
  .rb-template-copy { min-width: 0; display: grid; gap: 4px; }
  .rb-template-copy strong { color: #f8fafc; font-size: 13px; }
  .rb-template-copy small { color: #94a3b8; font-size: 10.5px; line-height: 1.35; }
  .rb-match-heading p { margin: 7px 0 0; max-width: 760px; color: #9aa9bf; font-size: 12px; line-height: 1.6; }
  .rb-match-score { min-width: 78px; min-height: 78px; display: grid; place-content: center; text-align: center; border-radius: 50%; border: 5px solid rgba(34,197,94,.72); background: rgba(34,197,94,.1); color: #bbf7d0; }
  .rb-match-score strong { font-size: 19px; line-height: 1; }
  .rb-match-score span { margin-top: 4px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .07em; }
  .rb-match-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: stretch; margin-top: 16px; }
  .rb-keyword-column { min-width: 0; padding: 13px; border-radius: 14px; border: 1px solid rgba(148,163,184,.14); }
  .rb-keyword-column.matched { background: rgba(34,197,94,.08); border-color: rgba(34,197,94,.2); }
  .rb-keyword-column.missing { background: rgba(251,191,36,.08); border-color: rgba(251,191,36,.2); }
  .rb-keyword-title { display: flex; align-items: center; gap: 7px; color: #f8fafc; font-size: 12px; font-weight: 900; }
  .rb-keyword-column.matched .rb-keyword-title svg { color: #4ade80; }
  .rb-keyword-column.missing .rb-keyword-title svg { color: #fbbf24; }
  .rb-keyword-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
  .rb-keyword-chips span { border-radius: 999px; padding: 5px 8px; font-size: 11px; font-weight: 800; }
  .matched .rb-keyword-chips span { color: #bbf7d0; background: rgba(34,197,94,.13); }
  .missing .rb-keyword-chips span { color: #fde68a; background: rgba(251,191,36,.13); }
  .rb-keyword-chips small, .rb-match-empty { color: #9aa9bf; font-size: 11px; line-height: 1.45; }
  .rb-match-empty { margin-top: 13px; }
  .rb-workspace { display: grid; grid-template-columns: minmax(400px,.86fr) minmax(560px,1.14fr); gap: 22px; align-items: start; }
  .rb-editor-panel { border-radius: 22px; padding: 16px; overflow: hidden; }
  .rb-tabs { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: thin; padding: 0 2px 10px; border-bottom: 1px solid rgba(148,163,184,.13); }
  .rb-tabs button { white-space: nowrap; border: 0; cursor: pointer; color: #94a3b8; background: transparent; padding: 9px 11px; border-radius: 10px; font: inherit; font-size: 13px; font-weight: 800; transition: .16s ease; }
  .rb-tabs button:hover { color: #e9e5ff; background: rgba(139,92,246,.1); }
  .rb-tabs button.active { color: #ffffff; background: rgba(139,92,246,.24); box-shadow: inset 0 0 0 1px rgba(196,181,253,.14); }
  .rb-editor-content { min-height: 470px; padding: 20px 4px 7px; }
  .rb-editor-heading { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 18px; }
  .rb-editor-heading h3 { color: #ffffff; margin: 0; font-size: 20px; }
  .rb-editor-heading p { color: #9aa9bf; margin: 6px 0 0; font-size: 12px; line-height: 1.5; }
  .rb-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
  .rb-field input { min-height: 42px; padding: 0 11px; font-size: 13px; }
  .rb-field input:focus, .rb-textarea:focus, .rb-rich-textarea:focus, .rb-skill-row input:focus,
  .rb-card-title-input:focus, .rb-bullet-edit-row textarea:focus, .rb-setup-field textarea:focus,
  .rb-select-wrap select:focus { border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(139,92,246,.13); }
  .rb-textarea { min-height: 100px; padding: 11px; resize: vertical; font-size: 13px; line-height: 1.55; }
  .rb-rich-text-editor { overflow: hidden; border: 1px solid rgba(148,163,184,.22); border-radius: 11px; background: rgba(30,41,59,.92); }
  .rb-rich-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 10px; min-height: 36px; padding: 6px 8px; border-bottom: 1px solid rgba(148,163,184,.16); background: rgba(15,23,42,.34); }
  .rb-rich-toolbar button { display: inline-flex; align-items: center; gap: 5px; border: 1px solid rgba(167,139,250,.28); border-radius: 8px; padding: 5px 8px; background: rgba(124,58,237,.18); color: #ede9fe; cursor: pointer; font: inherit; font-size: 11px; font-weight: 900; }
  .rb-rich-toolbar span { color: #94a3b8; font-size: 10px; }
  .rb-rich-textarea { display: block; width: 100%; min-height: 118px; padding: 11px; border: 0; outline: none; resize: vertical; background: transparent; color: #f8fafc; font: inherit; font-size: 13px; line-height: 1.55; }
  .rb-summary-editor .rb-rich-textarea { min-height: 220px; }
  .rb-rich-text-editor.compact .rb-rich-toolbar { min-height: 31px; padding: 4px 6px; }
  .rb-rich-text-editor.compact .rb-rich-toolbar button { padding: 4px 7px; font-size: 10px; }
  .rb-rich-text-editor.compact .rb-rich-toolbar span { font-size: 9px; }
  .rb-rich-text-editor.compact .rb-rich-textarea { min-height: 52px; padding: 8px 9px; font-size: 12px; line-height: 1.45; }
  .rb-editor-stack { display: grid; gap: 13px; }
  .rb-edit-card { padding: 14px; border-radius: 16px; background: rgba(30,41,59,.52); border: 1px solid rgba(148,163,184,.13); }
  .rb-edit-card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 13px; color: #ffffff; font-size: 13px; }
  .rb-card-title-input { min-height: 38px; padding: 0 10px; color: #ffffff; font-weight: 850; }
  .rb-icon-btn { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; border: 0; cursor: pointer; color: #cbd5e1; background: rgba(71,85,105,.45); }
  .rb-icon-btn.danger:hover { color: #fecaca; background: rgba(239,68,68,.16); }
  .rb-skill-editor { display: grid; gap: 8px; }
  .rb-skill-row { display: grid; grid-template-columns: 1fr 30px; gap: 8px; }
  .rb-skill-row input { min-height: 37px; padding: 0 10px; font-size: 13px; }
  .rb-add-line-btn { margin-top: 11px; border: 0; background: transparent; color: #c4b5fd; cursor: pointer; display: inline-flex; gap: 6px; align-items: center; font: inherit; font-size: 12px; font-weight: 800; }
  .rb-bullet-section { margin-top: 14px; }
  .rb-bullet-edit-row { display: grid; grid-template-columns: 12px minmax(0,1fr) 30px; gap: 8px; align-items: start; margin: 8px 0; color: #c4b5fd; padding-left: 3px; }
  .rb-bullet-edit-row textarea { min-height: 52px; padding: 8px 9px; resize: vertical; font-size: 12px; line-height: 1.45; }
  .rb-bullet-edit-row .rb-rich-text-editor { min-width: 0; }
  .rb-editor-empty { min-height: 375px; display: grid; place-content: center; text-align: center; padding: 30px; border: 1px dashed rgba(167,139,250,.32); border-radius: 18px; color: #a78bfa; }
  .rb-editor-empty h3 { color: #ffffff; margin: 12px 0 6px; }
  .rb-editor-empty p { color: #9aa9bf; margin: 0; max-width: 330px; line-height: 1.6; font-size: 13px; }
  .rb-editor-empty.compact { min-height: 150px; }
  .rb-ai-panel { border-radius: 18px; padding: 15px; border: 1px solid rgba(139,92,246,.27); background: linear-gradient(135deg, rgba(109,40,217,.16), rgba(30,41,59,.48)); margin-top: 12px; }
  .rb-ai-heading { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px; }
  .rb-ai-icon { width: 31px; height: 31px; border-radius: 10px; display: grid; place-items: center; background: #7c3aed; color: #ffffff; }
  .rb-ai-heading strong { color: #ffffff; font-size: 13px; }
  .rb-ai-heading p { margin: 3px 0 0; color: #cbd5e1; font-size: 11px; }
  .rb-action-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 11px; }
  .rb-action-chips button { border: 1px solid rgba(196,181,253,.26); background: rgba(15,23,42,.38); color: #ddd6fe; border-radius: 999px; padding: 7px 9px; display: inline-flex; gap: 5px; align-items: center; font: inherit; font-size: 11px; cursor: pointer; }
  .rb-action-chips button:hover { background: rgba(124,58,237,.22); }
  .rb-refine-btn { width: 100%; margin-top: 10px; }
  .rb-history-panel { margin-top: 16px; padding: 13px; border-radius: 16px; border: 1px solid rgba(148,163,184,.13); background: rgba(30,41,59,.35); }
  .rb-history-title { display: flex; gap: 8px; color: #ffffff; align-items: center; font-size: 13px; }
  .rb-history-title svg { color: #a78bfa; }
  .rb-history-list { display: grid; gap: 7px; margin-top: 10px; }
  .rb-history-list button { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 10px; color: #cbd5e1; background: rgba(15,23,42,.48); border: 1px solid rgba(148,163,184,.11); border-radius: 11px; padding: 9px; text-align: left; cursor: pointer; }
  .rb-history-list button:hover { border-color: rgba(167,139,250,.45); }
  .rb-history-list span { min-width: 0; display: grid; gap: 3px; }
  .rb-history-list strong { color: #f8fafc; font-size: 12px; }
  .rb-history-list small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #94a3b8; font-size: 10px; }
  .rb-muted { color: #94a3b8; font-size: 12px; margin: 10px 0 0; }
  .rb-clear-btn { margin-top: 13px; min-height: 30px; padding: 0; background: transparent; color: #94a3b8; font-size: 11px; }
  .rb-clear-btn:hover { color: #fecaca; }
  .rb-preview-panel { min-width: 0; }
  .rb-preview-actions-panel {
    position: relative !important;
    inset: auto !important;
    z-index: 0 !important;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
    padding: 12px 14px;
    border: 1px solid rgba(148,163,184,.14);
    border-radius: 18px;
    background: linear-gradient(145deg, rgba(18,27,50,.85), rgba(11,17,32,.8));
  }
  .rb-preview-title-group p:not(.rb-mini-label) { margin: 5px 0 0; color: #94a3b8; font-size: 11px; }
  .rb-preview-controls { justify-content: flex-end; }
  .rb-font-picker { min-height: 40px; display: inline-flex; align-items: center; gap: 7px; padding: 0 10px; color: #ddd6fe; background: rgba(30,41,59,.8); border: 1px solid rgba(167,139,250,.24); border-radius: 12px; }
  .rb-font-picker span { color: #cbd5e1; font-size: 12px; font-weight: 800; }
  .rb-font-picker select { appearance: none; max-width: 156px; border: 0; outline: none; background: transparent; color: #f8fafc; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
  .rb-font-picker option { color: #0f172a; background: #ffffff; }
  .rb-preview-action-btn { min-height: 40px; color: #d8d5ff; background: rgba(30,41,59,.8); border: 1px solid rgba(167,139,250,.22); }
  .rb-preview-download-btn { min-height: 40px; }
  .rb-preview-status { display: inline-flex; align-items: center; gap: 7px; padding: 0 2px; color: #86efac; font-size: 11px; font-weight: 800; white-space: nowrap; }
  .rb-preview-status span { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.13); }
  .rb-preview-stage {
    position: relative;
    z-index: 1;
    clear: both;
    min-height: 720px;
    padding: clamp(12px, 2vw, 26px);
    border: 1px solid rgba(148,163,184,.13);
    border-radius: 22px;
    background: radial-gradient(circle at 50% 0%, rgba(139,92,246,.08), transparent 42%), rgba(5,10,22,.56);
    overflow: auto;
  }
  .rb-preview-empty { min-height: 650px; border-radius: 16px; border: 1px dashed rgba(167,139,250,.32); display: grid; place-content: center; text-align: center; padding: 35px; background: rgba(15,23,42,.6); color: #a78bfa; }
  .rb-preview-empty h3 { color: #ffffff; margin: 12px 0 7px; }
  .rb-preview-empty p { color: #94a3b8; max-width: 320px; margin: 0; line-height: 1.6; font-size: 13px; }
  .resume-paper { width: min(100%, 794px); min-height: 1123px; margin: 0 auto; padding: 48px 54px; background: #ffffff; color: #172033; box-shadow: 0 24px 62px rgba(0,0,0,.32); font-family: var(--resume-font), Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.48; }
  .resume-header { border-bottom: 3px solid var(--resume-accent); padding-bottom: 14px; margin-bottom: 18px; }
  .resume-header h2 { margin: 0; color: #0f172a; font-size: 29px; line-height: 1.1; letter-spacing: -.6px; }
  .resume-header h3 { margin: 5px 0 8px; color: var(--resume-accent); font-size: 14px; }
  .resume-contact { display: flex; flex-wrap: wrap; gap: 6px 13px; color: #475569; font-size: 10px; }
  .resume-contact span { display: inline-flex; align-items: center; gap: 4px; }
  .resume-section { margin-top: 18px; }
  .resume-section > h3 { margin: 0 0 8px; padding-bottom: 4px; color: var(--resume-accent); border-bottom: 1px solid #cbd5e1; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
  .resume-summary { margin: 0; color: #334155; white-space: normal; }
  /* Key Skills: compact category + inline values with a clear bullet for each skill group. */
  .resume-inline-skill-groups { display: block; }
  .resume-key-skills-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .resume-key-skills-list li { position: relative; margin: 0; padding-left: 14px; break-inside: avoid; page-break-inside: avoid; }
  .resume-key-skills-list li::before { content: "•"; position: absolute; left: 0; top: 0; color: #111827; font-weight: 800; }
  .resume-skill-line { margin: 0; color: #334155; font-size: 10.5px; line-height: 1.55; }
  .resume-skill-category { color: #0f172a; font-weight: 800; }
  .resume-skill-values { color: #475569; }
  .resume-entry { margin: 11px 0 14px; }
  .resume-entry-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .resume-entry h4, .resume-education h4 { color: #0f172a; margin: 0; font-size: 12px; }
  .resume-entry-top > span, .resume-education > span { color: #475569; font-size: 10px; white-space: nowrap; }
  .resume-company, .resume-education p { margin: 2px 0 0; color: #475569; }
  .resume-bullet-list { list-style: none; margin: 6px 0 0; padding: 0; color: #334155; }
  .resume-bullet-list li { position: relative; margin: 3px 0; padding-left: 13px; break-inside: avoid; page-break-inside: avoid; }
  .resume-bullet-list li::before { content: "•"; position: absolute; left: 0; top: 0; color: #111827; font-weight: 800; }
  .resume-achievement-list { margin-top: 7px; }
  .resume-achievement-list li { margin: 4px 0; }
  .resume-education { display: flex; justify-content: space-between; gap: 12px; margin: 10px 0; }
  .resume-education small { display: block; margin-top: 2px; color: #64748b; }
  .resume-compact-entry { margin: 8px 0; color: #334155; break-inside: avoid; }
  .resume-compact-entry strong { color: #0f172a; font-size: 11px; }
  .resume-compact-entry span { color: #475569; font-size: 10px; margin-left: 5px; }
  .resume-compact-entry p { margin: 2px 0 0; color: #475569; }
  .rb-inline-icon { color: #c4b5fd; display: inline-flex; margin-right: 6px; vertical-align: middle; }
  .rb-format-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 14px 0 3px; }
  .rb-format-row > span { color: #94a3b8; font-size: 11px; font-weight: 800; margin-right: 2px; }
  .rb-format-toggle { display: inline-flex; align-items: center; gap: 5px; min-height: 30px; border: 1px solid rgba(148,163,184,.22); border-radius: 8px; padding: 0 9px; background: rgba(15,23,42,.42); color: #94a3b8; font: inherit; font-size: 11px; font-weight: 800; cursor: pointer; transition: .16s ease; }
  .rb-format-toggle.active { color: #f8fafc; background: rgba(124,58,237,.26); border-color: rgba(196,181,253,.56); }
  .rb-format-toggle:hover { border-color: rgba(196,181,253,.72); color: #ffffff; }
  .resume-entry h4, .resume-education h4 { font-weight: 800; }
  .resume-normal-weight { font-weight: 400 !important; }
  .resume-company-bold, .resume-institution-bold { color: #334155; }
  .resume-company-bold strong, .resume-institution-bold strong { color: #0f172a; font-weight: 800; }
  .resume-blue-header-layout { padding-top: 0; }
  .resume-blue-header { display: flex; justify-content: space-between; align-items: center; gap: 28px; margin: 0 -54px 20px; padding: 30px 54px; background: #123f67; color: #ffffff; }
  .resume-blue-contact-panel { min-width: 0; }
  .resume-blue-header .resume-contact { display: grid; gap: 8px; color: rgba(255,255,255,.94); font-size: 10.5px; }
  .resume-blue-header .resume-contact span { overflow-wrap: anywhere; }
  .resume-blue-header .resume-contact svg { color: #ffffff; flex: 0 0 auto; }
  .resume-blue-identity { min-width: 0; text-align: right; }
  .resume-blue-header h2 { margin: 0; color: #ffffff; font-size: 30px; line-height: 1.1; letter-spacing: -.5px; }
  .resume-blue-header h3 { margin: 7px 0 0; color: rgba(255,255,255,.92); font-size: 14px; font-weight: 500; }
  .resume-blue-header-layout .resume-section > h3 { color: #123f67; border-bottom-color: #123f67; }
  .resume-blue-header-layout .resume-entry h4, .resume-blue-header-layout .resume-education h4, .resume-blue-header-layout .resume-skill-category { color: #123f67; }
  .resume-education, .resume-compact-entry { break-inside: avoid; page-break-inside: avoid; }
  .resume-section > h3, .resume-entry-top { break-after: avoid; page-break-after: avoid; }
  .resume-oxford-layout { padding: 46px 56px; color: #111827; }
  .resume-oxford-header { text-align: center; padding-bottom: 14px; margin-bottom: 17px; border-bottom: 2px solid #1f2937; }
  .resume-oxford-header h2 { margin: 0; font-family: var(--resume-font), Georgia, "Times New Roman", serif; color: #111827; font-size: 30px; letter-spacing: .01em; }
  .resume-oxford-header h3 { margin: 5px 0 7px; color: #1f3a5f; font-size: 13px; font-family: Arial, Helvetica, sans-serif; font-weight: 700; }
  .resume-oxford-contact { color: #374151; font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 1.5; }
  .resume-oxford-layout .resume-section > h3 { color: #111827; border-bottom: 1.4px solid #111827; font-family: Arial, Helvetica, sans-serif; font-size: 11px; letter-spacing: .1em; }
  .resume-oxford-layout .resume-entry h4, .resume-oxford-layout .resume-education h4, .resume-oxford-layout .resume-compact-entry strong, .resume-oxford-layout .resume-skill-category { color: #111827; }
  .resume-oxford-layout .resume-summary, .resume-oxford-layout .resume-entry, .resume-oxford-layout .resume-skill-line, .resume-oxford-layout .resume-compact-entry { font-size: 11px; }
  .resume-oxford-layout .resume-bullet-list li::before { color: #111827; }
  .resume-sidebar-layout { display: grid; grid-template-columns: 31% 69%; padding: 0; overflow: hidden; }
  .resume-side-column { padding: 48px 24px; background: var(--resume-accent); color: #ffffff; }
  .resume-side-name { font-size: 25px; line-height: 1.1; font-weight: 800; }
  .resume-side-role { margin: 7px 0 20px; color: rgba(255,255,255,.85); font-size: 12px; line-height: 1.45; }
  .resume-side-column .resume-contact { display: grid; gap: 7px; color: #ffffff; margin-bottom: 28px; }
  .resume-side-column .resume-section > h3 { color: #ffffff; border-color: rgba(255,255,255,.38); }
  .resume-side-column .resume-skill-line { color: rgba(255,255,255,.92); }
  .resume-side-column .resume-skill-category { color: #ffffff; }
  .resume-side-column .resume-skill-values { color: rgba(255,255,255,.88); }
  .resume-side-column .resume-key-skills-list li::before { color: #ffffff; }
  .resume-main-column { padding: 48px 38px; }
  .resume-sidebar-layout .resume-main-column .resume-section:first-child { margin-top: 0; }
  .spin { animation: rb-spin .8s linear infinite; }
  @keyframes rb-spin { to { transform: rotate(360deg); } }
  @media (max-width: 1450px) {
    .rb-template-grid { grid-template-columns: repeat(3, minmax(0,1fr)); }
  }
  @media (max-width: 1320px) {
    .rb-workspace { grid-template-columns: 1fr; }
    .rb-preview-panel { max-width: 920px; width: 100%; margin: 0 auto; }
  }
  @media (max-width: 1020px) {
    .rb-topbar { display: grid; }
    .rb-header-status { justify-items: start; grid-auto-flow: column; justify-content: start; }
    .rb-setup-panel { grid-template-columns: 1fr 1fr; }
    .rb-generate-btn { grid-column: 1 / -1; }
    .rb-preview-actions-panel { align-items: flex-start; flex-direction: column; position: static; }
    .rb-preview-controls { justify-content: flex-start; }
  }
  @media (max-width: 720px) {
    .rb-app { padding: 0 0 26px; }
    .rb-topbar { gap: 16px; margin-bottom: 18px; padding: 20px 18px; border-radius: 20px; }
    .rb-topbar h1 { font-size: clamp(27px, 8vw, 35px); }
    .rb-subtitle { font-size: 13px; }
    .rb-template-grid, .rb-setup-panel, .rb-match-grid, .rb-form-grid { grid-template-columns: 1fr; }
    .rb-generate-btn { grid-column: auto; }
    .rb-section-label-row, .rb-match-heading, .rb-editor-heading { align-items: flex-start; flex-direction: column; }
    .rb-template-selected { white-space: normal; }
    .rb-preview-actions-panel { padding: 12px; }
    .rb-preview-controls { width: 100%; }
    .rb-font-picker { flex: 1 1 100%; justify-content: space-between; }
    .rb-font-picker select { max-width: none; flex: 1; text-align: right; }
    .rb-preview-action-btn, .rb-preview-download-btn { flex: 1 1 calc(50% - 5px); }
    .rb-preview-status { flex: 1 1 100%; }
    .rb-preview-stage { min-height: 400px; padding: 8px; border-radius: 16px; }
    .resume-paper { min-height: auto; padding: 30px 24px; font-size: 10.5px; }
    .resume-header h2 { font-size: 25px; }
    .resume-blue-header { flex-direction: column-reverse; align-items: flex-start; margin: -30px -24px 18px; padding: 28px 24px; }
    .resume-blue-identity { text-align: left; }
    .resume-blue-header h2 { font-size: 26px; }
    .resume-sidebar-layout { grid-template-columns: 1fr; }
    .resume-side-column, .resume-main-column { padding: 30px 24px; }
  }
  @media (max-width: 460px) {
    .rb-header-status { grid-auto-flow: row; justify-items: start; }
    .rb-preview-controls > .rb-preview-action-btn, .rb-preview-controls > .rb-preview-download-btn { flex: 1 1 100%; }
    .rb-primary-btn, .rb-secondary-btn, .rb-preview-action-btn, .rb-preview-download-btn { width: 100%; }
    .rb-bullet-edit-row { grid-template-columns: 10px minmax(0,1fr) 28px; gap: 6px; }
    .rb-rich-toolbar span { display: none; }
  }


  .rb-outline-list { display: grid; gap: 13px; }
  .rb-outline-card { border: 1px solid rgba(148,163,184,.18); background: rgba(30,41,59,.48); border-radius: 15px; padding: 13px; }
  .rb-outline-head, .rb-subsection-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .rb-outline-title-wrap { display: flex; align-items: center; gap: 9px; min-width: 0; flex: 1; }
  .rb-outline-title-wrap > strong { color: #f8fafc; font-size: 13px; }
  .rb-outline-type { flex: 0 0 auto; border-radius: 999px; padding: 4px 7px; font-size: 10px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; }
  .rb-outline-type.system { color: #bfdbfe; background: rgba(59,130,246,.15); }
  .rb-outline-type.custom { color: #ddd6fe; background: rgba(139,92,246,.16); }
  .rb-outline-actions { display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto; }
  .rb-outline-note { margin: 10px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.55; }
  .rb-outline-bullets { margin-top: 10px; display: grid; gap: 7px; }
  .rb-outline-bullet-row { display: grid; grid-template-columns: 12px minmax(0,1fr) 30px; align-items: center; gap: 7px; }
  .rb-outline-bullet-row > span { color: #c4b5fd; font-weight: 900; }
  .rb-outline-bullet-row input { width: 100%; min-width: 0; outline: none; color: #f8fafc; background: rgba(15,23,42,.66); border: 1px solid rgba(148,163,184,.2); border-radius: 9px; padding: 9px 10px; font: inherit; font-size: 12px; }
  .rb-subsection-toolbar { margin-top: 13px; padding-top: 12px; border-top: 1px dashed rgba(148,163,184,.22); display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #e2e8f0; font-size: 12px; }
  .rb-secondary-btn.small { min-height: 32px; padding: 0 10px; font-size: 11px; }
  .rb-subsection-card { margin-top: 9px; margin-left: 13px; padding: 11px; border-left: 2px solid rgba(167,139,250,.52); border-radius: 0 12px 12px 0; background: rgba(15,23,42,.44); }
  .rb-hidden-sections { margin-top: 14px; padding: 13px; border-radius: 14px; border: 1px dashed rgba(251,191,36,.36); background: rgba(120,53,15,.12); }
  .rb-hidden-sections strong { color: #fde68a; font-size: 13px; }
  .rb-hidden-sections p { margin: 4px 0 10px; color: #cbd5e1; font-size: 11px; line-height: 1.5; }
  .rb-hidden-section-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .rb-restore-section-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; border: 1px solid rgba(251,191,36,.33); border-radius: 9px; padding: 0 10px; color: #fde68a; background: rgba(251,191,36,.1); cursor: pointer; font: inherit; font-size: 11px; font-weight: 800; }
  .rb-restore-section-btn:hover { background: rgba(251,191,36,.18); }
  .resume-subsection { margin-top: 10px; padding: 8px 0 0 10px; border-left: 2px solid color-mix(in srgb, var(--resume-accent) 50%, transparent); }
  .resume-subsection h4 { margin: 0; color: #0f172a; font-size: .98em; }
  .resume-subsection .resume-bullet-list { margin-top: 4px; }
  .resume-side-column .resume-subsection { border-color: rgba(255,255,255,.52); }
  .resume-side-column .resume-subsection h4 { color: #fff; }
  @media (max-width: 720px) {
    .rb-outline-head, .rb-subsection-head, .rb-subsection-toolbar { align-items: flex-start; flex-direction: column; }
    .rb-outline-actions { flex-wrap: wrap; }
    .rb-outline-title-wrap { width: 100%; }
    .rb-subsection-card { margin-left: 0; }
  }

  /* SaaS-level workspace polish */
  .rb-topbar {
    padding: 26px 28px;
    border: 1px solid rgba(148,163,184,.14);
    border-radius: 24px;
    background:
      radial-gradient(circle at 88% 10%, rgba(139,92,246,.20), transparent 30%),
      linear-gradient(145deg, rgba(24,33,59,.96), rgba(12,19,36,.92));
    box-shadow: 0 22px 56px rgba(2,6,23,.22);
  }
  .rb-header-status {
    display: grid;
    gap: 9px;
    justify-items: end;
    padding-top: 3px;
  }
  .rb-header-status > span:first-child {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 11px;
    border: 1px solid rgba(134,239,172,.20);
    border-radius: 999px;
    background: rgba(34,197,94,.08);
    color: #bbf7d0;
    font-size: 11px;
    font-weight: 800;
  }
  .rb-header-status-muted { color: #a8b5c9; font-size: 11px; font-weight: 700; }
  .rb-setup-panel, .rb-template-section, .rb-match-panel {
    box-shadow: 0 16px 38px rgba(2,6,23,.14);
  }
  .rb-workspace { align-items: start; }
  .rb-editor-panel, .rb-preview-actions-panel {
    box-shadow: 0 16px 36px rgba(2,6,23,.16);
  }
  /* Preview controls must stay above the resume in normal page flow. */
  .rb-preview-actions-panel {
    position: relative !important;
    inset: auto !important;
    top: auto !important;
    right: auto !important;
    bottom: auto !important;
    left: auto !important;
    z-index: 0 !important;
    margin: 0 0 18px !important;
    padding: 15px 16px;
    border-color: rgba(167,139,250,.20);
    box-shadow: 0 16px 32px rgba(2,6,23,.22);
  }
  .rb-preview-controls { gap: 8px; }
  .rb-preview-action-btn {
    background: rgba(30,41,59,.88);
    border: 1px solid rgba(167,139,250,.24);
  }
  .rb-preview-action-btn:hover {
    background: rgba(76,29,149,.24);
    border-color: rgba(196,181,253,.56);
    transform: translateY(-1px);
  }
  .rb-preview-stage {
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 20px 48px rgba(2,6,23,.14);
  }
  .rb-template-card { transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease; }
  .rb-template-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(2,6,23,.20); }
  .rb-tabs { scrollbar-width: thin; }
  @media print {
    body { background: #ffffff !important; }
    .no-print, .rb-topbar, .rb-setup-panel, .rb-template-section, .rb-match-panel,
    .rb-editor-panel, .rb-preview-actions-panel { display: none !important; }
    .rb-app, .rb-workspace, .rb-preview-panel, .rb-preview-stage { display: block !important; padding: 0 !important; margin: 0 !important; max-width: none !important; border: 0 !important; box-shadow: none !important; background: #ffffff !important; min-height: 0 !important; }
    .resume-paper { width: 100% !important; min-height: auto !important; margin: 0 !important; box-shadow: none !important; }
    .resume-education, .resume-compact-entry { break-inside: avoid; page-break-inside: avoid; }
    .resume-section > h3, .resume-entry-top { break-after: avoid; page-break-after: avoid; }
  }

  /* Exact live-preview PDF export: print the actual resume DOM instead of a second renderer. */
  @page { size: A4; margin: 0; }
  /* Keep preview controls and resume in one normal scrolling document. */
  .rb-preview-stage {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
    min-height: 0 !important;
    overflow: visible !important;
    opacity: 1 !important;
    cursor: default !important;
    transform: none !important;
  }
  .rb-preview-actions-panel {
    position: static !important;
    inset: auto !important;
    z-index: auto !important;
    width: 100%;
    margin: 0 !important;
  }
  .rb-preview-document {
    min-width: 0;
    width: 100%;
  }

  @media print {
    html, body.rb-printing-resume {
      width: 210mm !important;
      min-height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body.rb-printing-resume .rb-app {
      display: block !important;
      width: 210mm !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    body.rb-printing-resume .rb-topbar,
    body.rb-printing-resume .rb-setup-panel,
    body.rb-printing-resume .rb-template-section,
    body.rb-printing-resume .rb-match-panel,
    body.rb-printing-resume .rb-editor-panel,
    body.rb-printing-resume .rb-preview-actions-panel {
      display: none !important;
    }
    body.rb-printing-resume .rb-workspace,
    body.rb-printing-resume .rb-preview-panel,
    body.rb-printing-resume .rb-preview-stage {
      display: block !important;
      width: 210mm !important;
      max-width: none !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: #ffffff !important;
    }
    body.rb-printing-resume #resume-print-area {
      display: block !important;
      width: 210mm !important;
      min-height: 297mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body.rb-printing-resume #resume-print-area *,
    body.rb-printing-resume #resume-print-area::before,
    body.rb-printing-resume #resume-print-area::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body.rb-printing-resume #resume-print-area.resume-sidebar-layout {
      display: grid !important;
      grid-template-columns: 31% 69% !important;
      align-items: stretch !important;
      padding: 0 !important;
    }
    body.rb-printing-resume #resume-print-area.resume-sidebar-layout .resume-side-column {
      display: block !important;
      min-height: 297mm !important;
      background: var(--resume-accent) !important;
    }
    body.rb-printing-resume #resume-print-area.resume-sidebar-layout .resume-main-column {
      display: block !important;
      min-height: 297mm !important;
      background: #ffffff !important;
    }
    body.rb-printing-resume #resume-print-area.resume-oxford-layout {
      display: block !important;
    }
  }

`;

export default ResumeBuilderPage;
