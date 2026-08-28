"""
Modèles — Limites administratives.

Bloc « Limites administratives » du MCD :
  Province et Commune (rattachée à Province).

Référence : MCD section « LIMITE ADMINISTRATION », TDR chapitre 4 socle transverse.
"""

from django.contrib.gis.db import models
from common.models import TraçabilitéMixin, SRID_STOCKAGE


class Province(TraçabilitéMixin):
    """Province de la région Guelmim-Oued Noun."""
    code_province = models.CharField(
        max_length=10, unique=True,
        verbose_name="Code province",
    )
    nom_province = models.CharField(
        max_length=255,
        verbose_name="Nom de la province",
    )
    nom_province_ar = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Nom de la province (arabe)",
    )
    chef_lieu = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Chef-lieu",
    )
    superficie_km2 = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (km²)",
    )
    population = models.PositiveIntegerField(
        blank=True, null=True,
        verbose_name="Population",
    )
    annee_recensement = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Année du recensement",
    )
    geom = models.MultiPolygonField(
        srid=SRID_STOCKAGE,
        verbose_name="Géométrie",
    )

    class Meta:
        db_table = 'administration_province'
        verbose_name = 'Province'
        verbose_name_plural = 'Provinces'
        ordering = ['nom_province']

    def __str__(self):
        return f"{self.code_province} — {self.nom_province}"


class Commune(TraçabilitéMixin):
    """Commune rattachée à une Province."""
    code_commune = models.CharField(
        max_length=20, unique=True,
        verbose_name="Code commune",
    )
    nom_commune = models.CharField(
        max_length=255,
        verbose_name="Nom de la commune",
    )
    nom_commune_ar = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Nom de la commune (arabe)",
    )
    province = models.ForeignKey(
        Province,
        on_delete=models.CASCADE,
        related_name='communes',
        verbose_name="Province",
    )
    type_commune = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name="Type (urbaine/rurale)",
    )
    superficie_km2 = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (km²)",
    )
    population = models.PositiveIntegerField(
        blank=True, null=True,
        verbose_name="Population",
    )
    annee_recensement = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Année du recensement",
    )
    geom = models.MultiPolygonField(
        srid=SRID_STOCKAGE,
        verbose_name="Géométrie",
    )

    class Meta:
        db_table = 'administration_commune'
        verbose_name = 'Commune'
        verbose_name_plural = 'Communes'
        ordering = ['nom_commune']

    def __str__(self):
        return f"{self.code_commune} — {self.nom_commune}"
