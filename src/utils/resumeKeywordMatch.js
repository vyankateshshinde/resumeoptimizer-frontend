const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into",
  "is", "it", "of", "on", "or", "our", "that", "the", "their", "this", "to", "with",
  "will", "you", "your", "we", "who", "have", "has", "had", "should", "must", "may",
  "role", "job", "work", "working", "team", "teams", "company", "candidate", "candidates",
  "experience", "years", "year", "required", "preferred", "responsibilities", "responsibility",
  "skills", "skill", "knowledge", "ability", "strong", "excellent", "good", "including",
  "support", "develop", "development", "developer", "provide", "using", "build", "building",
  "need", "needs", "looking", "seeking", "position", "opportunity", "ideal", "join",
  "ensure", "maintain", "manage", "level", "plus", "etc", "related", "within", "across",
]);

const HIGH_VALUE_PHRASES = [
  "spring boot", "spring security", "spring framework", "spring mvc", "react.js", "react js",
  "javascript", "typescript", "node.js", "node js", "rest api", "restful api", "microservices",
  "java", "python", "c++", "c#", "angular", "vue.js", "html5", "css3", "tailwind css",
  "hibernate", "jpa", "mysql", "mongodb", "postgresql", "oracle database", "sql server",
  "apache kafka", "kafka", "websocket", "stomp", "jwt", "oauth", "docker", "kubernetes",
  "jenkins", "git", "github", "gitlab", "aws", "amazon web services", "azure", "gcp",
  "ci/cd", "ci cd", "maven", "gradle", "junit", "mockito", "swagger", "openapi", "postman",
  "agile", "scrum", "system design", "data structures", "machine learning", "artificial intelligence",
  "medical coding", "icd-10", "icd 10", "cpt", "hcpcs", "hipaa", "revenue cycle management",
  "risk adjustment", "hcc coding", "medical terminology", "anatomy and physiology",
];

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

export const escapeRegExp = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cleanKeyword = (value) =>
  String(value || "")
    .replace(/^[^a-z0-9+#./-]+|[^a-z0-9+#./-]+$/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const hasKeyword = (source, keyword) => {
  const normalizedSource = normalize(source);
  const normalizedKeyword = normalize(keyword);

  if (!normalizedKeyword || !normalizedSource) return false;

  const escaped = escapeRegExp(normalizedKeyword).replace(/\\\s+/g, "\\s+");
  const leftBoundary = /[a-z0-9]/i.test(normalizedKeyword[0]) ? "\\b" : "";
  const rightBoundary = /[a-z0-9]/i.test(normalizedKeyword.at(-1)) ? "\\b" : "";

  return new RegExp(`${leftBoundary}${escaped}${rightBoundary}`, "i").test(normalizedSource);
};

const phraseCandidates = (jobDescription) =>
  HIGH_VALUE_PHRASES.filter((phrase) => hasKeyword(jobDescription, phrase));

const tokenCandidates = (jobDescription) => {
  const counts = new Map();

  String(jobDescription || "")
    .replace(/[(){}\[\],;:|]/g, " ")
    .split(/\s+/)
    .map(cleanKeyword)
    .map((token) => token.toLowerCase())
    .filter((token) => token.length >= 3)
    .filter((token) => !STOP_WORDS.has(token))
    .filter((token) => !/^\d+$/.test(token))
    .forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([token]) => token)
    .slice(0, 28);
};

export const extractJobKeywords = (jobDescription, limit = 35) => {
  const phrases = phraseCandidates(jobDescription);
  const phraseParts = new Set(
    phrases.flatMap((phrase) => normalize(phrase).split(/\s+/)).filter(Boolean)
  );
  const tokens = tokenCandidates(jobDescription).filter(
    (token) => !phraseParts.has(normalize(token))
  );
  const seen = new Set();

  return [...phrases, ...tokens]
    .map(cleanKeyword)
    .filter(Boolean)
    .filter((keyword) => {
      const key = normalize(keyword);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
};

export const analyzeKeywordMatch = (resumeText, jobDescription) => {
  const keywords = extractJobKeywords(jobDescription);
  const matchedKeywords = keywords.filter((keyword) => hasKeyword(resumeText, keyword));
  const missingKeywords = keywords.filter((keyword) => !hasKeyword(resumeText, keyword));
  const score = keywords.length
    ? Math.round((matchedKeywords.length / keywords.length) * 100)
    : 0;

  return {
    totalKeywords: keywords.length,
    matchedKeywords,
    missingKeywords,
    score,
  };
};

export const splitTextByKeywords = (value, keywords = []) => {
  const source = String(value || "");
  const cleanKeywords = [...new Set(keywords.map(cleanKeyword).filter(Boolean))]
    .sort((a, b) => b.length - a.length);

  if (!source || !cleanKeywords.length) return [source];

  const pattern = cleanKeywords
    .map((keyword) => {
      const escaped = escapeRegExp(keyword);
      const leftBoundary = /[a-z0-9]/i.test(keyword[0]) ? "\\b" : "";
      const rightBoundary = /[a-z0-9]/i.test(keyword.at(-1)) ? "\\b" : "";
      return `${leftBoundary}${escaped}${rightBoundary}`;
    })
    .join("|");
  const expression = new RegExp(`(${pattern})`, "gi");

  return source.split(expression);
};

export const isKeywordToken = (value, keywords = []) =>
  keywords.some((keyword) => normalize(keyword) === normalize(value));
