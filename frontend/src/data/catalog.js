export const CATALOG = [
  ["Carte CAR A/B/C", "Classement réglementaire", "base", "Processus réglementaire Phases 2-3", "opposable", "07/2026"],
  ["Couverture pédologique CES/CEP", "Pédologie", "base", "Capitalisation Phase 1 (CPCS 1967)", "validee", "06/2026"],
  ["Périmètres irrigués — Grande Hydraulique (GH)", "Ressources en eau", "base", "DRA / ORMVA — réseau des aménagements hydro-agricoles", "validee", "06/2026"],
  ["Périmètres irrigués — PMH", "Ressources en eau", "base", "DRA / ORMVA — réseau des aménagements hydro-agricoles", "validee", "06/2026"],
  ["PPP en irrigation", "Ressources en eau", "base", "DIAEA / DRA — conventions PPP", "validee", "05/2026"],
  ["Irrigation privée (forages, puits privés)", "Ressources en eau", "base", "DRA / ABH — autorisations de prélèvement", "validee", "06/2026"],
  ["Forages, puits, points d'eau publics", "Ressources en eau", "base", "ABH / campagnes terrain", "validee", "07/2026"],
  ["Nappes (extension, profondeur, qualité)", "Ressources en eau", "base", "ABH Drâa-Oued Noun", "validee", "05/2026"],
  ["Périmètres PEI (extension de l'irrigation)", "Ressources en eau", "base", "DIAEA / DRA", "validee", "05/2026"],
  ["Projets Pilier I du PMV", "Projets d'investissement", "base", "DRA / ADA", "validee", "06/2026"],
  ["Projets Pilier II du PMV", "Projets d'investissement", "base", "DRA / ADA", "validee", "06/2026"],
  ["Projets MCA", "Projets d'investissement", "base", "APP / MCA Morocco", "validee", "06/2026"],
  ["Projets PMVB (mise en valeur en bour)", "Projets d'investissement", "base", "DRA", "validee", "06/2026"],
  ["Sites d'amélioration pastorale", "Projets d'investissement", "base", "DRA / ANDZOA", "validee", "04/2026"],
  ["Zones pastorales", "Thématiques agricoles", "base", "DRA — loi 113-13", "validee", "04/2026"],
  ["Zones oasiennes", "Thématiques agricoles", "base", "DRA / ANDZOA / terrain", "validee", "04/2026"],
  ["Documents d'urbanisme en vigueur (SDAU, PA, PDAR — délimitations)", "Urbanisme", "base", "Agences Urbaines", "validee", "03/2026"],
  ["Zones RA (à réglementation agricole)", "Urbanisme", "base", "Agences Urbaines / documents homologués", "validee", "03/2026"],
  ["Occupation du sol (OCS)", "Urbanisme / OCS", "base", "Télédétection + vérité terrain", "validee", "07/2026"],
  ["Bâti", "Urbanisme", "base", "Agences Urbaines / télédétection", "validee", "07/2026"],
  ["Titres fonciers (conservation foncière et cadastre)", "Foncier", "base", "ANCFCC", "validee", "05/2026"],
  ["Statuts fonciers (melk, collectif, habous, domanial)", "Foncier", "base", "ANCFCC / DAR / enquêtes", "validee", "05/2026"],
  ["OCS classifiée (Random Forest)", "Dérivée — télédétection", "der", "Sentinel-2 07/2026 → classification RF (généalogie jointe)", "validee", "07/2026"],
  ["NDVI Sentinel-2", "Dérivée — télédétection", "der", "Sentinel-2 07/2026 → calcul d'indice", "validee", "07/2026"],
  ["Érosion et ZPI", "Dérivée — analyse", "der", "MNT + RUSLE (Phase 2)", "validee", "06/2026"],
  ["Scénario AMC « eau renforcée »", "Dérivée — modélisation", "der", "Module AMC/AHP — f.amrani (simulation)", "brouillon", "02/08/2026"],
  ["Forages campagne 2026", "Ressources en eau", "base", "Import terrain m.idrissi", "attente", "01/08/2026"]
];

export const STATLBL = {
  opposable: ['Opposable', 'ok'],
  validee: ['Validée', 'ok'],
  brouillon: ['Brouillon (simulation)', 'gray'],
  attente: ['En attente de validation', 'warn']
};
