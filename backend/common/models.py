"""
Modèles abstraits partagés — Géoportail Agricole CAR-GON.

Toutes les entités métier spatiales héritent de CoucheBase qui impose :
  - identifiant stable (PK auto)
  - statut du cycle de vie
  - millésime
  - source
  - date et auteur de dernière modification
  - rattachement commune (ID_Com)
  - géométrie au SRID 26192 (Merchich / Sud Maroc)

Référence : TDR V1.6 chapitre 5.14, Prompt section 3.
"""

from django.contrib.gis.db import models
from django.conf import settings


# ---------------------------------------------------------------------------
# SRID de stockage unique — Lambert Maroc zone Sud (Merchich)
# Conforme au TDR 5.14 : stockage en Merchich, diffusion reprojetée 4326/3857.
# ---------------------------------------------------------------------------
SRID_STOCKAGE = 26192  # EPSG:26192  Merchich / Sud Maroc


# ---------------------------------------------------------------------------
# Domaines de valeurs réutilisables
# ---------------------------------------------------------------------------

STATUT_CYCLE_VIE = [
    ('brouillon', 'Brouillon'),
    ('soumise', 'Soumise à validation'),
    ('validee', 'Validée'),
    ('opposable', 'Opposable'),
    ('archivee', 'Archivée'),
]


# ---------------------------------------------------------------------------
# Modèle abstrait : suivi de modification (sans géométrie)
# ---------------------------------------------------------------------------

class TraçabilitéMixin(models.Model):
    """
    Champs de traçabilité obligatoires sur toute entité (TDR 5.14).
    """
    statut_cycle_vie = models.CharField(
        max_length=20,
        choices=STATUT_CYCLE_VIE,
        default='brouillon',
        verbose_name="Statut du cycle de vie",
    )
    millesime = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Millésime (année de référence)",
    )
    source = models.CharField(
        max_length=500,
        blank=True, default='',
        verbose_name="Source des données",
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de dernière modification",
    )
    auteur_modification = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='%(app_label)s_%(class)s_modifications',
        verbose_name="Auteur de la dernière modification",
    )
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création",
    )

    class Meta:
        abstract = True


# ---------------------------------------------------------------------------
# Modèle abstrait : entité spatiale de base (Polygon / MultiPolygon)
# ---------------------------------------------------------------------------

class CoucheBase(TraçabilitéMixin):
    """
    Classe abstraite pour toute couche spatiale polygonale du MCD.
    Impose le rattachement commune et la géométrie au SRID de stockage.
    """
    commune = models.ForeignKey(
        'administration.Commune',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='%(app_label)s_%(class)s_set',
        verbose_name="Commune de rattachement (ID_Com)",
        db_column='id_com',
    )
    geom = models.MultiPolygonField(
        srid=SRID_STOCKAGE,
        verbose_name="Géométrie",
    )

    class Meta:
        abstract = True


# ---------------------------------------------------------------------------
# Modèle abstrait : entité spatiale ponctuelle
# ---------------------------------------------------------------------------

class PointBase(TraçabilitéMixin):
    """
    Classe abstraite pour les entités ponctuelles (puits, piézomètres, etc.).
    """
    commune = models.ForeignKey(
        'administration.Commune',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='%(app_label)s_%(class)s_set',
        verbose_name="Commune de rattachement (ID_Com)",
        db_column='id_com',
    )
    geom = models.PointField(
        srid=SRID_STOCKAGE,
        verbose_name="Géométrie (point)",
    )

    class Meta:
        abstract = True


# ---------------------------------------------------------------------------
# Modèle abstrait : entité spatiale linéaire
# ---------------------------------------------------------------------------

class LigneBase(TraçabilitéMixin):
    """
    Classe abstraite pour les entités linéaires (réseau routier, hydrographie).
    """
    commune = models.ForeignKey(
        'administration.Commune',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='%(app_label)s_%(class)s_set',
        verbose_name="Commune de rattachement (ID_Com)",
        db_column='id_com',
    )
    geom = models.MultiLineStringField(
        srid=SRID_STOCKAGE,
        verbose_name="Géométrie (ligne)",
    )

    class Meta:
        abstract = True


# ---------------------------------------------------------------------------
# Modèle abstrait : métadonnées raster
# ---------------------------------------------------------------------------

class RasterBase(TraçabilitéMixin):
    """
    Métadonnées d'un jeu de données raster (résolution, étendue, chemin).
    Le raster lui-même est stocké sur le filesystem / dans PostGIS raster.
    """
    nom = models.CharField(max_length=255, verbose_name="Nom du raster")
    resolution = models.FloatField(
        blank=True, null=True,
        verbose_name="Résolution spatiale (m)",
    )
    chemin_fichier = models.CharField(
        max_length=1000, blank=True, default='',
        verbose_name="Chemin du fichier raster",
    )
    emprise = models.MultiPolygonField(
        srid=SRID_STOCKAGE,
        blank=True, null=True,
        verbose_name="Emprise du raster",
    )
    nombre_bandes = models.PositiveSmallIntegerField(
        default=1,
        verbose_name="Nombre de bandes",
    )
    date_acquisition = models.DateField(
        blank=True, null=True,
        verbose_name="Date d'acquisition",
    )

    class Meta:
        abstract = True

    def __str__(self):
        return self.nom
