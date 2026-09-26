import LipidsTab from "./lipids/LipidsTab";
import Seo from "@/components/Seo";

export default function Lipids() {
  return (
    <>
      <Seo
        title="Lipids — ASCVD Risk, LDL Targets & Therapy"
        description="ASCVD risk stratification, LDL-C targets by risk tier (including South Asian VHR/EHR), statin intensity and PCSK9 pathway."
        path="/lipids"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: "Lipid management",
          about: { "@type": "MedicalCondition", name: "Dyslipidemia" },
          audience: { "@type": "MedicalAudience", audienceType: "Physician" },
          url: "https://ncdapp.store/lipids",
        }}
      />
      <LipidsTab />
    </>
  );
}
