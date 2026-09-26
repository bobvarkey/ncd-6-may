import HypertensionTab from "./hypertension/HypertensionTab";
import Seo from "@/components/Seo";

export default function Hypertension() {
  return (
    <>
      <Seo
        title="Hypertension — ESC/ESH Assessment & Treatment"
        description="Hypertension staging, target BP, treatment algorithms, MRA and ARNI selection, and secondary-HTN workup for primary care."
        path="/hypertension"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: "Hypertension clinical tools",
          about: { "@type": "MedicalCondition", name: "Hypertension" },
          audience: { "@type": "MedicalAudience", audienceType: "Physician" },
          url: "https://ncdapp.store/hypertension",
        }}
      />
      <HypertensionTab />
    </>
  );
}
