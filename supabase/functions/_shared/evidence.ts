// Shared evidence layer: only peer-reviewed literature and recognised
// medical / public-health institutions may be surfaced as references.
// Personal blogs, forums, content farms and commercial health sites are excluded
// by construction — anything not on this allowlist is dropped.

export const TRUSTED_DOMAINS = [
  // Peer-reviewed literature and government libraries
  "pubmed.ncbi.nlm.nih.gov",
  "www.ncbi.nlm.nih.gov",
  "pmc.ncbi.nlm.nih.gov",
  "clinicaltrials.gov",
  "www.cochranelibrary.com",
  "jamanetwork.com",
  "www.nejm.org",
  "www.thelancet.com",
  "www.bmj.com",
  "www.acpjournals.org",
  // Government and intergovernmental health authorities
  "medlineplus.gov",
  "www.nih.gov",
  "www.nia.nih.gov",
  "www.nimh.nih.gov",
  "www.nhlbi.nih.gov",
  "www.niddk.nih.gov",
  "www.cancer.gov",
  "www.womenshealth.gov",
  "www.cdc.gov",
  "www.fda.gov",
  "dailymed.nlm.nih.gov",
  "www.who.int",
  "www.uspreventiveservicestaskforce.org",
  // Professional societies and academic medical centres
  "www.acog.org",
  "www.heart.org",
  "www.diabetes.org",
  "www.cancer.org",
  "www.menopause.org",
  "www.aad.org",
  "www.psychiatry.org",
  "www.rheumatology.org",
  "www.mayoclinic.org",
  "my.clevelandclinic.org",
  "www.hopkinsmedicine.org",
];

export type Reference = {
  title: string;
  source: string;
  url: string;
  kind: "peer-reviewed" | "guideline";
  year?: number | null;
  journal?: string | null;
};

const LABELS: Record<string, string> = {
  "pubmed.ncbi.nlm.nih.gov": "PubMed (peer-reviewed)",
  "pmc.ncbi.nlm.nih.gov": "PubMed Central (peer-reviewed)",
  "www.cochranelibrary.com": "Cochrane Library (systematic review)",
  "medlineplus.gov": "MedlinePlus (NIH)",
  "www.uspreventiveservicestaskforce.org": "U.S. Preventive Services Task Force",
  "www.acog.org": "American College of Obstetricians and Gynecologists",
  "www.menopause.org": "The Menopause Society",
  "www.cdc.gov": "CDC",
  "www.who.int": "World Health Organization",
  "www.fda.gov": "FDA",
};

export function isTrusted(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && TRUSTED_DOMAINS.includes(u.hostname);
  } catch {
    return false;
  }
}

/** Drop anything the model produced that is not on the allowlist. */
export function sanitizeReferences(refs: unknown): Reference[] {
  if (!Array.isArray(refs)) return [];
  const out: Reference[] = [];
  const seen = new Set<string>();
  for (const r of refs.slice(0, 10)) {
    const title = String((r as any)?.title ?? "").trim().slice(0, 200);
    const url = String((r as any)?.url ?? "").trim();
    if (!title || !isTrusted(url) || seen.has(url)) continue;
    seen.add(url);
    const host = new URL(url).hostname;
    out.push({
      title,
      source: LABELS[host] ?? host.replace(/^www\./, ""),
      url,
      kind: host.includes("pubmed") || host.includes("pmc.") || host.includes("cochrane") ? "peer-reviewed" : "guideline",
      year: Number((r as any)?.year) || null,
      journal: (r as any)?.journal ? String((r as any).journal).slice(0, 120) : null,
    });
  }
  return out;
}

/**
 * Search PubMed (NCBI E-utilities) for real, citable peer-reviewed articles.
 * Filtered to humans, English, review-grade evidence within the last 10 years.
 */
export async function pubmedSearch(query: string, limit = 4): Promise<Reference[]> {
  const base = (query ?? "").replace(/[^\w\s\-]/g, " ").replace(/\s+/g, " ").trim();
  if (!base) return [];
  const evidence =
    "(review[Filter] OR systematic[Filter] OR meta-analysis[Filter] OR guideline[Filter])";
  const recent = '("2015"[PDAT] : "3000"[PDAT])';
  const short = base.split(" ").filter((w) => !/^\d/.test(w)).slice(0, 5).join(" ");
  // Narrow first, then loosen — PubMed returns nothing for over-specified phrases.
  const attempts = [
    `${base} AND (humans[Filter]) AND (english[Filter]) AND ${evidence} AND ${recent}`,
    `${short} AND (humans[Filter]) AND (english[Filter]) AND ${evidence} AND ${recent}`,
    `${short} AND (humans[Filter]) AND ${evidence}`,
    short,
  ];

  for (const term of attempts) {
    try {
      const sr = await fetch(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=relevance" +
          `&retmax=${limit}&term=${encodeURIComponent(term)}`,
      );
      if (!sr.ok) continue;
      const ids: string[] = (await sr.json())?.esearchresult?.idlist ?? [];
      if (!ids.length) continue;

      const su = await fetch(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=" + ids.join(","),
      );
      if (!su.ok) continue;
      const result = (await su.json())?.result ?? {};
      const refs = ids
        .map((id) => {
          const rec = result[id];
          if (!rec?.title) return null;
          return {
            title: String(rec.title).replace(/<[^>]+>/g, "").replace(/\.$/, ""),
            source: "PubMed (peer-reviewed)",
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            kind: "peer-reviewed" as const,
            year: Number(String(rec.pubdate ?? "").slice(0, 4)) || null,
            journal: rec.source ? String(rec.source) : null,
          };
        })
        .filter(Boolean) as Reference[];
      if (refs.length) return refs;
    } catch (e) {
      console.log("pubmed search failed:", (e as Error).message);
    }
  }
  return [];
}

/** Human-readable demographic context block for prompts, plus a hint of what it should change. */
export function demographicContext(demographics: any, familyHistory: any) {
  if (!demographics && !familyHistory) return "";
  const d = demographics ?? {};
  const age = d.birth_year ? new Date().getFullYear() - Number(d.birth_year) : d.age ?? null;
  const bits = [
    age ? `Age: ${age}` : null,
    d.sex_at_birth ? `Sex assigned at birth: ${d.sex_at_birth}` : null,
    d.gender && d.gender !== d.sex_at_birth ? `Gender identity: ${d.gender}` : null,
    Array.isArray(d.ancestry) && d.ancestry.length ? `Heritage / ancestry (self-reported): ${d.ancestry.join(", ")}` : null,
    d.pregnancy_status && d.pregnancy_status !== "not_applicable" ? `Pregnancy status: ${d.pregnancy_status}` : null,
    d.notes ? `Other context: ${d.notes}` : null,
    familyHistory?.conditions?.length ? `Family history: ${familyHistory.conditions.join(", ")}` : null,
    familyHistory?.notes ? `Family history notes: ${familyHistory.notes}` : null,
  ].filter(Boolean);
  if (!bits.length) return "";
  return `PERSON'S SELF-REPORTED CONTEXT (use it — it changes what is likely and what screening is due):
${bits.join("\n")}

How to use this context:
- Age and sex change the pretest likelihood of conditions and the screening schedule that applies.
- Heritage/ancestry matters only where real population-level evidence exists (e.g. ancestry-linked carrier screening, sickle cell trait, Tay-Sachs, BRCA founder variants, lactase persistence, differing baseline risk for diabetes, hypertension, or preeclampsia). Never stereotype, never infer behaviour, diet, or compliance from ancestry, and never treat ancestry as a diagnosis. If no solid evidence links ancestry to this concern, say nothing about it.
- Family history should raise earlier or more frequent screening where guidelines say so.
- Say plainly which piece of their context drove each recommendation.`;
}
