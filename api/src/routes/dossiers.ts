import { Env } from '../types';

function genId(): string {
  return crypto.randomUUID();
}

export const routeDossiers = {
  async list(env: Env, societeId: string) {
    const results = await env.DB.prepare(
      'SELECT * FROM dossiers_paie WHERE societe_id = ? ORDER BY annee DESC, mois DESC'
    ).bind(societeId).all();
    return results.results;
  },

  async get(env: Env, id: string) {
    const d = await env.DB.prepare('SELECT * FROM dossiers_paie WHERE id = ?').bind(id).first();
    if (!d) return { error: 'Dossier non trouvé' };

    const lignes = await env.DB.prepare(
      'SELECT COUNT(*) as total, statut FROM lignes_extraites WHERE dossier_id = ? GROUP BY statut'
    ).bind(id).all();

    const anomalies = await env.DB.prepare(
      'SELECT COUNT(*) as total FROM anomalies WHERE dossier_id = ? AND resolvee = 0'
    ).bind(id).first();

    const exports_ = await env.DB.prepare(
      'SELECT * FROM imports_ga WHERE dossier_id = ?'
    ).bind(id).all();

    return {
      ...d,
      stats: {
        lignes: lignes.results,
        anomalies: anomalies?.total || 0,
        exports: exports_.results,
      },
    };
  },

  async create(request: Request, env: Env, societeId: string) {
    const body = await request.json<{ mois: number; annee: number }>();
    const id = genId();

    // Check if already exists
    const existing = await env.DB.prepare(
      'SELECT id FROM dossiers_paie WHERE societe_id = ? AND mois = ? AND annee = ?'
    ).bind(societeId, body.mois, body.annee).first();
    if (existing) return { error: 'Un dossier existe déjà pour ce mois' };

    await env.DB.prepare(
      'INSERT INTO dossiers_paie (id, societe_id, mois, annee) VALUES (?, ?, ?, ?)'
    ).bind(id, societeId, body.mois, body.annee).run();
    return await env.DB.prepare('SELECT * FROM dossiers_paie WHERE id = ?').bind(id).first();
  },
};
