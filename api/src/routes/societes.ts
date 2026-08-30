import { Env } from '../types';

function genId(): string {
  return crypto.randomUUID();
}

export const routeSocietes = {
  async list(env: Env) {
    const results = await env.DB.prepare('SELECT * FROM societes ORDER BY nom').all();
    return results.results;
  },

  async get(env: Env, id: string) {
    const s = await env.DB.prepare('SELECT * FROM societes WHERE id = ?').bind(id).first();
    if (!s) return { error: 'Société non trouvée' };
    return s;
  },

  async create(request: Request, env: Env) {
    const body = await request.json<{ nom: string; matricule_fiscal?: string; activite?: string; sage_code_dossier?: string; sage_debut_exercice?: string }>();
    const id = genId();
    await env.DB.prepare(
      'INSERT INTO societes (id, nom, matricule_fiscal, activite, sage_code_dossier, sage_debut_exercice) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, body.nom, body.matricule_fiscal || null, body.activite || null, body.sage_code_dossier || null, body.sage_debut_exercice || null).run();
    return await env.DB.prepare('SELECT * FROM societes WHERE id = ?').bind(id).first();
  },

  async update(request: Request, env: Env, id: string) {
    const body = await request.json<Record<string, unknown>>();
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(body)) {
      if (['nom', 'matricule_fiscal', 'activite', 'sage_code_dossier', 'sage_debut_exercice', 'navette_format_notes'].includes(k)) {
        fields.push(`${k} = ?`);
        values.push(v);
      }
    }
    if (fields.length === 0) return { error: 'Aucun champ à modifier' };
    fields.push("updated_at = datetime('now')");
    values.push(id);
    await env.DB.prepare(`UPDATE societes SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await env.DB.prepare('SELECT * FROM societes WHERE id = ?').bind(id).first();
  },

  async remove(env: Env, id: string) {
    await env.DB.prepare('DELETE FROM anomalies WHERE dossier_id IN (SELECT id FROM dossiers_paie WHERE societe_id = ?)').bind(id).run();
    await env.DB.prepare('DELETE FROM imports_ga WHERE dossier_id IN (SELECT id FROM dossiers_paie WHERE societe_id = ?)').bind(id).run();
    await env.DB.prepare('DELETE FROM lignes_extraites WHERE dossier_id IN (SELECT id FROM dossiers_paie WHERE societe_id = ?)').bind(id).run();
    await env.DB.prepare('DELETE FROM dossiers_paie WHERE societe_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM salaries WHERE societe_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM rubriques WHERE societe_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM societes WHERE id = ?').bind(id).run();
    return { ok: true };
  },
};
