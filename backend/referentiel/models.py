"""
Modèles — Référentiel de couches et domaines de valeurs.

Conformément au TDR 5.14 : « domaines de valeurs en tables de référence
(pas de littéraux en dur) ». Ce module fournit :
  - Les tables de domaines de valeurs (types de sol, géologie, foncier…)
  - Le catalogue de couches (CoucheCatalogue)
  - Le cycle de vie et la généalogie des couches
  - Le versionnement des couches
  - Les métadonnées ISO 19115

Référence : TDR chapitre 4, Prompt section 3 « Référentiel de couches ».
"""

from django.db import models
from django.conf import settings


# ===================================================================
# TABLES DE DOMAINES DE VALEURS (pas de littéraux en dur)
# ===================================================================

class DomaineValeur(models.Model):
    """
    Table générique pour les domaines de valeurs codés.
    Chaque domaine est identifié par son « domaine » (ex: 'type_sol',
    'type_geologie', 'statut_foncier') et contient des codes + libellés.
    """
    domaine = models.CharField(
        max_length=100, db_index=True,
        verbose_name="Nom du domaine",
        help_text="Identifiant du domaine (ex: type_sol, type_geologie).",
    )
    code = models.CharField(
        max_length=50,
        verbose_name="Code",
    )
    libelle = models.CharField(
        max_length=500,
        verbose_name="Libellé",
    )
    libelle_ar = models.CharField(
        max_length=500, blank=True, default='',
        verbose_name="Libellé (arabe)",
    )
    description = models.TextField(
        blank=True, default='',
        verbose_name="Description",
    )
    ordre = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Ordre d'affichage",
    )
    actif = models.BooleanField(
        default=True,
        verbose_name="Actif",
    )

    class Meta:
        db_table = 'referentiel_domaine_valeur'
        verbose_name = 'Domaine de valeur'
        verbose_name_plural = 'Domaines de valeurs'
        unique_together = [('domaine', 'code')]
        ordering = ['domaine', 'ordre', 'code']

    def __str__(self):
        return f"[{self.domaine}] {self.code} — {self.libelle}"


# ===================================================================
# CATALOGUE DE COUCHES
# ===================================================================

CYCLE_VIE_CHOICES = [
    ('brouillon', 'Brouillon'),
    ('soumise', 'Soumise à validation'),
    ('validee', 'Validée'),
    ('opposable', 'Opposable'),
    ('archivee', 'Archivée'),
]

THEMATIQUE_CHOICES = [
    ('communes', 'Communes'),
    ('provinces', 'Provinces'),
    ('regions', 'Régions'),
    ('car_a', 'Potentiel A (fort)'),
    ('car_b', 'Potentiel B (moyen)'),
    ('car_c', 'Potentiel C (faible)'),
    ('sols', 'Unités pédologiques'),
    ('oued', 'Oueds et réseau hydrographique'),
    ('eau_forage', "Points d'eau : Forages"),
    ('eau_puits', "Points d'eau : Puits"),
    ('eau_source', "Points d'eau : Sources"),
    ('gh', 'Périmètres irrigués : GH'),
    ('pmh', 'Périmètres irrigués : PMH'),
    ('ppp', 'PPP en irrigation'),
    ('priv', 'Irrigation privée'),
    ('nappes', 'Nappes'),
    ('pei', 'Périmètres PEI'),
    ('proj_p1', 'Pilier I du PMV'),
    ('proj_p2', 'Pilier II du PMV'),
    ('proj_mca', 'Projets MCA'),
    ('proj_pmvb', 'PMVB'),
    ('proj_pam', "Sites d'amélioration pastorale"),
    ('past', 'Zones pastorales'),
    ('oasis', 'Zones oasiennes'),
    ('urb', "Documents d'urbanisme"),
    ('ra', 'Zones RA'),
    ('ocs', 'Occupation du sol (OCS)'),
    ('bati', 'Bâti'),
    ('tf', 'Titres fonciers'),
    ('stat_melk', 'Statuts fonciers : Melk'),
    ('stat_coll', 'Statuts fonciers : Collectif'),
    ('stat_hab', 'Statuts fonciers : Habous'),
    ('stat_dom', 'Statuts fonciers : Domanial'),
]

TYPE_GEOMETRIE_CHOICES = [
    ('point', 'Point'),
    ('ligne', 'Ligne'),
    ('polygone', 'Polygone'),
    ('multi_polygone', 'MultiPolygone'),
    ('raster', 'Raster'),
]


class CoucheCatalogue(models.Model):
    """
    Fiche de catalogue pour chaque couche du référentiel.
    Nommage : thematique_objet_millesime (minuscules, sans accents).
    """
    nom_technique = models.CharField(
        max_length=255, unique=True,
        verbose_name="Nom technique de la couche",
        help_text="Format : thematique_objet_millesime (minuscules, sans accents).",
    )
    nom_affichage = models.CharField(
        max_length=500,
        verbose_name="Nom d'affichage",
    )
    description = models.TextField(
        blank=True, default='',
        verbose_name="Description",
    )
    domaine = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Domaine",
        help_text="Niveau 1 de l'arborescence (ex: Ressources en eau)",
    )
    sous_domaine = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Sous-domaine",
        help_text="Niveau 2 de l'arborescence (ex: Eaux souterraines)",
    )
    thematique = models.CharField(
        max_length=50,
        choices=THEMATIQUE_CHOICES,
        verbose_name="Thématique",
    )
    type_geometrie = models.CharField(
        max_length=20,
        choices=TYPE_GEOMETRIE_CHOICES,
        verbose_name="Type de géométrie",
    )
    table_django = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Nom de la table/modèle Django",
        help_text="app_label.ModelName",
    )
    srid = models.PositiveIntegerField(
        default=26192,
        verbose_name="SRID de stockage",
    )
    est_editable = models.BooleanField(
        default=False,
        verbose_name="Éditable par les Éditeurs",
    )
    statut = models.CharField(
        max_length=20,
        choices=CYCLE_VIE_CHOICES,
        default='brouillon',
        verbose_name="Statut du cycle de vie",
    )
    millesime = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Millésime",
    )
    source = models.CharField(
        max_length=500, blank=True, default='',
        verbose_name="Source",
    )
    echelle_reference = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name="Échelle de référence (ex: 1/25000)",
    )
    # Forçage / exclusion (cf. Prompt section 5)
    forcage_categorie = models.CharField(
        max_length=1, blank=True, null=True,
        choices=[('A', 'Forçage A'), ('B', 'Forçage B')],
        verbose_name="Forçage de catégorie (nullable)",
        help_text="Si renseigné, les unités intersectant cette couche sont "
                  "automatiquement classées dans cette catégorie.",
    )
    est_exclusion = models.BooleanField(
        default=False,
        verbose_name="Couche d'exclusion",
        help_text="Si coché, les unités intersectant cette couche sont "
                  "retirées du classement agricole (hors classement).",
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    auteur_modification = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='couches_modifiees',
        verbose_name="Dernier auteur",
    )

    class Meta:
        db_table = 'referentiel_couche_catalogue'
        verbose_name = 'Couche du catalogue'
        verbose_name_plural = 'Couches du catalogue'
        ordering = ['thematique', 'nom_technique']

    def __str__(self):
        return f"[{self.thematique}] {self.nom_affichage}"


# ===================================================================
# MÉTADONNÉES ISO 19115
# ===================================================================

class MetadonneeISO(models.Model):
    """
    Fiche de métadonnées ISO 19115 associée à une couche.
    """
    couche = models.OneToOneField(
        CoucheCatalogue,
        on_delete=models.CASCADE,
        related_name='metadonnee_iso',
        verbose_name="Couche",
    )
    titre = models.CharField(max_length=500, verbose_name="Titre")
    resume = models.TextField(blank=True, default='', verbose_name="Résumé")
    mots_cles = models.TextField(
        blank=True, default='',
        verbose_name="Mots-clés (séparés par des virgules)",
    )
    contact_responsable = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Contact responsable",
    )
    organisme = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Organisme producteur",
    )
    date_publication = models.DateField(
        blank=True, null=True,
        verbose_name="Date de publication",
    )
    date_revision = models.DateField(
        blank=True, null=True,
        verbose_name="Date de révision",
    )
    emprise_ouest = models.FloatField(blank=True, null=True, verbose_name="Emprise Ouest (°)")
    emprise_est = models.FloatField(blank=True, null=True, verbose_name="Emprise Est (°)")
    emprise_nord = models.FloatField(blank=True, null=True, verbose_name="Emprise Nord (°)")
    emprise_sud = models.FloatField(blank=True, null=True, verbose_name="Emprise Sud (°)")
    systeme_reference = models.CharField(
        max_length=100, default='EPSG:26192',
        verbose_name="Système de référence",
    )
    qualite = models.TextField(
        blank=True, default='',
        verbose_name="Rapport de qualité",
    )
    contraintes_acces = models.TextField(
        blank=True, default='',
        verbose_name="Contraintes d'accès",
    )
    licence = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Licence",
    )

    class Meta:
        db_table = 'referentiel_metadonnee_iso'
        verbose_name = 'Métadonnée ISO 19115'
        verbose_name_plural = 'Métadonnées ISO 19115'

    def __str__(self):
        return f"ISO — {self.titre}"


# ===================================================================
# GÉNÉALOGIE (traçabilité des couches dérivées)
# ===================================================================

class Genealogie(models.Model):
    """
    Généalogie d'une couche dérivée : sources, traitement, paramètres.
    Obligatoire pour toute couche dérivée (TDR 5.14).
    """
    couche = models.ForeignKey(
        CoucheCatalogue,
        on_delete=models.CASCADE,
        related_name='genealogies',
        verbose_name="Couche produite",
    )
    couche_source = models.ForeignKey(
        CoucheCatalogue,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='couches_derivees',
        verbose_name="Couche source",
    )
    description_source = models.CharField(
        max_length=500, blank=True, default='',
        verbose_name="Description de la source (si hors catalogue)",
    )
    traitement = models.TextField(
        blank=True, default='',
        verbose_name="Description du traitement appliqué",
    )
    parametres = models.JSONField(
        blank=True, null=True,
        verbose_name="Paramètres du traitement",
    )
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Auteur du traitement",
    )
    date_traitement = models.DateTimeField(
        blank=True, null=True,
        verbose_name="Date du traitement",
    )

    class Meta:
        db_table = 'referentiel_genealogie'
        verbose_name = 'Généalogie'
        verbose_name_plural = 'Généalogies'

    def __str__(self):
        return f"Généalogie de {self.couche} ← {self.couche_source or self.description_source}"


# ===================================================================
# VERSIONNEMENT DES COUCHES
# ===================================================================

class VersionCouche(models.Model):
    """
    Historique des versions d'une couche.
    Permet la restauration d'un état antérieur (M3-07, M8-08).
    """
    couche = models.ForeignKey(
        CoucheCatalogue,
        on_delete=models.CASCADE,
        related_name='versions',
        verbose_name="Couche",
    )
    numero_version = models.PositiveIntegerField(
        verbose_name="Numéro de version",
    )
    description = models.TextField(
        blank=True, default='',
        verbose_name="Description des modifications",
    )
    statut_avant = models.CharField(
        max_length=20, choices=CYCLE_VIE_CHOICES,
        blank=True, default='',
        verbose_name="Statut avant modification",
    )
    statut_apres = models.CharField(
        max_length=20, choices=CYCLE_VIE_CHOICES,
        blank=True, default='',
        verbose_name="Statut après modification",
    )
    snapshot_data = models.JSONField(
        blank=True, null=True,
        verbose_name="Snapshot des données (pour restauration)",
    )
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Auteur",
    )
    date_version = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de la version",
    )
    est_restaurable = models.BooleanField(
        default=True,
        verbose_name="Restaurable",
    )

    class Meta:
        db_table = 'referentiel_version_couche'
        verbose_name = 'Version de couche'
        verbose_name_plural = 'Versions de couches'
        unique_together = [('couche', 'numero_version')]
        ordering = ['-numero_version']

    def __str__(self):
        return f"{self.couche} — v{self.numero_version}"
