import { Env } from '../types';

function genId(): string {
  return crypto.randomUUID();
}

export const routeSalaries = {
  async list(env: Env, societeId: string) {
    const results = await env.DB.prepare(
      'SELECT * FROM salaries WHERE societe_id = ? ORDER BY matricule'
    ).bind(societeId).all();
    return results.results;
  },

  async create(request: Request, env: Env, societeId: string) {
    const body = await request.json<{
      matricule: string; nom: string; prenom?: string; civilite?: string;
      date_naissance?: string; date_embauche?: string; poste?: string; type_contrat?: string;
    }>();
    const id = genId();
    await env.DB.prepare(
      `INSERT INTO salaries (id, societe_id, matricule, nom, prenom, civilite, date_naissance, date_embauche, poste, type_contrat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, societeId, body.matricule, body.nom, body.prenom || null, body.civilite || null,
      body.date_naissance || null, body.date_embauche || null, body.poste || null, body.type_contrat || null
    ).run();
    return await env.DB.prepare('SELECT * FROM salaries WHERE id = ?').bind(id).first();
  },

  async update(request: Request, env: Env, id: string) {
    const body = await request.json<Record<string, unknown>>();
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(body)) {
      if (['matricule', 'nom', 'prenom', 'civilite', 'date_naissance', 'date_embauche', 'poste', 'type_contrat', 'statut'].includes(k)) {
        fields.push(`${k} = ?`);
        values.push(v);
      }
    }
    if (fields.length === 0) return { error: 'Aucun champ à modifier' };
    fields.push("updated_at = datetime('now')");
    values.push(id);
    await env.DB.prepare(`UPDATE salaries SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return await env.DB.prepare('SELECT * FROM salaries WHERE id = ?').bind(id).first();
  },
};
