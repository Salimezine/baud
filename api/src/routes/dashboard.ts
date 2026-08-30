import { Env } from '../types';

function genId(): string {
  return crypto.randomUUID();
}

export const routeDashboard = {
  async list(env: Env) {
    const societes = await env.DB.prepare('SELECT COUNT(*) as c FROM societes').first<{ c: number }>();
    const dossiersMois = await env.DB.prepare(
      "SELECT COUNT(*) as c FROM dossiers_paie WHERE mois = CAST(strftime('%m','now') AS INTEGER) AND annee = CAST(strftime('%Y','now') AS INTEGER)"
    ).first<{ c: number }>();
    const anomalies = await env.DB.prepare('SELECT COUNT(*) as c FROM anomalies WHERE resolvee = 0').first<{ c: number }>();
    const dossiers = await env.DB.prepare(
      `SELECT d.*, s.nom as societe_nom FROM dossiers_paie d
       JOIN societes s ON s.id = d.societe_id
       ORDER BY d.annee DESC, d.mois DESC LIMIT 20`
    ).all();

    return {
      stats: {
        societes: societes?.c || 0,
        dossiers_ce_mois: dossiersMois?.c || 0,
        anomalies_ouvertes: anomalies?.c || 0,
      },
      dossiers: dossiers.results,
    };
  },
};
