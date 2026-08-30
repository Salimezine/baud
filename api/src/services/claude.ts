import * as XLSX from 'xlsx';

interface ExtractionResult {
  societe_nom: string | null;
  mois_paie: string | null;
  confiance: number;
  lignes: any[];
  mouvements: any[];
  anomalies_detectees: any[];
  resume: string;
  structure_detected: string | null;
}

export async function extractFromExcel(
  arrayBuffer: ArrayBuffer,
  filename: string,
  rubriques: any[],
  salaries: any[],
  apiKey: string,
): Promise<ExtractionResult> {
  // Parse Excel to text
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetsText: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(ws);
    sheetsText.push(`=== FEUILLE: ${sheetName} ===\n${csv}`);
  }

  const excelContent = sheetsText.join('\n\n');

  // Build rubriques context
  const rubriquesContext = rubriques.map(r => {
    const aliases = r.navette_aliases ? JSON.parse(r.navette_aliases) : [];
    return `- Code: ${r.code} | Libellé: ${r.libelle} | Type: ${r.type} | Zone: ${r.zone} | Aliases: ${aliases.join(', ')}`;
  }).join('\n');

  // Build salaries context
  const salariesContext = salaries.map(s =>
    `- Matricule: ${s.matricule} | Nom: ${s.nom} ${s.prenom || ''}`
  ).join('\n');

  const prompt = `Tu es un expert en paie tunisienne. Tu reçois le contenu textuel d'une fiche navette Excel.

## RUBRIQUES DE PAIE DE LA SOCIÉTÉ
${rubriquesContext || '(Aucune rubrique configurée)'}

## SALARIÉS CONNUS
${salariesContext || '(Aucun salarié connu)'}

## CONTENU DU FICHIER EXCEL
${excelContent.substring(0, 8000)}

## TON RÔLE
Analyser le fichier et extraire TOUTES les données de paie.

## DONNÉES À EXTRAIRE
Pour CHAQUE ligne:
1. matricule (ou null), nom_prenom
2. type_ligne: mouvement/variable/prime/retenue/constante
3. champs: données brutes
4. rubrique_code: code rubrique Sage correspondant
5. zone: code zone Sage
6. valeur: montant/nombre final
7. confiance: 0.0 à 1.0

## RÈGLES
- Ne JAMAIS inventer de données
- Nombres avec point décimal (20.5 pas 20,5)
- Dates: YYYY-MM-DD
- Constantes: MAJUSCULES

## FORMAT DE SORTIE JSON
{
  "societe_nom": "...",
  "mois_paie": "MM/YYYY",
  "confiance": 0.9,
  "lignes": [
    {
      "matricule": "010",
      "nom_prenom": "DUPONT Jean",
      "type_ligne": "variable",
      "champs": { "rubrique": "Heures Sup", "valeur": 20 },
      "rubrique_code": "HSP",
      "zone": "3",
      "valeur": 20,
      "source_feuille": "Feuil1",
      "source_plage": "E15",
      "confiance": 0.95
    }
  ],
  "mouvements": [],
  "anomalies_detectees": [],
  "resume": "..."
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const result = await response.json();
  const content = result.content?.[0]?.text || '';

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}
