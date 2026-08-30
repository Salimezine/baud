import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';

export function SocietePage() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [rubriques, setRubriques] = useState<any[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [nom, setNom] = useState('');
  const [activite, setActivite] = useState('');

  useEffect(() => {
    apiClient.societes.list().then(setSocietes).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    apiClient.salaries.list(selectedId).then(setSalaries).catch(() => {});
    apiClient.rubriques.list(selectedId).then(setRubriques).catch(() => {});
  }, [selectedId]);

  const createSociete = async () => {
    if (!nom.trim()) return;
    const s = await apiClient.societes.create({ nom: nom.trim(), activite: activite.trim() || undefined });
    setSocietes([...societes, s]);
    setNom(''); setActivite(''); setShowNewForm(false);
  };

  const selected = societes.find(s => s.id === selectedId);

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sociétés</h2>
        <button onClick={() => setShowNewForm(!showNewForm)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          + Nouvelle
        </button>
      </div>

      {showNewForm && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <input placeholder="Nom de la société" value={nom} onChange={e => setNom(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm" />
          <input placeholder="Activité (optionnel)" value={activite} onChange={e => setActivite(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm" />
          <button onClick={createSociete}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
            Créer
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1 bg-white border rounded-lg p-3 space-y-1">
          <p className="text-xs text-gray-500 mb-2">Liste</p>
          {societes.map(s => (
            <button key={s.id} onClick={() => setSelectedId(s.id)}
              className={`block w-full text-left px-3 py-2 rounded text-sm
                ${selectedId === s.id ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}>
              {s.nom}
            </button>
          ))}
        </div>

        <div className="col-span-3 space-y-4">
          {selected && (
            <>
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-2">{selected.nom}</h3>
                <p className="text-sm text-gray-500">Activité: {selected.activite || '—'}</p>
                <p className="text-sm text-gray-500">MF: {selected.matricule_fiscal || '—'}</p>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Salariés ({salaries.length})</h4>
                {salaries.length === 0 && <p className="text-xs text-gray-400">Aucun salarié enregistré</p>}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="py-1">Matricule</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {salaries.map((s: any) => (
                      <tr key={s.id}>
                        <td className="py-1">{s.matricule}</td>
                        <td>{s.nom}</td>
                        <td>{s.prenom || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Rubriques ({rubriques.length})</h4>
                {rubriques.length === 0 && <p className="text-xs text-gray-400">Aucune rubrique configurée</p>}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="py-1">Code</th>
                      <th>Libellé</th>
                      <th>Type</th>
                      <th>Zone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rubriques.map((r: any) => (
                      <tr key={r.id}>
                        <td className="py-1 font-mono">{r.code}</td>
                        <td>{r.libelle}</td>
                        <td>{r.type}</td>
                        <td>{r.zone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {!selected && (
            <div className="bg-white border rounded-lg p-8 text-center text-gray-400 text-sm">
              Sélectionnez une société
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
