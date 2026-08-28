"""
Modèles — A. Géopédologie.

Bloc « A. GEOPEDOLOGIE » du MCD :
  - Rasters (métadonnées) : Géologie, Indice de Rougeur, Indice de Brillance, Pente, Sable
  - Pixels dérivés : valeurs extraites par zone/pixel
  - Profil_Pedologique : sondages terrain
  - Zone_Homogene : unités pédologiques homogènes
  - Classe_Sol : classification pédologique (CPCS 1967, FAO, etc.)

Référence : MCD section « A. GEOPEDOLOGIE », TDR chapitre 4 socle transverse.
"""

from django.contrib.gis.db import models
from common.models import (
    CoucheBase, PointBase, RasterBase, TraçabilitéMixin, SRID_STOCKAGE
)


# ===================================================================
# RASTERS — métadonnées des jeux de données raster
# ===================================================================

class RasterGeologie(RasterBase):
    """Raster de la carte géologique."""
    type_geologie = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Type de géologie",
    )

    class Meta:
        db_table = 'geopedologie_raster_geologie'
        verbose_name = 'Raster — Géologie'
        verbose_name_plural = 'Rasters — Géologie'


class RasterIndiceRougeur(RasterBase):
    """Raster de l'indice de rougeur (dérivé images satellite)."""

    class Meta:
        db_table = 'geopedologie_raster_indice_rougeur'
        verbose_name = 'Raster — Indice de rougeur'
        verbose_name_plural = 'Rasters — Indice de rougeur'


class RasterIndiceBrillance(RasterBase):
    """Raster de l'indice de brillance (dérivé images satellite)."""

    class Meta:
        db_table = 'geopedologie_raster_indice_brillance'
        verbose_name = 'Raster — Indice de brillance'
        verbose_name_plural = 'Rasters — Indice de brillance'


class RasterPente(RasterBase):
    """Raster de pente (dérivé MNT)."""
    unite_pente = models.CharField(
        max_length=20, default='pourcent',
        choices=[('pourcent', '%'), ('degre', '°')],
        verbose_name="Unité de pente",
    )

    class Meta:
        db_table = 'geopedologie_raster_pente'
        verbose_name = 'Raster — Pente'
        verbose_name_plural = 'Rasters — Pente'


class RasterSable(RasterBase):
    """Raster de la fraction sable (granulométrie)."""

    class Meta:
        db_table = 'geopedologie_raster_sable'
        verbose_name = 'Raster — Sable'
        verbose_name_plural = 'Rasters — Sable'


# ===================================================================
# PIXELS DÉRIVÉS — valeurs extraites par zone
# ===================================================================

class PixelGeologie(CoucheBase):
    """Pixels/zones dérivés du raster de géologie."""
    raster = models.ForeignKey(
        RasterGeologie, on_delete=models.CASCADE,
        related_name='pixels', verbose_name="Raster source",
    )
    code_geologie = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name="Code géologique",
    )
    libelle_geologie = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Libellé géologique",
    )
    valeur = models.FloatField(
        blank=True, null=True,
        verbose_name="Valeur",
    )

    class Meta:
        db_table = 'geopedologie_pixel_geologie'
        verbose_name = 'Pixel — Géologie'
        verbose_name_plural = 'Pixels — Géologie'

    def __str__(self):
        return f"Géologie {self.code_geologie} — {self.libelle_geologie}"


class PixelRougeur(CoucheBase):
    """Pixels/zones dérivés du raster d'indice de rougeur."""
    raster = models.ForeignKey(
        RasterIndiceRougeur, on_delete=models.CASCADE,
        related_name='pixels', verbose_name="Raster source",
    )
    valeur_rougeur = models.FloatField(
        blank=True, null=True,
        verbose_name="Valeur de l'indice de rougeur",
    )
    classe_rougeur = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name="Classe de rougeur",
    )

    class Meta:
        db_table = 'geopedologie_pixel_rougeur'
        verbose_name = 'Pixel — Indice de rougeur'
        verbose_name_plural = 'Pixels — Indice de rougeur'

    def __str__(self):
        return f"Rougeur : {self.valeur_rougeur}"


class PixelBrillance(CoucheBase):
    """Pixels/zones dérivés du raster d'indice de brillance."""
    raster = models.ForeignKey(
        RasterIndiceBrillance, on_delete=models.CASCADE,
        related_name='pixels', verbose_name="Raster source",
    )
    valeur_brillance = models.FloatField(
        blank=True, null=True,
        verbose_name="Valeur de l'indice de brillance",
    )
    classe_brillance = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name="Classe de brillance",
    )

    class Meta:
        db_table = 'geopedologie_pixel_brillance'
        verbose_name = 'Pixel — Indice de brillance'
        verbose_name_plural = 'Pixels — Indice de brillance'

    def __str__(self):
        return f"Brillance : {self.valeur_brillance}"


class PixelPente(CoucheBase):
    """Pixels/zones dérivés du raster de pente."""
    raster = models.ForeignKey(
        RasterPente, on_delete=models.CASCADE,
        related_name='pixels', verbose_name="Raster source",
    )
    valeur_pente = models.FloatField(
        blank=True, null=True,
        verbose_name="Valeur de pente (%)",
    )
    classe_pente = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name="Classe de pente",
    )

    class Meta:
        db_table = 'geopedologie_pixel_pente'
        verbose_name = 'Pixel — Pente'
        verbose_name_plural = 'Pixels — Pente'

    def __str__(self):
        return f"Pente : {self.valeur_pente}%"


class PixelSable(CoucheBase):
    """Pixels/zones dérivés du raster de la fraction sable."""
    raster = models.ForeignKey(
        RasterSable, on_delete=models.CASCADE,
        related_name='pixels', verbose_name="Raster source",
    )
    valeur_sable = models.FloatField(
        blank=True, null=True,
        verbose_name="Fraction sable (%)",
    )
    classe_sable = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name="Classe de sable",
    )

    class Meta:
        db_table = 'geopedologie_pixel_sable'
        verbose_name = 'Pixel — Sable'
        verbose_name_plural = 'Pixels — Sable'

    def __str__(self):
        return f"Sable : {self.valeur_sable}%"


# ===================================================================
# DONNÉES TERRAIN
# ===================================================================

class ProfilPedologique(PointBase):
    """
    Profil pédologique — sondage terrain avec description des horizons.
    """
    code_profil = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code du profil",
    )
    date_observation = models.DateField(
        blank=True, null=True,
        verbose_name="Date d'observation",
    )
    observateur = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Observateur",
    )
    profondeur_utile = models.FloatField(
        blank=True, null=True,
        verbose_name="Profondeur utile (cm)",
    )
    texture_dominante = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Texture dominante",
    )
    couleur_munsell = models.CharField(
        max_length=20, blank=True, default='',
        verbose_name="Couleur Munsell",
    )
    matiere_organique = models.FloatField(
        blank=True, null=True,
        verbose_name="Matière organique (%)",
    )
    ph = models.FloatField(
        blank=True, null=True,
        verbose_name="pH",
    )
    calcaire_total = models.FloatField(
        blank=True, null=True,
        verbose_name="Calcaire total (%)",
    )
    salinite = models.FloatField(
        blank=True, null=True,
        verbose_name="Salinité (dS/m)",
    )
    pierrosite = models.FloatField(
        blank=True, null=True,
        verbose_name="Pierrosité (%)",
    )
    hydromorphie = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Hydromorphie",
    )
    drainage = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Drainage",
    )
    remarques = models.TextField(
        blank=True, default='',
        verbose_name="Remarques",
    )

    class Meta:
        db_table = 'geopedologie_profil_pedologique'
        verbose_name = 'Profil pédologique'
        verbose_name_plural = 'Profils pédologiques'
        ordering = ['code_profil']

    def __str__(self):
        return f"Profil {self.code_profil}"


class ZoneHomogene(CoucheBase):
    """
    Zone pédologique homogène — unité spatiale regroupant des
    caractéristiques pédologiques similaires.
    """
    code_zone = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de la zone",
    )
    nom_zone = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Nom de la zone",
    )
    groupe_sol = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Groupe de sol",
    )
    sous_groupe = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Sous-groupe",
    )
    classe_sol = models.ForeignKey(
        'ClasseSol', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='zones_homogenes',
        verbose_name="Classe de sol",
    )
    aptitude_agricole = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Aptitude agricole",
    )
    facteur_limitant = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Facteur limitant principal",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )

    class Meta:
        db_table = 'geopedologie_zone_homogene'
        verbose_name = 'Zone homogène'
        verbose_name_plural = 'Zones homogènes'
        ordering = ['code_zone']

    def __str__(self):
        return f"Zone {self.code_zone} — {self.nom_zone}"


class ClasseSol(TraçabilitéMixin):
    """
    Classification pédologique (CPCS 1967, FAO, WRB).
    Table de référence non spatiale.
    """
    code_classe = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de la classe",
    )
    nom_classe = models.CharField(
        max_length=255,
        verbose_name="Nom de la classe de sol",
    )
    systeme_classification = models.CharField(
        max_length=50, default='CPCS',
        choices=[('CPCS', 'CPCS 1967'), ('FAO', 'FAO'), ('WRB', 'WRB')],
        verbose_name="Système de classification",
    )
    description = models.TextField(
        blank=True, default='',
        verbose_name="Description",
    )
    aptitude_agricole = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Aptitude agricole",
    )

    class Meta:
        db_table = 'geopedologie_classe_sol'
        verbose_name = 'Classe de sol'
        verbose_name_plural = 'Classes de sol'
        ordering = ['code_classe']

    def __str__(self):
        return f"{self.code_classe} — {self.nom_classe}"
