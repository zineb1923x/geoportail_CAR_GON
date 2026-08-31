"""
Commande de management : sync_couches_catalogue

Synchronise les tables PostGIS des modèles Django vers le catalogue
referentiel_couche_catalogue. Crée les entrées manquantes avec le statut
'validee' pour qu'elles soient immédiatement visibles sur la carte.

Usage :
    python manage.py sync_couches_catalogue             # créer les entrées manquantes
    python manage.py sync_couches_catalogue --force      # mettre à jour aussi les entrées existantes
    python manage.py sync_couches_catalogue --dry-run    # simulation sans écriture
    python manage.py sync_couches_catalogue --validate   # valider les couches encore en brouillon
"""

from django.core.management.base import BaseCommand
from django.db import connection

from referentiel.models import CoucheCatalogue


# ============================================================================
# Mapping : db_table → configuration catalogue
#
# Chaque entrée contient :
#   - nom_affichage : nom affiché dans l'arbre des couches et la légende
#   - thematique    : clé thématique (doit correspondre à THEMATIQUE_CHOICES)
#   - type_geometrie: point | ligne | polygone | multi_polygone | raster
#   - domaine       : domaine de regroupement (niveau 1)
#   - sous_domaine  : sous-domaine (niveau 2)
#   - table_django  : app_label.ModelName
#   - est_exclusion : True si c'est une couche d'exclusion
#   - forcage_cat   : 'A' ou 'B' si couche forçante, None sinon
# ============================================================================

COUCHES_MAPPING = [
    # ── Classement A/B/C ──────────────────────────────────────────────
    {
        'db_table': 'classement_classe_a',
        'nom_affichage': 'CAR A — Excellente',
        'thematique': 'car_a',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Classification CAR',
        'sous_domaine': 'Classement A/B/C',
        'table_django': 'classement.ClasseA',
    },
    {
        'db_table': 'classement_classe_b',
        'nom_affichage': 'CAR B — Bonne',
        'thematique': 'car_b',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Classification CAR',
        'sous_domaine': 'Classement A/B/C',
        'table_django': 'classement.ClasseB',
    },
    {
        'db_table': 'classement_classe_c',
        'nom_affichage': 'CAR C — À améliorer',
        'thematique': 'car_c',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Classification CAR',
        'sous_domaine': 'Classement A/B/C',
        'table_django': 'classement.ClasseC',
    },
    # ── Limites administratives ───────────────────────────────────────
    {
        'db_table': 'administration_commune',
        'nom_affichage': 'Communes',
        'thematique': 'communes',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Délimitations Administratives',
        'sous_domaine': '',
        'table_django': 'administration.Commune',
    },
    {
        'db_table': 'administration_province',
        'nom_affichage': 'Provinces',
        'thematique': 'provinces',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Délimitations Administratives',
        'sous_domaine': '',
        'table_django': 'administration.Province',
    },
    # ── Ressources en eau ─────────────────────────────────────────────
    {
        'db_table': 'ressources_eau_reseau_hydrographique',
        'nom_affichage': 'Oueds et réseau hydrographique',
        'thematique': 'oued',
        'type_geometrie': 'ligne',
        'domaine': 'Ressources en eau',
        'sous_domaine': 'Réseau hydrographique',
        'table_django': 'ressources_eau.ReseauHydrographique',
    },
    {
        'db_table': 'ressources_eau_nappe_phreatique',
        'nom_affichage': 'Nappes phréatiques',
        'thematique': 'nappes',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Ressources en eau',
        'sous_domaine': 'Eaux souterraines',
        'table_django': 'ressources_eau.NappePhreatique',
    },
    {
        'db_table': 'ressources_eau_piezometre',
        'nom_affichage': 'Piézomètres (forages)',
        'thematique': 'eau_forage',
        'type_geometrie': 'point',
        'domaine': 'Ressources en eau',
        'sous_domaine': "Points d'eau",
        'table_django': 'ressources_eau.Piezometre',
    },
    {
        'db_table': 'ressources_eau_barrage',
        'nom_affichage': 'Barrages',
        'thematique': 'eau_source',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Ressources en eau',
        'sous_domaine': 'Ouvrages hydrauliques',
        'table_django': 'ressources_eau.Barrage',
    },
    # ── Occupation agricole ───────────────────────────────────────────
    {
        'db_table': 'occupation_agricole_perimetre_irrigue',
        'nom_affichage': 'Périmètres irrigués — Grande Hydraulique (GH)',
        'thematique': 'gh',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Occupation agricole',
        'sous_domaine': 'Irrigation',
        'table_django': 'occupation_agricole.PerimetreIrrigue',
        'forcage_categorie': 'A',
    },
    {
        'db_table': 'occupation_agricole_pmh',
        'nom_affichage': 'Périmètres irrigués — PMH',
        'thematique': 'pmh',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Occupation agricole',
        'sous_domaine': 'Irrigation',
        'table_django': 'occupation_agricole.PMH',
        'forcage_categorie': 'A',
    },
    {
        'db_table': 'occupation_agricole_ppp',
        'nom_affichage': 'PPP en irrigation',
        'thematique': 'ppp',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Occupation agricole',
        'sous_domaine': 'Irrigation',
        'table_django': 'occupation_agricole.PPP',
    },
    {
        'db_table': 'occupation_agricole_irrigation_privee',
        'nom_affichage': 'Irrigation privée',
        'thematique': 'priv',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Occupation agricole',
        'sous_domaine': 'Irrigation',
        'table_django': 'occupation_agricole.IrrigationPrivee',
    },
    {
        'db_table': 'occupation_agricole_zone_oasienne',
        'nom_affichage': 'Zones oasiennes',
        'thematique': 'oasis',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Occupation agricole',
        'sous_domaine': 'Oasis',
        'table_django': 'occupation_agricole.ZoneOasienne',
    },
    {
        'db_table': 'occupation_agricole_projet_pmv',
        'nom_affichage': 'Projets PMV — Pilier I',
        'thematique': 'proj_p1',
        'type_geometrie': 'multi_polygone',
        'domaine': "Projets d'investissement agricole",
        'sous_domaine': 'Plan Maroc Vert',
        'table_django': 'occupation_agricole.ProjetPMV',
    },
    # ── Zones pastorales ──────────────────────────────────────────────
    {
        'db_table': 'zones_pastorales_zone_pastorale',
        'nom_affichage': 'Zones pastorales',
        'thematique': 'past',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Zones pastorales',
        'sous_domaine': '',
        'table_django': 'zones_pastorales.ZonePastorale',
    },
    {
        'db_table': 'zones_pastorales_site_amelioration',
        'nom_affichage': "Sites d'amélioration pastorale",
        'thematique': 'proj_pam',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Zones pastorales',
        'sous_domaine': '',
        'table_django': 'zones_pastorales.SiteAmeliorationPastorale',
    },
    # ── Géopédologie ──────────────────────────────────────────────────
    {
        'db_table': 'geopedologie_zone_homogene',
        'nom_affichage': 'Unités pédologiques (CPCS 1967)',
        'thematique': 'sols',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Géopédologie',
        'sous_domaine': 'Sols',
        'table_django': 'geopedologie.ZoneHomogene',
    },
    {
        'db_table': 'geopedologie_profil_pedologique',
        'nom_affichage': 'Profils pédologiques',
        'thematique': 'sols',
        'type_geometrie': 'point',
        'domaine': 'Géopédologie',
        'sous_domaine': 'Sols',
        'table_django': 'geopedologie.ProfilPedologique',
    },
    # ── Exclusions ────────────────────────────────────────────────────
    {
        'db_table': 'exclusions_zone_urbanisable',
        'nom_affichage': "Documents d'urbanisme — délimitations en vigueur",
        'thematique': 'urb',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Exclusions',
        'sous_domaine': 'Urbanisme',
        'table_django': 'exclusions.ZoneUrbanisable',
        'est_exclusion': True,
    },
    {
        'db_table': 'exclusions_domaine_forestier',
        'nom_affichage': 'Domaine forestier',
        'thematique': 'ra',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Exclusions',
        'sous_domaine': 'Domaine forestier',
        'table_django': 'exclusions.DomaineForestier',
        'est_exclusion': True,
    },
    {
        'db_table': 'exclusions_reseau_routier',
        'nom_affichage': 'Réseau routier',
        'thematique': 'bati',
        'type_geometrie': 'ligne',
        'domaine': 'Exclusions',
        'sous_domaine': 'Réseau routier',
        'table_django': 'exclusions.ReseauRoutier',
        'est_exclusion': True,
    },
    {
        'db_table': 'exclusions_avna',
        'nom_affichage': 'Zones à vocation non agricole (AVNA)',
        'thematique': 'ra',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Exclusions',
        'sous_domaine': 'AVNA',
        'table_django': 'exclusions.AVNA',
        'est_exclusion': True,
    },
    {
        'db_table': 'exclusions_statut_foncier',
        'nom_affichage': 'Statuts fonciers',
        'thematique': 'tf',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Foncier',
        'sous_domaine': 'Statut foncier',
        'table_django': 'exclusions.StatutFoncier',
    },
    # ── Bioclimat ─────────────────────────────────────────────────────
    {
        'db_table': 'bioclimat_etage_bioclimatique',
        'nom_affichage': 'Étages bioclimatiques',
        'thematique': 'ocs',
        'type_geometrie': 'multi_polygone',
        'domaine': 'Bioclimat',
        'sous_domaine': '',
        'table_django': 'bioclimat.EtageBioclimatique',
    },
    {
        'db_table': 'bioclimat_station_climatique',
        'nom_affichage': 'Stations climatiques',
        'thematique': 'eau_puits',
        'type_geometrie': 'point',
        'domaine': 'Bioclimat',
        'sous_domaine': '',
        'table_django': 'bioclimat.StationClimatique',
    },
]


def _table_exists(table_name):
    """Vérifie qu'une table existe dans le schéma public de PostgreSQL."""
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT EXISTS(SELECT 1 FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=%s)",
            [table_name],
        )
        return cursor.fetchone()[0]


def _count_rows(table_name):
    """Compte le nombre d'enregistrements dans une table."""
    with connection.cursor() as cursor:
        cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        return cursor.fetchone()[0]


class Command(BaseCommand):
    help = (
        "Synchronise les tables PostGIS des modèles Django vers le catalogue "
        "referentiel_couche_catalogue. Crée les entrées manquantes avec le "
        "statut 'validee' pour qu'elles soient visibles sur la carte."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Afficher les actions sans les exécuter.",
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help="Mettre à jour les entrées existantes (domaine, sous_domaine, etc.).",
        )
        parser.add_argument(
            '--validate',
            action='store_true',
            help="Passer les couches 'brouillon' en 'validee'.",
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        validate = options['validate']

        created = 0
        updated = 0
        validated = 0
        skipped = 0
        no_table = 0

        self.stdout.write(self.style.MIGRATE_HEADING(
            "\n═══ Synchronisation couches → catalogue ═══\n"
        ))

        for mapping in COUCHES_MAPPING:
            db_table = mapping['db_table']
            nom_affichage = mapping['nom_affichage']

            # Vérifier que la table existe en base
            if not _table_exists(db_table):
                self.stdout.write(
                    f"  ⏭  {db_table} — table inexistante, ignorée"
                )
                no_table += 1
                continue

            # Compter les enregistrements
            row_count = _count_rows(db_table)

            # Chercher si une entrée existe déjà dans le catalogue
            existing = CoucheCatalogue.objects.filter(nom_technique=db_table).first()

            if existing:
                if force:
                    # Mettre à jour les champs
                    if not dry_run:
                        existing.nom_affichage = nom_affichage
                        existing.thematique = mapping['thematique']
                        existing.type_geometrie = mapping['type_geometrie']
                        existing.domaine = mapping.get('domaine', '')
                        existing.sous_domaine = mapping.get('sous_domaine', '')
                        existing.table_django = mapping.get('table_django', '')
                        existing.est_exclusion = mapping.get('est_exclusion', False)
                        existing.forcage_categorie = mapping.get('forcage_categorie', None)
                        existing.save()
                    self.stdout.write(
                        self.style.WARNING(
                            f"  🔄 {db_table} — mis à jour ({row_count} lignes)"
                        )
                    )
                    updated += 1
                elif validate and existing.statut == 'brouillon':
                    if not dry_run:
                        existing.statut = 'validee'
                        existing.save()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  ✅ {db_table} — validé (brouillon → validee, {row_count} lignes)"
                        )
                    )
                    validated += 1
                else:
                    self.stdout.write(
                        f"  ── {db_table} — déjà dans le catalogue "
                        f"(statut: {existing.statut}, {row_count} lignes)"
                    )
                    skipped += 1
            else:
                # Créer une nouvelle entrée
                if not dry_run:
                    CoucheCatalogue.objects.create(
                        nom_technique=db_table,
                        nom_affichage=nom_affichage,
                        thematique=mapping['thematique'],
                        type_geometrie=mapping['type_geometrie'],
                        domaine=mapping.get('domaine', ''),
                        sous_domaine=mapping.get('sous_domaine', ''),
                        table_django=mapping.get('table_django', ''),
                        srid=26192,
                        statut='validee',
                        est_exclusion=mapping.get('est_exclusion', False),
                        forcage_categorie=mapping.get('forcage_categorie', None),
                    )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✅ {db_table} → « {nom_affichage} » "
                        f"(créé avec statut 'validee', {row_count} lignes)"
                    )
                )
                created += 1

        # Résumé
        self.stdout.write(self.style.MIGRATE_HEADING(
            f"\n═══ Résumé ═══"
        ))
        prefix = "[DRY-RUN] " if dry_run else ""
        self.stdout.write(f"  {prefix}Créées    : {created}")
        self.stdout.write(f"  {prefix}Mises à jour : {updated}")
        self.stdout.write(f"  {prefix}Validées  : {validated}")
        self.stdout.write(f"  Ignorées (existantes) : {skipped}")
        self.stdout.write(f"  Ignorées (table absente) : {no_table}")
        self.stdout.write("")

        if dry_run:
            self.stdout.write(self.style.WARNING(
                "  ⚠ Mode dry-run — aucune modification n'a été apportée.\n"
                "  Relancez sans --dry-run pour appliquer les changements."
            ))
