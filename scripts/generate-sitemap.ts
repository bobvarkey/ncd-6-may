// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://ncdapp.store";

interface Entry {
  path: string;
  changefreq?: "weekly" | "monthly" | "yearly";
  priority?: string;
}

// Canonical, indexable routes only. Excludes duplicates, redirects, legal boilerplate,
// admin/dev, and calculator-shell routes that redirect to a parent.
const entries: Entry[] = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/home", priority: "1.0", changefreq: "weekly" },
  { path: "/diabetes", priority: "0.9", changefreq: "weekly" },
  { path: "/hypertension", priority: "0.9", changefreq: "weekly" },
  { path: "/lipids", priority: "0.9", changefreq: "weekly" },
  { path: "/liver", priority: "0.8", changefreq: "monthly" },
  { path: "/anemia", priority: "0.8", changefreq: "monthly" },
  { path: "/respiratory", priority: "0.8", changefreq: "monthly" },
  { path: "/renal-dosing", priority: "0.9", changefreq: "monthly" },
  { path: "/aki-criteria", priority: "0.7", changefreq: "monthly" },
  { path: "/acid-base", priority: "0.7", changefreq: "monthly" },
  { path: "/electrolytes", priority: "0.7", changefreq: "monthly" },
  { path: "/geriatrics", priority: "0.7", changefreq: "monthly" },
  { path: "/infections", priority: "0.8", changefreq: "monthly" },
  { path: "/adult-vaccinations", priority: "0.7", changefreq: "monthly" },
  { path: "/thyroid", priority: "0.7", changefreq: "monthly" },
  { path: "/fatigue", priority: "0.7", changefreq: "monthly" },
  { path: "/vitamin-d", priority: "0.7", changefreq: "monthly" },
  { path: "/women-health", priority: "0.7", changefreq: "monthly" },
  { path: "/iron-calculator", priority: "0.7", changefreq: "monthly" },
  { path: "/ascvd-risk", priority: "0.8", changefreq: "monthly" },
  { path: "/gfr-calculator", priority: "0.7", changefreq: "monthly" },
  { path: "/drug-interactions", priority: "0.7", changefreq: "monthly" },
  { path: "/goldman-cardiac", priority: "0.6", changefreq: "monthly" },
  { path: "/perioperative", priority: "0.6", changefreq: "monthly" },
  { path: "/pep", priority: "0.6", changefreq: "monthly" },
  { path: "/guides/mme-cdc", priority: "0.8", changefreq: "monthly" },
  { path: "/images", priority: "0.6", changefreq: "monthly" },
];

const now = new Date().toISOString().slice(0, 10);
const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      `    <lastmod>${now}</lastmod>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  ),
  `</urlset>`,
].join("\n");

writeFileSync(resolve("public/sitemap.xml"), xml);
console.log(`sitemap.xml written (${entries.length} entries)`);
