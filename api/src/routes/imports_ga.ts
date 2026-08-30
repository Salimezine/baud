import * as XLSX from 'xlsx';
import { Env } from '../types';

function genId(): string {
  return crypto.randomUUID();
}

export const routeImportsGa = {
  async generate(env: Env, dossierId: string) {
    const dossier = await env.DB.prepare('SELECT * FROM dossiers_paie WHERE id = ?').bind(dossierId).first() as any;
    if (!dossier) return { error: 'Dossier non trouvé' };
    if (dossier.statut !== 'valide') return { error: 'Le dossier doit être validé avant export' };

    const societe = await env.DB.prepare('SELECT * FROM societes WHERE id = ?').bind(dossier.societe_id).first() as any;
    if (!societe) return { error: 'Société non trouvée' };

    const lignes = await env.DB.prepare(
      "SELECT * FROM lignes_extraites WHERE dossier_id = ? AND statut != 'ignore'"
    ).bind(dossierId).all();

    const results: any[] = [];
    const mois = String(dossier.mois).padStart(2, '0');

    // === FICHIER 1: Import Salariés ===
    const lignesSalaries = (lignes.results as any[]).filter(l => l.type_ligne === 'mouvement');
    if (lignesSalaries.length > 0) {
      const data: any[][] = [['Matricule', 'Nom', 'Prénom', 'Civilité', 'Date de naissance', 'Date d\'embauche', 'Poste', 'Type de contrat']];
      for (const l of lignesSalaries) {
        const champs = JSON.parse(l.champs || '{}');
        data.push([l.matricule, champs.nom || '', champs.prenom || '', champs.civilite || '', champs.date_naissance || '', champs.date_embauche || '', champs.poste || '', champs.type_contrat || '']);
      }
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Salariés');
      const xlsxBase64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      const id = genId();
      await env.DB.prepare(
        'INSERT INTO imports_ga (id, dossier_id, type_import, fichier_r2_key, nb_lignes) VALUES (?, ?, ?, ?, ?)'
      ).bind(id, dossierId, 'salaries', `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${xlsxBase64}`, lignesSalaries.length).run();
      results.push({ type: 'salaries', nb_lignes: lignesSalaries.length, base64: xlsxBase64 });
    }

    // === FICHIER 2: Import Variables de Paie ===
    const lignesVariables = (lignes.results as any[]).filter(l => ['variable', 'prime', 'retenue', 'constante'].includes(l.type_ligne));
    if (lignesVariables.length > 0) {
      const data: any[][] = [['Matricule', 'Rubrique ou Constante', 'Zone', 'Valeur']];
      for (const l of lignesVariables) {
        const zone = l.zone || '0';
        data.push([l.matricule, zone === '255' ? (l.rubrique_code || '').toUpperCase() : (l.rubrique_code || ''), zone, l.valeur || 0]);
      }
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Variables');
      const xlsxBase64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      const id = genId();
      await env.DB.prepare(
        'INSERT INTO imports_ga (id, dossier_id, type_import, fichier_r2_key, nb_lignes) VALUES (?, ?, ?, ?, ?)'
      ).bind(id, dossierId, 'variables', `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${xlsxBase64}`, lignesVariables.length).run();
      results.push({ type: 'variables', nb_lignes: lignesVariables.length, base64: xlsxBase64 });
    }

    await env.DB.prepare(
      "UPDATE dossiers_paie SET statut = 'exporte', updated_at = datetime('now') WHERE id = ?"
    ).bind(dossierId).run();

    return { ok: true, exports: results };
  },

  async list(env: Env, dossierId: string) {
    const results = await env.DB.prepare(
      'SELECT * FROM imports_ga WHERE dossier_id = ? ORDER BY created_at DESC'
    ).bind(dossierId).all();
    return results.results;
  },

  async download(env: Env, exportId: string) {
    const exp = await env.DB.prepare('SELECT * FROM imports_ga WHERE id = ?').bind(exportId).first() as any;
    if (!exp || !exp.fichier_r2_key) return new Response('Not found', { status: 404 });

    // If it's a data URL, extract base64 and decode
    if (exp.fichier_r2_key.startsWith('data:')) {
      const base64 = exp.fichier_r2_key.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      return new Response(bytes, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="export_${exp.type_import}.xlsx"`,
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response('File not available', { status: 404 });
  },
};
