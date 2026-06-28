import AtsProfessionalTemplate from "./AtsProfessionalTemplate";
import ModernDeveloperTemplate from "./ModernDeveloperTemplate";
import CorporateCleanTemplate from "./CorporateCleanTemplate";
import MinimalTechTemplate from "./MinimalTechTemplate";

const ResumeTemplateRenderer = ({ resume, templateName }) => {
  const name = String(templateName || "ATS Professional").toLowerCase();

  if (name.includes("modern") || name.includes("developer")) {
    return <ModernDeveloperTemplate resume={resume} />;
  }

  if (name.includes("corporate") || name.includes("clean")) {
    return <CorporateCleanTemplate resume={resume} />;
  }

  if (name.includes("minimal")) {
    return <MinimalTechTemplate resume={resume} />;
  }

  return <AtsProfessionalTemplate resume={resume} />;
};

export default ResumeTemplateRenderer;
