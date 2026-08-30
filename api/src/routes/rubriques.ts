import { Env } from '../types';

function genId(): string {
  return crypto.randomUUID();
}

export const routeRubriques = {
  async list(env: Env, societeId: string) {
    const results = await env.DB.prepare(
      'SELECT * FROM rubriques WHERE societe_id = ? AND actif = 1 ORDER BY ordre, code'
    ).bind(societeId).all();
    return results.results;
  },

  async upsert(request: Request, env: Env, societeId: string) {
    const body = await request.json<{
      code: string; libelle: string; type: 'rubrique' | 'constante';
      zone?: string; navette_aliases?: string[]; valeur_defaut?: number;
    }>();

    // Check if exists
    const existing = await env.DB.prepare(
      'SELECT id FROM rubriques WHERE societe_id = ? AND code = ?'
    ).bind(societeId, body.code).first();

    if (existing) {
      await env.DB.prepare(
        `UPDATE rubriques SET libelle = ?, type = ?, zone = ?, navette_aliases = ?, valeur_defaut = ?
         WHERE id = ?`
      ).bind(body.libelle, body.type, body.zone || '0',
        body.navette_aliases ? JSON.stringify(body.navette_aliases) : null,
        body.valeur_defaut || null, existing.id).run();
      return await env.DB.prepare('SELECT * FROM rubriques WHERE id = ?').bind(existing.id).first();
    }

    const id = genId();
    await env.DB.prepare(
      `INSERT INTO rubriques (id, societe_id, code, libelle, type, zone, navette_aliases, valeur_defaut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, societeId, body.code, body.libelle, body.type, body.zone || '0',
      body.navette_aliases ? JSON.stringify(body.navette_aliases) : null,
      body.valeur_defaut || null
    ).run();
    return await env.DB.prepare('SELECT * FROM rubriques WHERE id = ?').bind(id).first();
  },
};
