import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';

export function ControlePage() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [societeId, setSocieteId] = useState('');
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [dossierId, setDossierId] = useState('');
  const [lignes, setLignes] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => { apiClient.societes.list().then(setSocietes).catch(() => {}); }, []);

  useEffect(() => {
    if (!societeId) return;
    apiClient.dossiers.list(societeId).then(setDossiers).catch(() => {});
  }, [societeId]);

  useEffect(() => {
    if (!dossierId) return;
    apiClient.fichesNavette.lignes(dossierId).then(setLignes).catch(() => {});
    apiClient.dossiers.get(dossierId).then(d => {
      setAnomalies(d?.anomalies_detectees || []);
    }).catch(() => {});
  }, [dossierId]);

  const valider = async () => {
    if (!dossierId) return;
    setMsg('');
    try {
      await apiClient.fichesNavette.valider(dossierId);
      setMsg('Dossier validé ! Prêt pour export.');
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-xl font-semibold">Contrôle des extractions</h2>

      <div className="bg-white border rounded-lg p-4 flex gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500">Société</label>
          <select value={societeId} onChange={e => { setSocieteId(e.target.value); setDossierId(''); setLignes([]); }}
            className="w-full border rounded px-3 py-2 text-sm mt-1">
            <option value="">— Choisir —</option>
            {societes.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Dossier</label>
          <select value={dossierId} onChange={e => setDossierId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm mt-1">
            <option value="">— Choisir —</option>
            {dossiers.map((d: any) => (
              <option key={d.id} value={d.id}>{String(d.mois).padStart(2, '0')}/{d.annee}</option>
            ))}
          </select>
        </div>
        {dossierId && (
          <button onClick={valider}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
            Valider le dossier
          </button>
        )}
      </div>

      {msg && (
        <p className={`text-sm ${msg.includes('Erreur') ? 'text-red-600' : 'text-green-700'}`}>{msg}</p>
      )}

      {anomalies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-700 mb-1">Anomalies détectées ({anomalies.length})</p>
          <ul className="text-sm text-red-600 list-disc list-inside">
            {anomalies.map((a: any, i: number) => <li key={i}>{a.type}: {a.description}</li>)}
          </ul>
        </div>
      )}

      {lignes.length > 0 && (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                <th className="p-2">Matricule</th>
                <th className="p-2">Nom</th>
                <th className="p-2">Type</th>
                <th className="p-2">Rubrique</th>
                <th className="p-2">Zone</th>
                <th className="p-2">Valeur</th>
                <th className="p-2">Confiance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lignes.map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="p-2">{l.matricule || '—'}</td>
                  <td className="p-2">{l.nom_prenom || '—'}</td>
                  <td className="p-2">{l.type_ligne}</td>
                  <td className="p-2 font-mono">{l.rubrique_code || '—'}</td>
                  <td className="p-2">{l.zone || '—'}</td>
                  <td className="p-2">{l.valeur != null ? Number(l.valeur).toLocaleString('fr-TN', { minimumFractionDigits: 3 }) : '—'}</td>
                  <td className="p-2">
                    {l.confiance != null && (
                      <span className={l.confiance >= 0.8 ? 'text-green-600' : l.confiance >= 0.5 ? 'text-orange-500' : 'text-red-600'}>
                        {Math.round(l.confiance * 100)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dossierId && lignes.length === 0 && (
        <p className="text-sm text-gray-400">Aucune ligne extraite pour ce dossier</p>
      )}
    </div>
  );
}
