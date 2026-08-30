import { Env } from '../types';

function genId(): string {
  return crypto.randomUUID();
}

export const routeFichesNavette = {
  async upload(request: Request, env: Env, dossierId: string) {
    const dossier = await env.DB.prepare('SELECT * FROM dossiers_paie WHERE id = ?').bind(dossierId).first();
    if (!dossier) return { error: 'Dossier non trouvé' };

    const body = await request.json() as any;
    const { filename, lignes } = body;
    if (!filename || !lignes) return { error: 'filename et lignes requis' };

    await env.DB.prepare(
      `UPDATE dossiers_paie SET fichier_navette_nom = ?, statut = 'brouillon',
       extraction_json = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(filename, JSON.stringify({ lignes }), dossierId).run();

    return { ok: true, fichier_nom: filename, lignes_count: lignes.length };
  },

  async extract(env: Env, dossierId: string) {
    const dossier = await env.DB.prepare('SELECT * FROM dossiers_paie WHERE id = ?').bind(dossierId).first() as any;
    if (!dossier) return { error: 'Dossier non trouvé' };

    const extractionJson = dossier.extraction_json ? JSON.parse(dossier.extraction_json) : null;
    if (!extractionJson?.lignes) return { error: 'Aucune donnée extraitte. Upload d\'abord.' };

    await env.DB.prepare(
      "UPDATE dossiers_paie SET statut = 'extraction', updated_at = datetime('now') WHERE id = ?"
    ).bind(dossierId).run();

    try {
      const rubriques = await env.DB.prepare(
        'SELECT * FROM rubriques WHERE societe_id = ? AND actif = 1'
      ).bind(dossier.societe_id).all();

      const salaries = await env.DB.prepare(
        'SELECT * FROM salaries WHERE societe_id = ?'
      ).bind(dossier.societe_id).all();

      const extraction = extractionJson;
      const lignes = extraction.lignes || [];

      // Insert lignes extraites
      const insertLigne = env.DB.prepare(
        `INSERT INTO lignes_extraites (id, dossier_id, salary_id, matricule, nom_prenom, type_ligne, champs, rubrique_code, zone, valeur, source_feuille, source_plage, confiance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      const batch: D1PreparedStatement[] = [];
      for (const ligne of lignes) {
        const salaryMatch = ligne.matricule
          ? (salaries.results as any[]).find(s => s.matricule === ligne.matricule)
          : null;

        batch.push(insertLigne.bind(
          genId(), dossierId, salaryMatch?.id || null,
          ligne.matricule || null, ligne.nom_prenom || null,
          ligne.type_ligne || 'variable', JSON.stringify(ligne.champs || {}),
          ligne.rubrique_code || null, ligne.zone || null,
          ligne.valeur || null, ligne.source_feuille || null,
          ligne.source_plage || null, ligne.confiance || null
        ));
      }

      if (batch.length > 0) {
        await env.DB.batch(batch);
      }

      await env.DB.prepare(
        `UPDATE dossiers_paie SET statut = 'controle', extraction_confiance = ?,
         updated_at = datetime('now') WHERE id = ?`
      ).bind(extraction.confiance || 0, dossierId).run();

      return { ok: true, lignes_count: lignes.length, confiance: extraction.confiance || 0 };
    } catch (e: any) {
      await env.DB.prepare(
        "UPDATE dossiers_paie SET statut = 'brouillon', extraction_log = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(e.message, dossierId).run();
      return { error: 'Extraction échouée: ' + e.message };
    }
  },

  async lignes(env: Env, dossierId: string) {
    const results = await env.DB.prepare(
      'SELECT * FROM lignes_extraites WHERE dossier_id = ? ORDER BY created_at'
    ).bind(dossierId).all();
    return results.results;
  },

  async updateLigne(request: Request, env: Env, ligneId: string) {
    const body = await request.json<Record<string, unknown>>();
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [k, v] of Object.entries(body)) {
      if (['statut', 'matricule', 'rubrique_code', 'zone', 'valeur', 'champs'].includes(k)) {
        fields.push(`${k} = ?`);
        values.push(k === 'champs' ? JSON.stringify(v) : v);
      }
    }
    if (fields.length === 0) return { error: 'Aucun champ' };
    values.push(ligneId);

    await env.DB.prepare(`UPDATE lignes_extraites SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await env.DB.prepare('SELECT * FROM lignes_extraites WHERE id = ?').bind(ligneId).first();
  },

  async valider(env: Env, dossierId: string) {
    await env.DB.prepare(
      "UPDATE dossiers_paie SET statut = 'valide', updated_at = datetime('now') WHERE id = ?"
    ).bind(dossierId).run();
    return { ok: true };
  },
};
