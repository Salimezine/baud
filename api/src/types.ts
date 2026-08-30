export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  CLAUDE_API_KEY?: string;
}

export interface Societe {
  id: string;
  nom: string;
  matricule_fiscal: string | null;
  activite: string | null;
  sage_code_dossier: string | null;
  sage_debut_exercice: string | null;
  navette_format_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rubrique {
  id: string;
  societe_id: string;
  code: string;
  libelle: string;
  type: 'rubrique' | 'constante';
  zone: string;
  navette_aliases: string | null;
  valeur_defaut: number | null;
  ordre: number;
  actif: number;
}

export interface Salary {
  id: string;
  societe_id: string;
  matricule: string;
  nom: string;
  prenom: string | null;
  civilite: '0' | '1' | '2' | null;
  date_naissance: string | null;
  date_embauche: string | null;
  poste: string | null;
  type_contrat: string | null;
  statut: 'actif' | 'sorti';
}

export interface DossierPaie {
  id: string;
  societe_id: string;
  mois: number;
  annee: number;
  statut: 'brouillon' | 'extraction' | 'controle' | 'valide' | 'exporte';
  fichier_navette_r2_key: string | null;
  fichier_navette_nom: string | null;
  extraction_json: string | null;
  extraction_confiance: number | null;
  extraction_log: string | null;
}

export interface LigneExtraite {
  id: string;
  dossier_id: string;
  salary_id: string | null;
  matricule: string | null;
  nom_prenom: string | null;
  type_ligne: 'mouvement' | 'variable' | 'prime' | 'retenue' | 'constante';
  champs: string;
  rubrique_code: string | null;
  zone: string | null;
  valeur: number | null;
  source_feuille: string | null;
  source_plage: string | null;
  statut: 'extrait' | 'valide' | 'modifie' | 'ignore';
  confiance: number | null;
}

export interface ImportsGa {
  id: string;
  dossier_id: string;
  type_import: 'salaries' | 'variables';
  fichier_r2_key: string | null;
  nb_lignes: number | null;
  statut: 'genere' | 'telecharge';
}

export interface Anomalie {
  id: string;
  dossier_id: string;
  ligne_id: string | null;
  type_anomalie: string;
  description: string;
  severite: 'info' | 'warning' | 'error';
  resolvee: number;
}
