// Sessão 2b (DEBT-008) — confere, verbatim, os trechos citados em fontes_certeza.md contra as fontes oficiais.
// As fontes não ficam no repositório (ver a tabela de fontes_certeza.md, com URL e SHA-256). Para refazer:
//   curl -o PMC8005924.xml https://www.ebi.ac.uk/europepmc/webservices/rest/PMC8005924/fullTextXML   (idem 8005925, 4320440)
//   curl -L -o g7647.pdf https://eprints.whiterose.ac.uk/id/eprint/91310/1/bmj.g7647.full.pdf && pdftotext g7647.pdf g7647.txt
// Uso: node confere_citacoes.mjs PMC8005924.xml PMC8005925.xml PMC4320440.xml g7647.txt   → "OK" em cada linha.
import * as fs from "node:fs";
const fontes = process.argv.slice(2);
const norm = (s) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/-\s*\n\s*/g, "-").replace(/\s+/g, " ").trim();
const texto = fontes.map((f) => { let x = fs.readFileSync(f, "utf-8"); if (f.endsWith(".xml")) x = x.replace(/<\/(p|td|th|title|tr|list-item|caption|label)>/g, "\n").replace(/<[^>]+>/g, "").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, "&"); return norm(x); }).join(" || ");
const lista = [
 'Essential elements should be reported in the main report or as supplementary material for all systematic reviews (except for those preceded by "If…," which should only be reported where applicable).',
 'The essential and additional elements are framed in terms of reporting the "presence" of a method or result (such as reporting if individuals were contacted to identify studies) rather than reporting on their absence. In some instances, however, reporting the absence of a method may be helpful (for example, "We did not contact individuals to identify studies"). We leave these decisions to the judgment of authors.',
 'If no such assessments are planned, the authors should state this with a rationale for why not.',
 'Authors should describe which approach they plan on using to summarize the confidence they have in the resulting body of evidence, ideally using an established and validated approach.',
 'Describe how the strength of the body of evidence will be assessed (e.g., GRADE)',
 '(c) an assessment of the validity of the findings of the included studies (e.g., assessment of risk of bias and confidence in cumulative estimates)',
 'Describe any methods used to assess certainty (or confidence) in the body of evidence for an outcome.',
 'Present assessments of certainty (or confidence) in the body of evidence for each outcome assessed.',
 'Specify the tool or system (and version) used to assess certainty in the body of evidence.',
 'Report how many reviewers assessed the certainty of evidence',
 'Report any processes used to obtain or confirm relevant information from investigators.',
 'Report the overall level of certainty in the body of evidence (such as high, moderate, low, or very low) for each important outcome.',
 'Provide an explanation of reasons for rating down (or rating up) the certainty of evidence',
 'Communicate certainty in the evidence wherever results are reported',
];
for (const t of lista) console.log(texto.includes(norm(t)) ? "OK  " : "FALTA", t.slice(0, 90));
