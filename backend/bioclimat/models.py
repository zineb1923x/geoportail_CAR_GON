"""
Modèles — B. Bioclimat.

Bloc « B. BIOCLIMAT » du MCD :
  - Precipitation : données pluviométriques par station/zone
  - Temperature : données thermiques par station/zone
  - Etage_Bioclimatique : zonage bioclimatique (aride, semi-aride, etc.)

Référence : MCD section « B. BIOCLIMAT ».
"""

from django.contrib.gis.db import models
from common.models import CoucheBase, PointBase, SRID_STOCKAGE


class StationClimatique(PointBase):
    """
    Station climatique (point d'observation — pluviomètre, thermomètre).
    Table parente pour les mesures de précipitation et température.
    """
    code_station = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de la station",
    )
    nom_station = models.CharField(
        max_length=255,
        verbose_name="Nom de la station",
    )
    altitude = models.FloatField(
        blank=True, null=True,
        verbose_name="Altitude (m)",
    )
    organisme_gestionnaire = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Organisme gestionnaire",
    )
    date_mise_en_service = models.DateField(
        blank=True, null=True,
        verbose_name="Date de mise en service",
    )
    est_active = models.BooleanField(
        default=True,
        verbose_name="Station active",
    )

    class Meta:
        db_table = 'bioclimat_station_climatique'
        verbose_name = 'Station climatique'
        verbose_name_plural = 'Stations climatiques'
        ordering = ['code_station']

    def __str__(self):
        return f"Station {self.code_station} — {self.nom_station}"


class Precipitation(models.Model):
    """
    Données de précipitation par station et période.
    """
    station = models.ForeignKey(
        StationClimatique,
        on_delete=models.CASCADE,
        related_name='precipitations',
        verbose_name="Station",
    )
    annee = models.PositiveSmallIntegerField(
        verbose_name="Année",
    )
    mois = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Mois (1-12, null = annuel)",
    )
    precipitation_mm = models.FloatField(
        verbose_name="Précipitation (mm)",
    )
    nombre_jours_pluie = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Nombre de jours de pluie",
    )
    precipitation_max_24h = models.FloatField(
        blank=True, null=True,
        verbose_name="Précipitation max en 24h (mm)",
    )

    class Meta:
        db_table = 'bioclimat_precipitation'
        verbose_name = 'Précipitation'
        verbose_name_plural = 'Précipitations'
        unique_together = [('station', 'annee', 'mois')]
        ordering = ['station', '-annee', 'mois']

    def __str__(self):
        periode = f"{self.annee}/{self.mois}" if self.mois else str(self.annee)
        return f"{self.station.code_station} — {periode} : {self.precipitation_mm} mm"


class Temperature(models.Model):
    """
    Données de température par station et période.
    """
    station = models.ForeignKey(
        StationClimatique,
        on_delete=models.CASCADE,
        related_name='temperatures',
        verbose_name="Station",
    )
    annee = models.PositiveSmallIntegerField(
        verbose_name="Année",
    )
    mois = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Mois (1-12, null = annuel)",
    )
    temperature_moyenne = models.FloatField(
        verbose_name="Température moyenne (°C)",
    )
    temperature_min = models.FloatField(
        blank=True, null=True,
        verbose_name="Température minimale (°C)",
    )
    temperature_max = models.FloatField(
        blank=True, null=True,
        verbose_name="Température maximale (°C)",
    )
    amplitude_thermique = models.FloatField(
        blank=True, null=True,
        verbose_name="Amplitude thermique (°C)",
    )

    class Meta:
        db_table = 'bioclimat_temperature'
        verbose_name = 'Température'
        verbose_name_plural = 'Températures'
        unique_together = [('station', 'annee', 'mois')]
        ordering = ['station', '-annee', 'mois']

    def __str__(self):
        periode = f"{self.annee}/{self.mois}" if self.mois else str(self.annee)
        return f"{self.station.code_station} — {periode} : {self.temperature_moyenne}°C"


class EtageBioclimatique(CoucheBase):
    """
    Zonage bioclimatique de la région.
    Ex : aride, semi-aride, saharien, etc.
    """
    code_etage = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de l'étage bioclimatique",
    )
    nom_etage = models.CharField(
        max_length=255,
        verbose_name="Nom de l'étage bioclimatique",
    )
    type_climat = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Type de climat",
    )
    precipitation_annuelle_min = models.FloatField(
        blank=True, null=True,
        verbose_name="Précipitation annuelle min (mm)",
    )
    precipitation_annuelle_max = models.FloatField(
        blank=True, null=True,
        verbose_name="Précipitation annuelle max (mm)",
    )
    temperature_moyenne_min = models.FloatField(
        blank=True, null=True,
        verbose_name="Température moyenne min (°C)",
    )
    temperature_moyenne_max = models.FloatField(
        blank=True, null=True,
        verbose_name="Température moyenne max (°C)",
    )
    indice_aridite = models.FloatField(
        blank=True, null=True,
        verbose_name="Indice d'aridité",
    )
    quotient_emberger = models.FloatField(
        blank=True, null=True,
        verbose_name="Quotient d'Emberger (Q2)",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    description = models.TextField(
        blank=True, default='',
        verbose_name="Description",
    )

    class Meta:
        db_table = 'bioclimat_etage_bioclimatique'
        verbose_name = 'Étage bioclimatique'
        verbose_name_plural = 'Étages bioclimatiques'
        ordering = ['code_etage']

    def __str__(self):
        return f"{self.code_etage} — {self.nom_etage}"
