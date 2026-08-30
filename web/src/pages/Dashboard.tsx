import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';

export function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.societes.list().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500 mt-8">Chargement...</p>;

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold">Tableau de bord</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Sociétés</p>
          <p className="text-3xl font-bold text-blue-600">{Array.isArray(data) ? data.length : 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Statut</p>
          <p className="text-lg font-medium text-green-600">Prêt</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Version</p>
          <p className="text-lg font-medium">0.1.0</p>
        </div>
      </div>

      {Array.isArray(data) && data.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium mb-2">Sociétés enregistrées</h3>
          <div className="divide-y">
            {data.map((s: any) => (
              <div key={s.id} className="flex justify-between py-2 text-sm">
                <span className="font-medium">{s.nom}</span>
                <span className="text-gray-400">{s.activite || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
