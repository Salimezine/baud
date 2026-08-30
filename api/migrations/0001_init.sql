-- ============================================================
-- BAUD — Schéma D1 initial
-- ============================================================

CREATE TABLE societes (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  matricule_fiscal TEXT,
  activite TEXT,
  sage_code_dossier TEXT,
  sage_debut_exercice TEXT,
  navette_format_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE rubriques (
  id TEXT PRIMARY KEY,
  societe_id TEXT NOT NULL REFERENCES societes(id),
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('rubrique', 'constante')),
  zone TEXT DEFAULT '0',
  navette_aliases TEXT,
  valeur_defaut REAL,
  ordre INTEGER DEFAULT 0,
  actif INTEGER DEFAULT 1,
  UNIQUE(societe_id, code)
);

CREATE TABLE salaries (
  id TEXT PRIMARY KEY,
  societe_id TEXT NOT NULL REFERENCES societes(id),
  matricule TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT,
  civilite TEXT CHECK(civilite IN ('0','1','2')),
  date_naissance TEXT,
  date_embauche TEXT,
  poste TEXT,
  type_contrat TEXT,
  statut TEXT DEFAULT 'actif' CHECK(statut IN ('actif','sorti')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(societe_id, matricule)
);

CREATE TABLE dossiers_paie (
  id TEXT PRIMARY KEY,
  societe_id TEXT NOT NULL REFERENCES societes(id),
  mois INTEGER NOT NULL CHECK(mois BETWEEN 1 AND 12),
  annee INTEGER NOT NULL,
  statut TEXT DEFAULT 'brouillon' CHECK(statut IN (
    'brouillon','extraction','controle','valide','exporte'
  )),
  fichier_navette_r2_key TEXT,
  fichier_navette_nom TEXT,
  extraction_json TEXT,
  extraction_confiance REAL,
  extraction_log TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(societe_id, mois, annee)
);

CREATE TABLE lignes_extraites (
  id TEXT PRIMARY KEY,
  dossier_id TEXT NOT NULL REFERENCES dossiers_paie(id),
  salary_id TEXT REFERENCES salaries(id),
  matricule TEXT,
  nom_prenom TEXT,
  type_ligne TEXT NOT NULL CHECK(type_ligne IN (
    'mouvement','variable','prime','retenue','constante'
  )),
  champs TEXT NOT NULL,
  rubrique_code TEXT,
  zone TEXT,
  valeur REAL,
  source_feuille TEXT,
  source_plage TEXT,
  statut TEXT DEFAULT 'extrait' CHECK(statut IN (
    'extrait','valide','modifie','ignore'
  )),
  confiance REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE imports_ga (
  id TEXT PRIMARY KEY,
  dossier_id TEXT NOT NULL REFERENCES dossiers_paie(id),
  type_import TEXT NOT NULL CHECK(type_import IN ('salaries','variables')),
  fichier_r2_key TEXT,
  nb_lignes INTEGER,
  statut TEXT DEFAULT 'genere' CHECK(statut IN ('genere','telecharge')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE anomalies (
  id TEXT PRIMARY KEY,
  dossier_id TEXT NOT NULL REFERENCES dossiers_paie(id),
  ligne_id TEXT REFERENCES lignes_extraites(id),
  type_anomalie TEXT NOT NULL CHECK(type_anomalie IN (
    'matricule_inconnu','valeur_hors_plage','doublon',
    'champ_manquant','incoherence','format_incorrect'
  )),
  description TEXT NOT NULL,
  severite TEXT DEFAULT 'warning' CHECK(severite IN ('info','warning','error')),
  resolvee INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_salaries_societe ON salaries(societe_id);
CREATE INDEX idx_salaries_matricule ON salaries(societe_id, matricule);
CREATE INDEX idx_dossiers_societe ON dossiers_paie(societe_id);
CREATE INDEX idx_lignes_dossier ON lignes_extraites(dossier_id);
CREATE INDEX idx_lignes_matricule ON lignes_extraites(dossier_id, matricule);
CREATE INDEX idx_rubriques_societe ON rubriques(societe_id);
