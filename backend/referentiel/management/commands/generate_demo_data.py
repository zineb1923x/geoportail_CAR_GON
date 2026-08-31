"""
Commande Django : generate_demo_data
Génère un jeu de données de démonstration réaliste pour le Géoportail CAR-GON.

Données générées (dans l'ordre de dépendance) :
  1. Utilisateurs (admin, éditeur, décideur, consultation)
  2. Provinces & Communes (Guelmim-Oued Noun réelles)
  3. Catalogue de couches (CoucheCatalogue + MetadonneeISO)
  4. Règles de classement (forçage/exclusion)
  5. Scénario AMC « Référence » avec ses UCA et classes A/B/C
  6. Entrées d'audit

Les géométries sont des approximations réalistes en EPSG:26192 (Merchich/Sud Maroc)
basées sur les coordonnées réelles de la région Guelmim-Oued Noun.

Usage :
    python manage.py generate_demo_data
    python manage.py generate_demo_data --flush  # supprime les données existantes d'abord
"""

import random
import math
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import (
    GEOSGeometry, MultiPolygon, Polygon, Point, MultiLineString, LineString, MultiPoint
)
from django.utils import timezone


# Coordonnées Lambert Maroc Zone Sud (EPSG:26192) approximatives pour la région GON
# Conversion approx: lon=-10° lat=29° → X≈445000, Y≈310000
# Facteur approx: 1° longitude ≈ 97km ≈ 97000m, 1° latitude ≈ 111km ≈ 111000m
LON_REF, LAT_REF = -10.0, 29.0
X_REF, Y_REF = 445000, 310000

def lonlat_to_lambert(lon, lat):
    """Conversion approximative WGS84 → Lambert Maroc Sud (EPSG:26192)."""
    x = X_REF + (lon - LON_REF) * 97000
    y = Y_REF + (lat - LAT_REF) * 111000
    return x, y

def make_polygon(center_lon, center_lat, size_km=5, irregular=True):
    """Crée un polygone en Lambert autour d'un centre WGS84."""
    cx, cy = lonlat_to_lambert(center_lon, center_lat)
    r = size_km * 500  # rayon en mètres (demi-côté)
    if irregular:
        n = random.randint(5, 8)
        angles = sorted([random.uniform(0, 2 * math.pi) for _ in range(n)])
        coords = []
        for a in angles:
            rr = r * random.uniform(0.7, 1.3)
            coords.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
        coords.append(coords[0])
    else:
        # Carré simple
        coords = [
            (cx - r, cy - r), (cx + r, cy - r),
            (cx + r, cy + r), (cx - r, cy + r),
            (cx - r, cy - r),
        ]
    return MultiPolygon(Polygon(coords, srid=26192), srid=26192)

def make_point(lon, lat):
    """Crée un point Lambert à partir de WGS84."""
    x, y = lonlat_to_lambert(lon, lat)
    return Point(x, y, srid=26192)

def make_line(points_lonlat):
    """Crée une ligne Lambert à partir de coordonnées WGS84."""
    coords = [lonlat_to_lambert(lon, lat) for lon, lat in points_lonlat]
    return MultiLineString(LineString(coords, srid=26192), srid=26192)


# ─── Données de référence réelles pour la région GON ─────────────────────────

PROVINCES_DATA = [
    {"code": "GON-GLM", "nom": "Guelmim", "nom_ar": "كلميم", "chef_lieu": "Guelmim",
     "pop": 178100, "sup": 10680, "center": (-10.06, 28.98), "size": 50},
    {"code": "GON-SIF", "nom": "Sidi Ifni", "nom_ar": "سيدي إفني", "chef_lieu": "Sidi Ifni",
     "pop": 113500, "sup": 3200, "center": (-10.17, 29.38), "size": 30},
    {"code": "GON-TNT", "nom": "Tan-Tan", "nom_ar": "طان طان", "chef_lieu": "Tan-Tan",
     "pop": 83500, "sup": 17295, "center": (-11.09, 28.44), "size": 60},
    {"code": "GON-ASZ", "nom": "Assa-Zag", "nom_ar": "أسا الزاگ", "chef_lieu": "Assa",
     "pop": 48500, "sup": 19773, "center": (-9.43, 28.40), "size": 70},
]

COMMUNES_DATA = [
    # Province Guelmim
    {"code": "GLM-001", "nom": "Guelmim", "nom_ar": "كلميم", "province": "GON-GLM",
     "type": "urbaine", "pop": 118218, "sup": 124.0, "center": (-10.06, 28.98)},
    {"code": "GLM-002", "nom": "Asrir", "nom_ar": "أسرير", "province": "GON-GLM",
     "type": "rurale", "pop": 6200, "sup": 380.0, "center": (-9.95, 28.93)},
    {"code": "GLM-003", "nom": "Tighmert", "nom_ar": "تغمرت", "province": "GON-GLM",
     "type": "rurale", "pop": 3800, "sup": 210.0, "center": (-9.93, 28.95)},
    {"code": "GLM-004", "nom": "Fask", "nom_ar": "فاسك", "province": "GON-GLM",
     "type": "rurale", "pop": 4100, "sup": 320.0, "center": (-9.75, 28.91)},
    {"code": "GLM-005", "nom": "Abaynou", "nom_ar": "أباينو", "province": "GON-GLM",
     "type": "rurale", "pop": 3200, "sup": 280.0, "center": (-10.15, 29.08)},
    {"code": "GLM-006", "nom": "Bouizakarne", "nom_ar": "بويزكارن", "province": "GON-GLM",
     "type": "urbaine", "pop": 19400, "sup": 152.0, "center": (-9.72, 29.18)},
    {"code": "GLM-007", "nom": "Taghjijt", "nom_ar": "تغجيجت", "province": "GON-GLM",
     "type": "rurale", "pop": 5300, "sup": 430.0, "center": (-9.38, 29.03)},
    {"code": "GLM-008", "nom": "Ifrane Anti-Atlas", "nom_ar": "إفران الأطلس الصغير", "province": "GON-GLM",
     "type": "rurale", "pop": 7800, "sup": 520.0, "center": (-9.58, 29.10)},
    # Province Sidi Ifni
    {"code": "SIF-001", "nom": "Sidi Ifni", "nom_ar": "سيدي إفني", "province": "GON-SIF",
     "type": "urbaine", "pop": 22900, "sup": 62.0, "center": (-10.17, 29.38)},
    {"code": "SIF-002", "nom": "Mirleft", "nom_ar": "مير اللفت", "province": "GON-SIF",
     "type": "rurale", "pop": 11200, "sup": 185.0, "center": (-10.03, 29.58)},
    {"code": "SIF-003", "nom": "Lakhsas", "nom_ar": "لخصاص", "province": "GON-SIF",
     "type": "rurale", "pop": 14800, "sup": 340.0, "center": (-9.75, 29.42)},
    # Province Tan-Tan
    {"code": "TNT-001", "nom": "Tan-Tan", "nom_ar": "طانطان", "province": "GON-TNT",
     "type": "urbaine", "pop": 60900, "sup": 280.0, "center": (-11.09, 28.44)},
    {"code": "TNT-002", "nom": "El Ouatia", "nom_ar": "الوطية", "province": "GON-TNT",
     "type": "urbaine", "pop": 14200, "sup": 45.0, "center": (-11.32, 28.48)},
    # Province Assa-Zag
    {"code": "ASZ-001", "nom": "Assa", "nom_ar": "أسا", "province": "GON-ASZ",
     "type": "rurale", "pop": 12600, "sup": 890.0, "center": (-9.42, 28.60)},
    {"code": "ASZ-002", "nom": "Zag", "nom_ar": "الزاگ", "province": "GON-ASZ",
     "type": "rurale", "pop": 8200, "sup": 1200.0, "center": (-9.28, 28.01)},
]

# Catalogue de couches conforme au TDR chapitre 4
COUCHES_CATALOGUE = [
    # Limites administratives
    {"tech": "admin_communes_2024", "aff": "Communes", "th": "communes", "geom": "multi_polygone",
     "domaine": "Limites administratives", "sous_domaine": "Découpage", "source": "HCP / RGPH 2024",
     "statut": "opposable", "millesime": 2024},
    {"tech": "admin_provinces_2024", "aff": "Provinces", "th": "provinces", "geom": "multi_polygone",
     "domaine": "Limites administratives", "sous_domaine": "Découpage", "source": "HCP / RGPH 2024",
     "statut": "opposable", "millesime": 2024},
    # Classement CAR
    {"tech": "car_classe_a_2026", "aff": "Carte CAR — Classe A", "th": "car_a", "geom": "multi_polygone",
     "domaine": "Classement réglementaire", "sous_domaine": "CAR A/B/C", "source": "Processus réglementaire Phase 2-3",
     "statut": "opposable", "millesime": 2026},
    {"tech": "car_classe_b_2026", "aff": "Carte CAR — Classe B", "th": "car_b", "geom": "multi_polygone",
     "domaine": "Classement réglementaire", "sous_domaine": "CAR A/B/C", "source": "Processus réglementaire Phase 2-3",
     "statut": "opposable", "millesime": 2026},
    {"tech": "car_classe_c_2026", "aff": "Carte CAR — Classe C", "th": "car_c", "geom": "multi_polygone",
     "domaine": "Classement réglementaire", "sous_domaine": "CAR A/B/C", "source": "Processus réglementaire Phase 2-3",
     "statut": "opposable", "millesime": 2026},
    # Ressources en eau
    {"tech": "eau_gh_perimetres_2026", "aff": "Périmètres irrigués — Grande Hydraulique (GH)", "th": "gh",
     "geom": "multi_polygone", "domaine": "Ressources en eau", "sous_domaine": "Périmètres irrigués",
     "source": "DRA / ORMVA", "statut": "validee", "millesime": 2026},
    {"tech": "eau_pmh_perimetres_2026", "aff": "Périmètres irrigués — PMH", "th": "pmh",
     "geom": "multi_polygone", "domaine": "Ressources en eau", "sous_domaine": "Périmètres irrigués",
     "source": "DRA / ORMVA", "statut": "validee", "millesime": 2026, "forcage": "A"},
    {"tech": "eau_ppp_irrigation_2026", "aff": "PPP en irrigation", "th": "ppp",
     "geom": "multi_polygone", "domaine": "Ressources en eau", "sous_domaine": "Périmètres irrigués",
     "source": "DIAEA / DRA", "statut": "validee", "millesime": 2026},
    {"tech": "eau_forage_points_2026", "aff": "Forages, puits, points d'eau publics", "th": "eau_forage",
     "geom": "point", "domaine": "Ressources en eau", "sous_domaine": "Points d'eau",
     "source": "ABH / campagnes terrain", "statut": "validee", "millesime": 2026},
    {"tech": "eau_nappes_2026", "aff": "Nappes (extension, profondeur, qualité)", "th": "nappes",
     "geom": "multi_polygone", "domaine": "Ressources en eau", "sous_domaine": "Eaux souterraines",
     "source": "ABH Drâa-Oued Noun", "statut": "validee", "millesime": 2026},
    {"tech": "eau_pei_perimetres_2025", "aff": "Périmètres PEI", "th": "pei",
     "geom": "multi_polygone", "domaine": "Ressources en eau", "sous_domaine": "Extension irrigation",
     "source": "DIAEA / DRA", "statut": "validee", "millesime": 2025},
    {"tech": "eau_oued_reseau_2026", "aff": "Réseau hydrographique (Oueds)", "th": "oued",
     "geom": "ligne", "domaine": "Ressources en eau", "sous_domaine": "Hydrographie",
     "source": "ABH / IGN", "statut": "validee", "millesime": 2026},
    # Projets d'investissement
    {"tech": "proj_pilier1_pmv_2026", "aff": "Projets Pilier I du PMV", "th": "proj_p1",
     "geom": "multi_polygone", "domaine": "Projets d'investissement", "sous_domaine": "Pilier I",
     "source": "DRA / ADA", "statut": "validee", "millesime": 2026},
    {"tech": "proj_pilier2_pmv_2026", "aff": "Projets Pilier II du PMV", "th": "proj_p2",
     "geom": "multi_polygone", "domaine": "Projets d'investissement", "sous_domaine": "Pilier II",
     "source": "DRA / ADA", "statut": "validee", "millesime": 2026},
    {"tech": "proj_mca_2026", "aff": "Projets MCA", "th": "proj_mca",
     "geom": "multi_polygone", "domaine": "Projets d'investissement", "sous_domaine": "MCA",
     "source": "APP / MCA Morocco", "statut": "validee", "millesime": 2026},
    # Pédologie & sols
    {"tech": "sols_unite_pedologique_2026", "aff": "Couverture pédologique CES/CEP", "th": "sols",
     "geom": "multi_polygone", "domaine": "Géopédologie", "sous_domaine": "Unités pédologiques",
     "source": "Capitalisation Phase 1 (CPCS 1967)", "statut": "validee", "millesime": 2026},
    # Pastoral & oasien
    {"tech": "past_zones_pastorales_2026", "aff": "Zones pastorales", "th": "past",
     "geom": "multi_polygone", "domaine": "Thématiques agricoles", "sous_domaine": "Zones pastorales",
     "source": "DRA — loi 113-13", "statut": "validee", "millesime": 2026},
    {"tech": "oasis_zones_oasiennes_2026", "aff": "Zones oasiennes", "th": "oasis",
     "geom": "multi_polygone", "domaine": "Thématiques agricoles", "sous_domaine": "Zones oasiennes",
     "source": "DRA / ANDZOA / terrain", "statut": "validee", "millesime": 2026},
    # Urbanisme
    {"tech": "urb_documents_2026", "aff": "Documents d'urbanisme en vigueur (SDAU, PA, PDAR)", "th": "urb",
     "geom": "multi_polygone", "domaine": "Urbanisme", "sous_domaine": "Documents d'urbanisme",
     "source": "Agences Urbaines", "statut": "validee", "millesime": 2026, "exclusion": True},
    {"tech": "urb_zones_ra_2026", "aff": "Zones RA (à réglementation agricole)", "th": "ra",
     "geom": "multi_polygone", "domaine": "Urbanisme", "sous_domaine": "Zones RA",
     "source": "Agences Urbaines / documents homologués", "statut": "validee", "millesime": 2026},
    {"tech": "urb_ocs_2026", "aff": "Occupation du sol (OCS)", "th": "ocs",
     "geom": "multi_polygone", "domaine": "Urbanisme / OCS", "sous_domaine": "OCS",
     "source": "Télédétection + vérité terrain", "statut": "validee", "millesime": 2026},
    {"tech": "urb_bati_2026", "aff": "Bâti", "th": "bati",
     "geom": "multi_polygone", "domaine": "Urbanisme", "sous_domaine": "Bâti",
     "source": "Agences Urbaines / télédétection", "statut": "validee", "millesime": 2026},
    # Foncier
    {"tech": "foncier_titres_2026", "aff": "Titres fonciers", "th": "tf",
     "geom": "multi_polygone", "domaine": "Foncier", "sous_domaine": "Conservation foncière",
     "source": "ANCFCC", "statut": "validee", "millesime": 2026},
    {"tech": "foncier_melk_2026", "aff": "Statut foncier — Melk", "th": "stat_melk",
     "geom": "multi_polygone", "domaine": "Foncier", "sous_domaine": "Statuts fonciers",
     "source": "ANCFCC / DAR / enquêtes", "statut": "validee", "millesime": 2026},
    {"tech": "foncier_collectif_2026", "aff": "Statut foncier — Collectif", "th": "stat_coll",
     "geom": "multi_polygone", "domaine": "Foncier", "sous_domaine": "Statuts fonciers",
     "source": "ANCFCC / DAR / enquêtes", "statut": "validee", "millesime": 2026},
]

# UCA : données réalistes pour les parcelles agricoles
UCA_COMMUNE_DATA = {
    "GLM-001": {"prefix": "UCA_10", "count": 15, "center": (-10.06, 28.98)},
    "GLM-002": {"prefix": "UCA_11", "count": 10, "center": (-9.95, 28.93)},
    "GLM-003": {"prefix": "UCA_12", "count": 8,  "center": (-9.93, 28.95)},
    "GLM-004": {"prefix": "UCA_13", "count": 8,  "center": (-9.75, 28.91)},
    "GLM-005": {"prefix": "UCA_14", "count": 6,  "center": (-10.15, 29.08)},
    "GLM-006": {"prefix": "UCA_15", "count": 10, "center": (-9.72, 29.18)},
    "GLM-007": {"prefix": "UCA_16", "count": 6,  "center": (-9.38, 29.03)},
    "GLM-008": {"prefix": "UCA_17", "count": 5,  "center": (-9.58, 29.10)},
    "SIF-001": {"prefix": "UCA_20", "count": 6,  "center": (-10.17, 29.38)},
    "SIF-002": {"prefix": "UCA_21", "count": 5,  "center": (-10.03, 29.58)},
    "TNT-001": {"prefix": "UCA_30", "count": 5,  "center": (-11.09, 28.44)},
    "ASZ-001": {"prefix": "UCA_40", "count": 5,  "center": (-9.42, 28.60)},
}

FACTEURS_LIMITANTS = [
    "Salinité élevée", "Déficit hydrique", "Pente excessive",
    "Érosion hydrique", "Sols squelettiques", "Engorgement saisonnier",
    "Croûte calcaire", "Aucun facteur limitant", "Cailloutis de surface",
    "Profondeur insuffisante",
]

GROUPES_SOL = [
    "Sols minéraux bruts", "Sols peu évolués d'apport alluvial",
    "Sols isohumiques châtains", "Sols calcimagnésiques",
    "Vertisols", "Sols fersiallitiques", "Sols halomorphes",
    "Sols hydromorphes",
]

RISQUES = [
    "Risque érosif fort", "Risque de salinisation", "Risque d'inondation",
    "Risque de désertification", "Risque modéré", "Risque faible",
]


class Command(BaseCommand):
    help = "Génère un jeu de données de démonstration réaliste pour le Géoportail CAR-GON."

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush', action='store_true',
            help='Supprime les données existantes avant de générer',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n═══ Génération des données de démonstration ═══\n"))

        if options['flush']:
            self._flush()

        users = self._create_users()
        provinces = self._create_provinces()
        communes = self._create_communes(provinces)
        couches = self._create_catalogue(users)
        self._create_regles_classement(couches, users)
        scenario = self._create_scenario_amc(users, communes)
        self._create_audit_entries(users)

        self.stdout.write(self.style.SUCCESS("\n✅ Toutes les données de démonstration ont été créées avec succès !\n"))

    def _flush(self):
        self.stdout.write("🗑️  Suppression des données existantes...")
        from classement.models import ClasseA, ClasseB, ClasseC, UniteCarteAgricole, ScenarioAMC, RegleClassement
        from referentiel.models import CoucheCatalogue, MetadonneeISO, Genealogie, VersionCouche, DomaineValeur
        from administration.models import Province, Commune
        from audit.models import AuditLog
        from users.models import CustomUser

        for M in [ClasseA, ClasseB, ClasseC, UniteCarteAgricole, ScenarioAMC, RegleClassement,
                  MetadonneeISO, Genealogie, VersionCouche, CoucheCatalogue, DomaineValeur,
                  AuditLog, Commune, Province]:
            M.objects.all().delete()
        CustomUser.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.SUCCESS("   Données supprimées."))

    # ──────────────────────────────────────────────────────────────────────
    # 1. Utilisateurs
    # ──────────────────────────────────────────────────────────────────────
    def _create_users(self):
        self.stdout.write("👤 Création des utilisateurs...")
        from users.models import CustomUser

        users_data = [
            {"username": "admin_sig", "email": "admin@dra-gon.ma", "role": "admin",
             "first_name": "Fatima", "last_name": "El Amrani", "pwd": "admin123"},
            {"username": "editeur1", "email": "editeur@dra-gon.ma", "role": "editeur",
             "first_name": "Mohammed", "last_name": "Idrissi", "pwd": "editeur123"},
            {"username": "editeur2", "email": "editeur2@dra-gon.ma", "role": "editeur",
             "first_name": "Khadija", "last_name": "Benali", "pwd": "editeur123"},
            {"username": "decideur1", "email": "decideur@dra-gon.ma", "role": "decideur",
             "first_name": "Ahmed", "last_name": "Naciri", "pwd": "decideur123"},
            {"username": "consult1", "email": "consult@dra-gon.ma", "role": "consultation",
             "first_name": "Zineb", "last_name": "Tazi", "pwd": "consult123"},
        ]
        users = {}
        for u in users_data:
            obj, created = CustomUser.objects.get_or_create(
                username=u["username"],
                defaults={
                    "email": u["email"], "role": u["role"],
                    "first_name": u["first_name"], "last_name": u["last_name"],
                }
            )
            if created:
                obj.set_password(u["pwd"])
                if u["role"] == "admin":
                    obj.is_staff = True
                obj.save()
            users[u["username"]] = obj
        self.stdout.write(self.style.SUCCESS(f"   {len(users)} utilisateurs créés/vérifiés."))
        return users

    # ──────────────────────────────────────────────────────────────────────
    # 2. Provinces & Communes
    # ──────────────────────────────────────────────────────────────────────
    def _create_provinces(self):
        self.stdout.write("🗺️  Création des provinces...")
        from administration.models import Province

        provinces = {}
        for p in PROVINCES_DATA:
            geom = make_polygon(p["center"][0], p["center"][1], size_km=p["size"], irregular=True)
            obj, _ = Province.objects.update_or_create(
                code_province=p["code"],
                defaults={
                    "nom_province": p["nom"], "nom_province_ar": p["nom_ar"],
                    "chef_lieu": p["chef_lieu"], "population": p["pop"],
                    "annee_recensement": 2024, "superficie_km2": p["sup"],
                    "geom": geom, "source": "HCP / RGPH 2024", "millesime": 2024,
                    "statut_cycle_vie": "opposable",
                }
            )
            provinces[p["code"]] = obj
        self.stdout.write(self.style.SUCCESS(f"   {len(provinces)} provinces créées."))
        return provinces

    def _create_communes(self, provinces):
        self.stdout.write("🏘️  Création des communes...")
        from administration.models import Commune

        communes = {}
        for c in COMMUNES_DATA:
            size = math.sqrt(c["sup"]) * 0.5  # taille proportionnelle à la superficie
            geom = make_polygon(c["center"][0], c["center"][1], size_km=max(3, min(size, 25)), irregular=True)
            obj, _ = Commune.objects.update_or_create(
                code_commune=c["code"],
                defaults={
                    "nom_commune": c["nom"], "nom_commune_ar": c["nom_ar"],
                    "province": provinces[c["province"]],
                    "type_commune": c["type"], "population": c["pop"],
                    "annee_recensement": 2024, "superficie_km2": c["sup"],
                    "geom": geom, "source": "HCP / RGPH 2024", "millesime": 2024,
                    "statut_cycle_vie": "opposable",
                }
            )
            communes[c["code"]] = obj
        self.stdout.write(self.style.SUCCESS(f"   {len(communes)} communes créées."))
        return communes

    # ──────────────────────────────────────────────────────────────────────
    # 3. Catalogue de couches
    # ──────────────────────────────────────────────────────────────────────
    def _create_catalogue(self, users):
        self.stdout.write("📚 Création du catalogue de couches...")
        from referentiel.models import CoucheCatalogue, MetadonneeISO

        admin = users.get("admin_sig") or users.get("editeur1")
        couches = {}
        for c in COUCHES_CATALOGUE:
            obj, _ = CoucheCatalogue.objects.update_or_create(
                nom_technique=c["tech"],
                defaults={
                    "nom_affichage": c["aff"],
                    "thematique": c["th"],
                    "type_geometrie": c["geom"],
                    "domaine": c["domaine"],
                    "sous_domaine": c["sous_domaine"],
                    "source": c["source"],
                    "statut": c["statut"],
                    "millesime": c.get("millesime"),
                    "srid": 26192,
                    "echelle_reference": "1/25000",
                    "forcage_categorie": c.get("forcage"),
                    "est_exclusion": c.get("exclusion", False),
                    "auteur_modification": admin,
                }
            )
            couches[c["tech"]] = obj

            # Métadonnée ISO 19115
            MetadonneeISO.objects.update_or_create(
                couche=obj,
                defaults={
                    "titre": c["aff"],
                    "resume": f"Couche {c['aff']} pour la région Guelmim-Oued Noun. {c['source']}.",
                    "mots_cles": f"{c['th']}, {c['domaine']}, Guelmim-Oued Noun, CAR",
                    "contact_responsable": "DRA Guelmim-Oued Noun",
                    "organisme": c["source"].split("/")[0].strip(),
                    "date_publication": date(2026, 6, 1),
                    "emprise_ouest": -11.5, "emprise_est": -8.5,
                    "emprise_nord": 30.0, "emprise_sud": 27.5,
                    "systeme_reference": "EPSG:26192",
                    "qualite": "Données vérifiées par l'équipe terrain DRA.",
                    "contraintes_acces": "Usage interne DRA — consultation externe soumise à autorisation.",
                    "licence": "Licence DRA Guelmim-Oued Noun",
                }
            )

        self.stdout.write(self.style.SUCCESS(f"   {len(couches)} couches + métadonnées ISO créées."))
        return couches

    # ──────────────────────────────────────────────────────────────────────
    # 4. Règles de classement
    # ──────────────────────────────────────────────────────────────────────
    def _create_regles_classement(self, couches, users):
        self.stdout.write("⚙️  Création des règles de classement...")
        from classement.models import RegleClassement

        admin = users.get("admin_sig")
        rules = [
            {"couche": "eau_pmh_perimetres_2026", "type": "forcage_A", "desc": "Les périmètres PMH sont forçants en A (décision Commission Régionale)", "prio": 1},
            {"couche": "urb_documents_2026", "type": "exclusion", "desc": "Les zones urbanisables sont exclues du classement agricole", "prio": 1},
        ]
        count = 0
        for r in rules:
            if r["couche"] in couches:
                RegleClassement.objects.update_or_create(
                    couche_source=couches[r["couche"]],
                    type_regle=r["type"],
                    defaults={
                        "description": r["desc"],
                        "priorite": r["prio"],
                        "actif": True,
                        "auteur": admin,
                    }
                )
                count += 1
        self.stdout.write(self.style.SUCCESS(f"   {count} règles de classement créées."))

    # ──────────────────────────────────────────────────────────────────────
    # 5. Scénario AMC + UCA + Classes A/B/C
    # ──────────────────────────────────────────────────────────────────────
    def _create_scenario_amc(self, users, communes):
        self.stdout.write("🧮 Création du scénario AMC de référence et des UCA...")
        from classement.models import ScenarioAMC, UniteCarteAgricole, ClasseA, ClasseB, ClasseC

        admin = users.get("admin_sig")

        scenario, _ = ScenarioAMC.objects.update_or_create(
            nom="Référence CAR-GON 2026",
            defaults={
                "description": "Scénario de référence validé pour la Carte Agricole Régionale Guelmim-Oued Noun 2026. "
                               "Méthode AHP avec 4 critères, seuils A≥65, B≥40.",
                "moteur_scoring": "ahp",
                "criteres": [
                    {"id": "eau", "label": "Proximité de l'eau"},
                    {"id": "occ", "label": "Occupation du sol"},
                    {"id": "cont", "label": "Contraintes physiques"},
                    {"id": "urb", "label": "Éloignement urbain"},
                ],
                "poids": {"eau": 0.35, "occ": 0.25, "cont": 0.25, "urb": 0.15},
                "seuils": {"A": 65, "B": 40},
                "matrice_comparaison": [
                    [1, 3, 3, 5],
                    [1/3, 1, 1, 3],
                    [1/3, 1, 1, 3],
                    [1/5, 1/3, 1/3, 1],
                ],
                "ratio_coherence": 0.048,
                "est_car_validee": True,
                "auteur": admin,
                "date_calcul": timezone.now(),
                "duree_calcul_secondes": 12.4,
                "statut_cycle_vie": "opposable",
                "source": "DRA Guelmim-Oued Noun",
                "millesime": 2026,
            }
        )

        # Générer les UCA pour chaque commune
        total_a, total_b, total_c, total_hc = 0, 0, 0, 0
        uca_count = 0

        for code_commune, data in UCA_COMMUNE_DATA.items():
            commune = communes.get(code_commune)
            if not commune:
                continue

            for i in range(data["count"]):
                code = f"{data['prefix']}_{i}_{random.randint(100, 999)}"
                # Décaler chaque parcelle autour du centre de la commune
                dx = random.uniform(-0.08, 0.08)
                dy = random.uniform(-0.05, 0.05)
                center_lon = data["center"][0] + dx
                center_lat = data["center"][1] + dy
                size = random.uniform(1.5, 6)  # km

                geom = make_polygon(center_lon, center_lat, size_km=size, irregular=True)

                # Scores réalistes
                score_eau = random.uniform(0.1, 0.95)
                score_occ = random.uniform(0.15, 0.9)
                score_cont = random.uniform(0.2, 0.85)
                score_clim = random.uniform(0.3, 0.9)

                # IPA = somme pondérée
                poids = {"eau": 0.35, "occ": 0.25, "cont": 0.25, "urb": 0.15}
                ipa = (score_eau * 100 * poids["eau"] +
                       score_occ * 100 * poids["occ"] +
                       score_cont * 100 * poids["cont"] +
                       score_clim * 100 * poids["urb"])

                # Quelques UCA forcées ou exclues
                est_force = (i == 0 and code_commune in ("GLM-001", "GLM-002"))  # PMH
                est_hc = (i == data["count"] - 1 and code_commune in ("GLM-001", "SIF-001"))  # urbain

                if est_hc:
                    cat = "HC"
                    total_hc += 1
                elif est_force:
                    cat = "A"
                    ipa = max(ipa, 70)
                    total_a += 1
                elif ipa >= 65:
                    cat = "A"
                    total_a += 1
                elif ipa >= 40:
                    cat = "B"
                    total_b += 1
                else:
                    cat = "C"
                    total_c += 1

                superficie = size * size * random.uniform(0.5, 1.2) * 100  # ha approx

                uca, _ = UniteCarteAgricole.objects.update_or_create(
                    code_unite=code,
                    defaults={
                        "categorie": cat,
                        "score_ipa": round(ipa, 2),
                        "est_force": est_force,
                        "motif_forcage": "forcage:PMH" if est_force else "",
                        "est_hors_classement": est_hc,
                        "motif_exclusion": "zone_urbanisable" if est_hc else "",
                        "source_exclusion": "PA de " + commune.nom_commune if est_hc else "",
                        "groupe_sol": random.choice(GROUPES_SOL),
                        "facteur_limitant": random.choice(FACTEURS_LIMITANTS),
                        "risque": random.choice(RISQUES),
                        "justification": f"Score IPA: {ipa:.1f}/100 — classement {'forcé par PMH' if est_force else 'par seuillage IPA'}",
                        "echelle": "1/25000",
                        "date_classement": date(2026, 7, 15),
                        "superficie_ha": round(superficie, 1),
                        "score_eau": round(score_eau, 3),
                        "score_sol": round(random.uniform(0.2, 0.8), 3),
                        "score_clim": round(score_clim, 3),
                        "score_occ": round(score_occ, 3),
                        "score_cont": round(score_cont, 3),
                        "scenario": scenario,
                        "est_car_validee": True,
                        "commune": commune,
                        "geom": geom,
                        "source": "Processus réglementaire Phase 2-3",
                        "millesime": 2026,
                        "statut_cycle_vie": "opposable",
                    }
                )

                # Créer les classes géométriques correspondantes
                if cat == "A" and not est_hc:
                    ClasseA.objects.update_or_create(
                        code_unite=code,
                        defaults={
                            "score_ipa": round(ipa, 2), "est_force": est_force,
                            "couche_forcante": "PMH" if est_force else "",
                            "motif_classement": "forcage:PMH" if est_force else "seuillage_ipa",
                            "superficie_ha": round(superficie, 1),
                            "scenario": scenario, "commune": commune, "geom": geom,
                            "source": "Classement CAR 2026", "millesime": 2026,
                            "statut_cycle_vie": "opposable",
                        }
                    )
                elif cat == "B":
                    ClasseB.objects.update_or_create(
                        code_unite=code,
                        defaults={
                            "score_ipa": round(ipa, 2),
                            "facteur_limitant": uca.facteur_limitant,
                            "superficie_ha": round(superficie, 1),
                            "scenario": scenario, "commune": commune, "geom": geom,
                            "source": "Classement CAR 2026", "millesime": 2026,
                            "statut_cycle_vie": "opposable",
                        }
                    )
                elif cat == "C":
                    ClasseC.objects.update_or_create(
                        code_unite=code,
                        defaults={
                            "score_ipa": round(ipa, 2),
                            "facteur_limitant": uca.facteur_limitant,
                            "superficie_ha": round(superficie, 1),
                            "scenario": scenario, "commune": commune, "geom": geom,
                            "source": "Classement CAR 2026", "millesime": 2026,
                            "statut_cycle_vie": "opposable",
                        }
                    )

                uca_count += 1

        # Stats du scénario
        scenario.surface_a_calculee_ha = total_a * 250
        scenario.surface_b_ha = total_b * 200
        scenario.surface_c_ha = total_c * 180
        scenario.surface_hors_classement_ha = total_hc * 100
        scenario.nombre_unites = uca_count
        scenario.save()

        self.stdout.write(self.style.SUCCESS(
            f"   Scénario « {scenario.nom} » : {uca_count} UCA "
            f"(A={total_a}, B={total_b}, C={total_c}, HC={total_hc})"
        ))
        return scenario

    # ──────────────────────────────────────────────────────────────────────
    # 6. Entrées d'audit
    # ──────────────────────────────────────────────────────────────────────
    def _create_audit_entries(self, users):
        self.stdout.write("📋 Création d'entrées d'audit...")
        from audit.models import AuditLog

        admin = users.get("admin_sig")
        editeur = users.get("editeur1")

        entries = [
            {"user": admin, "action": "login", "module": "M11", "desc": "Connexion administrateur"},
            {"user": editeur, "action": "import", "module": "M3",
             "model": "CoucheCatalogue", "desc": "Import Shapefile périmètres PMH Guelmim"},
            {"user": editeur, "action": "create", "module": "M8",
             "model": "CoucheCatalogue", "desc": "Création couche 'eau_pmh_perimetres_2026'"},
            {"user": admin, "action": "validate", "module": "M3",
             "model": "CoucheCatalogue", "desc": "Validation couche PMH — statut = validée"},
            {"user": editeur, "action": "calcul", "module": "M6",
             "model": "ScenarioAMC", "desc": "Lancement simulation AMC — scénario « Référence CAR-GON 2026 »"},
            {"user": admin, "action": "publish", "module": "M6",
             "model": "ScenarioAMC", "desc": "Publication CAR 2026 comme opposable"},
            {"user": admin, "action": "forcage", "module": "M6",
             "model": "RegleClassement", "desc": "Activation règle forçage PMH → Classe A"},
            {"user": admin, "action": "exclusion", "module": "M6",
             "model": "RegleClassement", "desc": "Activation règle exclusion zones urbanisables"},
            {"user": users.get("decideur1"), "action": "export", "module": "M9",
             "desc": "Export PDF planche 1/25000 — secteur Guelmim NE"},
            {"user": users.get("consult1"), "action": "login", "module": "M11",
             "desc": "Connexion profil Consultation"},
        ]

        for e in entries:
            AuditLog.objects.create(
                utilisateur=e["user"],
                role_utilisateur=e["user"].role if e["user"] else "",
                action=e["action"],
                module=e.get("module", ""),
                model_name=e.get("model", ""),
                description=e["desc"],
                adresse_ip="192.168.1.10",
            )

        self.stdout.write(self.style.SUCCESS(f"   {len(entries)} entrées d'audit créées."))
