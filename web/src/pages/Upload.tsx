import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { Upload as UploadIcon } from 'lucide-react';
import * as XLSX from 'xlsx';

function parseExcelRows(wb: XLSX.WorkBook): any[] {
  const lignes: any[] = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { header: 1, defval: '' });
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      const nonEmpty = row.filter((c: any) => c !== '' && c !== null && c !== undefined);
      if (nonEmpty.length === 0) continue;
      lignes.push({
        source_feuille: name,
        source_ligne: i + 1,
        champs: row.map((c: any) => String(c ?? '')),
      });
    }
  }
  return lignes;
}

export function UploadPage() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [societeId, setSocieteId] = useState('');
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [dossier, setDossier] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    apiClient.societes.list().then(setSocietes).catch(() => {});
  }, []);

  const loadOrCreateDossier = async () => {
    if (!societeId) return;
    setMsg('');
    try {
      const dossiers = await apiClient.dossiers.list(societeId);
      const found = dossiers.find((d: any) => d.mois === mois && d.annee === annee);
      if (found) {
        setDossier(found);
      } else {
        const d = await apiClient.dossiers.create(societeId, { mois, annee });
        setDossier(d);
      }
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const uploadFile = async () => {
    if (!dossier || !file) return;
    setUploading(true);
    setMsg('');
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const lignes = parseExcelRows(wb);
      await apiClient.fichesNavette.upload(dossier.id, file.name, lignes);
      setMsg(`Fichier uploadé — ${lignes.length} lignes extraites`);
      setDossier({ ...dossier, fichier_navette_nom: file.name });
    } catch (e: any) {
      setMsg(e.message);
    }
    setUploading(false);
  };

  const extract = async () => {
    if (!dossier) return;
    setExtracting(true);
    setMsg('Extraction en cours via Claude... (30-60s)');
    try {
      const res = await apiClient.fichesNavette.extract(dossier.id);
      setMsg(`Extraction terminée. Confiance: ${Math.round((res.extraction?.confiance || 0) * 100)}%`);
      setDossier({ ...dossier, statut: 'controle' });
    } catch (e: any) {
      setMsg(e.message);
    }
    setExtracting(false);
  };

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-xl font-semibold">Upload fiche navette</h2>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500">Société</label>
            <select value={societeId} onChange={e => setSocieteId(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm mt-1">
              <option value="">— Choisir —</option>
              {societes.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Mois</label>
            <select value={mois} onChange={e => setMois(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm mt-1">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Année</label>
            <select value={annee} onChange={e => setAnnee(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm mt-1">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <button onClick={loadOrCreateDossier}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          Charger le dossier
        </button>
      </div>

      {dossier && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <p className="text-sm text-gray-600">
            Dossier: {mois}/{annee} — Statut: <span className="font-medium">{dossier.statut}</span>
          </p>

          {dossier.fichier_navette_nom && (
            <p className="text-sm text-green-600">Fichier: {dossier.fichier_navette_nom}</p>
          )}

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Fichier Excel (.xlsx)</label>
              <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm mt-1" />
            </div>
            <button onClick={uploadFile} disabled={!file || uploading}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
              <UploadIcon size={14} />
              {uploading ? 'Upload...' : 'Upload'}
            </button>
          </div>

          <button onClick={extract} disabled={extracting || dossier.statut === 'extraction'}
            className="px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50">
            {extracting ? 'Extraction en cours...' : 'Lancer extraction IA'}
          </button>

          {msg && (
            <p className={`text-sm ${msg.includes('Erreur') || msg.includes('échoué') ? 'text-red-600' : 'text-green-700'}`}>
              {msg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
