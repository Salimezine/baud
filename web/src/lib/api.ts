const API_BASE = import.meta.env.VITE_API_URL || 'https://baud-api.ezzinesalim21.workers.dev';

async function api<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  return res.json();
}

export const apiClient = {
  societes: {
    list: () => api('/api/societes'),
    get: (id: string) => api(`/api/societes/${id}`),
    create: (data: { nom: string; matricule_fiscal?: string; activite?: string }) =>
      api('/api/societes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      api(`/api/societes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => api(`/api/societes/${id}`, { method: 'DELETE' }),
  },

  salaries: {
    list: (societeId: string) => api(`/api/societes/${societeId}/salaries`),
    create: (societeId: string, data: any) =>
      api(`/api/societes/${societeId}/salaries`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      api(`/api/salaries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  rubriques: {
    list: (societeId: string) => api(`/api/societes/${societeId}/rubriques`),
    upsert: (societeId: string, data: any) =>
      api(`/api/societes/${societeId}/rubriques`, { method: 'POST', body: JSON.stringify(data) }),
  },

  dossiers: {
    list: (societeId: string) => api(`/api/societes/${societeId}/dossiers`),
    get: (id: string) => api(`/api/dossiers/${id}`),
    create: (societeId: string, data: { mois: number; annee: number }) =>
      api(`/api/societes/${societeId}/dossiers`, { method: 'POST', body: JSON.stringify(data) }),
  },

  fichesNavette: {
    upload: (dossierId: string, filename: string, lignes: any[]) =>
      api(`/api/dossiers/${dossierId}/upload`, { method: 'POST', body: JSON.stringify({ filename, lignes }) }),
    extract: (dossierId: string) => api(`/api/dossiers/${dossierId}/extract`, { method: 'POST' }),
    lignes: (dossierId: string) => api(`/api/dossiers/${dossierId}/lignes`),
    updateLigne: (ligneId: string, data: any) =>
      api(`/api/lignes/${ligneId}`, { method: 'PUT', body: JSON.stringify(data) }),
    valider: (dossierId: string) => api(`/api/dossiers/${dossierId}/valider`, { method: 'POST' }),
  },

  importsGa: {
    generate: (dossierId: string) => api(`/api/dossiers/${dossierId}/export`, { method: 'POST' }),
    list: (dossierId: string) => api(`/api/dossiers/${dossierId}/exports`),
    download: async (exportId: string) => {
      const res = await fetch(`${API_BASE}/api/exports/${exportId}/download`);
      if (!res.ok) throw new Error('Download failed');
      return res.blob();
    },
  },
};
