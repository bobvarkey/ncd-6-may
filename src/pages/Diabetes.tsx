import DiabetesTab from "./diabetes/DiabetesTab";
import Seo from "@/components/Seo";

export default function Diabetes() {
  return (
    <>
      <Seo
        title="Diabetes — ADA 2026 Algorithms & Prescribing"
        description="Diabetes diagnosis, ADA 2026 medication algorithm, insulin therapy, DKA/HHS pathways and prescribing guidance for primary care."
        path="/diabetes"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: "Diabetes clinical tools",
          about: { "@type": "MedicalCondition", name: "Diabetes mellitus" },
          audience: { "@type": "MedicalAudience", audienceType: "Physician" },
          url: "https://ncdapp.store/diabetes",
        }}
      />
      <DiabetesTab />
    </>
  );
}
