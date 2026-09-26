import re

print("=== GlobalMedSearch imports ===")
with open('src/components/GlobalMedSearch.tsx', 'r') as f:
    content = f.read()

print(content.split('export function')[0])

print("\n=== ADDITIONAL_MEDS_DATA Semaglutide entries ===")
with open('src/calculators/diabetes/additional-meds-data.ts', 'r') as f:
    data = f.read()
for m in re.finditer(r'\{[^}]*drug:\s*"([^"]*Semaglutide[^"]*)"[^}]*\}', data):
    print(m.group(1))

print("\n=== obesity/medication-database.ts Semaglutide entries ===")
with open('src/calculators/obesity/medication-database.ts', 'r') as f:
    data = f.read()
for m in re.finditer(r'\{[^}]*name:\s*"([^"]*Semaglutide[^"]*)"[^}]*\}', data):
    print(m.group(1))
