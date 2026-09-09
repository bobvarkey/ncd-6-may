import re

with open('src/components/GlobalMedSearch.tsx', 'r') as f:
    content = f.read()

# 1. Add import for obesity medication database
if 'medication-database' not in content:
    content = content.replace(
        "import { ADDITIONAL_MEDS_DATA } from \"@/calculators/diabetes/additional-meds-data\";",
        "import { ADDITIONAL_MEDS_DATA } from \"@/calculators/diabetes/additional-meds-data\";\nimport { medicationDatabase as OBESITY_MEDS } from \"@/calculators/obesity/medication-database\";"
    )

# 2. Add obesity meds normalization before ALL_MEDS
obesity_normalize = '''// Normalize obesity meds into the same search shape.
const OBESITY_MEDS_NORMALIZED = OBESITY_MEDS.map((m) => ({
  drug: m.name,
  drugClass: m.genericName ? `${m.genericName} — ${m.class || ""}` : (m.class || ""),
  normalDose: m.dose,
  brand: m.genericName && m.name !== m.genericName ? m.genericName : undefined,
  _target: "obesity" as const,
}));

'''

if 'OBESITY_MEDS_NORMALIZED' not in content:
    content = content.replace(
        "const ALL_MEDS = [",
        obesity_normalize + "const ALL_MEDS = ["
    )

# 3. Include OBESITY_MEDS_NORMALIZED in ALL_MEDS
if '...OBESITY_MEDS_NORMALIZED' not in content:
    content = content.replace(
        """const ALL_MEDS = [
  ...RENAL_DATA,
  ...ANTIBIOTICS_DATA,
  ...ANTICOAGULANTS_DATA,
  ...ADDITIONAL_MEDS_DATA,
  ...HTN_MEDS_NORMALIZED,
].filter""",
        """const ALL_MEDS = [
  ...RENAL_DATA,
  ...ANTIBIOTICS_DATA,
  ...ANTICOAGULANTS_DATA,
  ...ADDITIONAL_MEDS_DATA,
  ...HTN_MEDS_NORMALIZED,
  ...OBESITY_MEDS_NORMALIZED,
].filter"""
    )

# 4. Expand synonyms to include generic -> brands and brand -> generic
synonyms_block_start = content.find('const MED_SYNONYMS: Record<string, string[]> = {')
synonyms_block_end = content.find('};', synonyms_block_start) + 2
existing_synonyms = content[synonyms_block_start:synonyms_block_end]

# Add reverse synonyms for Semaglutide and Tirzepatide if not present
if '"Ozempic"' not in existing_synonyms:
    # Insert reverse mappings after Semaglutide line
    existing_synonyms = existing_synonyms.replace(
        '"Semaglutide": ["Ozempic", "Wegovy", "Rybelsus"],',
        '"Semaglutide": ["Ozempic", "Wegovy", "Rybelsus"],\n  "Ozempic": ["Semaglutide"],\n  "Wegovy": ["Semaglutide"],\n  "Rybelsus": ["Semaglutide"],'
    )
    existing_synonyms = existing_synonyms.replace(
        '"Tirzepatide": ["Mounjaro", "Zepbound"],',
        '"Tirzepatide": ["Mounjaro", "Zepbound"],\n  "Mounjaro": ["Tirzepatide"],\n  "Zepbound": ["Tirzepatide"],'
    )
    content = content[:synonyms_block_start] + existing_synonyms + content[synonyms_block_end:]

# 5. Improve synonym matching: also match when user types the main drug name against synonym list
search_logic_start = content.find('const synonymMatches =')
if search_logic_start > 0:
    old_logic = '''    // Check synonyms first
    const synonymMatches = Object.entries(MED_SYNONYMS).filter(([mainDrug, synonyms]) => 
      synonyms.some(s => s.toLowerCase().includes(term))
    ).map(([mainDrug]) => mainDrug.toLowerCase());'''
    new_logic = '''    // Check synonyms first (brand -> generic and generic -> brand)
    const synonymMatches = Object.entries(MED_SYNONYMS).filter(([mainDrug, synonyms]) => {
      const mainMatch = mainDrug.toLowerCase().includes(term);
      const synonymMatch = synonyms.some(s => s.toLowerCase().includes(term));
      return mainMatch || synonymMatch;
    }).map(([mainDrug]) => mainDrug.toLowerCase());'''
    content = content.replace(old_logic, new_logic)

with open('src/components/GlobalMedSearch.tsx', 'w') as f:
    f.write(content)

print('Updated GlobalMedSearch.tsx to include obesity meds and improve synonym search')
