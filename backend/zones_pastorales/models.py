"""
Modèles — E. Zones pastorales.

Bloc « E. ZONES PASTORALES » du MCD :
  - Site_Amelioration_Pastorale : sites d'amélioration pastorale
  - Zone_Pastorale : zones de parcours

Référence : MCD section « E. ZONES PASTORALES », TDR chapitre 4.
"""

from django.contrib.gis.db import models
from common.models import CoucheBase, PointBase, SRID_STOCKAGE


class ZonePastorale(CoucheBase):
    """
    Zone de parcours pastoral.
    """
    code_zone = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de la zone pastorale",
    )
    nom_zone = models.CharField(
        max_length=255,
        verbose_name="Nom de la zone",
    )
    type_parcours = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Type de parcours",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    especes_dominantes = models.TextField(
        blank=True, default='',
        verbose_name="Espèces dominantes",
    )
    charge_animale = models.FloatField(
        blank=True, null=True,
        verbose_name="Charge animale (UPB/ha)",
    )
    etat_degradation = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="État de dégradation",
    )
    type_sol = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Type de sol",
    )
    pluviometrie_moyenne = models.FloatField(
        blank=True, null=True,
        verbose_name="Pluviométrie moyenne (mm/an)",
    )
    tribu_usage = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Tribu / groupe d'usage",
    )

    class Meta:
        db_table = 'zones_pastorales_zone_pastorale'
        verbose_name = 'Zone pastorale'
        verbose_name_plural = 'Zones pastorales'
        ordering = ['code_zone']

    def __str__(self):
        return f"Zone pastorale {self.code_zone} — {self.nom_zone}"


class SiteAmeliorationPastorale(CoucheBase):
    """
    Site d'amélioration pastorale.
    """
    code_site = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code du site",
    )
    nom_site = models.CharField(
        max_length=255,
        verbose_name="Nom du site",
    )
    zone_pastorale = models.ForeignKey(
        ZonePastorale,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='sites_amelioration',
        verbose_name="Zone pastorale parente",
    )
    type_amelioration = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Type d'amélioration",
        help_text="Ensemencement, mise en défens, plantation arbustive…",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    annee_realisation = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Année de réalisation",
    )
    especes_introduites = models.TextField(
        blank=True, default='',
        verbose_name="Espèces introduites",
    )
    maitre_ouvrage = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Maître d'ouvrage",
    )
    cout_investissement = models.FloatField(
        blank=True, null=True,
        verbose_name="Coût d'investissement (MDH)",
    )
    etat_site = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="État du site",
    )
    nombre_beneficiaires = models.PositiveIntegerField(
        blank=True, null=True,
        verbose_name="Nombre de bénéficiaires",
    )

    class Meta:
        db_table = 'zones_pastorales_site_amelioration'
        verbose_name = 'Site d\'amélioration pastorale'
        verbose_name_plural = 'Sites d\'amélioration pastorale'
        ordering = ['code_site']

    def __str__(self):
        return f"SAP {self.code_site} — {self.nom_site}"
