"""
Modèles — C. Ressources en eau.

Bloc « C. RESSOURCES EN EAU » du MCD :
  - Nappe_Phreatique : limites des nappes souterraines
  - Piezometre : points de mesure piézométrique
  - Profondeur_Nappe : relevés de profondeur (séries temporelles)
  - Barrage : barrages et retenues
  - Reseau_Hydrographique : cours d'eau (linéaire)

Référence : MCD section « C. RESSOURCES EN EAU », TDR chapitre 4 « Ressources en eau ».
"""

from django.contrib.gis.db import models
from common.models import CoucheBase, PointBase, LigneBase, SRID_STOCKAGE


class NappePhreatique(CoucheBase):
    """
    Nappe phréatique — limites de l'aquifère.
    """
    code_nappe = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de la nappe",
    )
    nom_nappe = models.CharField(
        max_length=255,
        verbose_name="Nom de la nappe",
    )
    type_nappe = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Type de nappe (libre/captive)",
    )
    profondeur_moyenne = models.FloatField(
        blank=True, null=True,
        verbose_name="Profondeur moyenne (m)",
    )
    debit_exploitation = models.FloatField(
        blank=True, null=True,
        verbose_name="Débit d'exploitation (l/s)",
    )
    qualite_eau = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Qualité de l'eau",
    )
    salinite = models.FloatField(
        blank=True, null=True,
        verbose_name="Salinité (g/l)",
    )
    superficie_km2 = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (km²)",
    )
    bassin_hydraulique = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Bassin hydraulique",
    )
    etat_exploitation = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="État d'exploitation",
    )

    class Meta:
        db_table = 'ressources_eau_nappe_phreatique'
        verbose_name = 'Nappe phréatique'
        verbose_name_plural = 'Nappes phréatiques'
        ordering = ['code_nappe']

    def __str__(self):
        return f"Nappe {self.code_nappe} — {self.nom_nappe}"


class Piezometre(PointBase):
    """
    Piézomètre — point de mesure du niveau de la nappe.
    """
    code_piezometre = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code du piézomètre",
    )
    nom = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Nom / localisation",
    )
    nappe = models.ForeignKey(
        NappePhreatique,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='piezometres',
        verbose_name="Nappe associée",
    )
    altitude_sol = models.FloatField(
        blank=True, null=True,
        verbose_name="Altitude du sol (m)",
    )
    profondeur_forage = models.FloatField(
        blank=True, null=True,
        verbose_name="Profondeur du forage (m)",
    )
    date_installation = models.DateField(
        blank=True, null=True,
        verbose_name="Date d'installation",
    )
    est_actif = models.BooleanField(
        default=True,
        verbose_name="Actif",
    )
    organisme_gestionnaire = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Organisme gestionnaire",
    )

    class Meta:
        db_table = 'ressources_eau_piezometre'
        verbose_name = 'Piézomètre'
        verbose_name_plural = 'Piézomètres'
        ordering = ['code_piezometre']

    def __str__(self):
        return f"Piézo {self.code_piezometre}"


class ProfondeurNappe(models.Model):
    """
    Relevé de profondeur de nappe (série temporelle par piézomètre).
    """
    piezometre = models.ForeignKey(
        Piezometre,
        on_delete=models.CASCADE,
        related_name='releves_profondeur',
        verbose_name="Piézomètre",
    )
    date_releve = models.DateField(
        verbose_name="Date du relevé",
    )
    profondeur_m = models.FloatField(
        verbose_name="Profondeur (m)",
    )
    niveau_statique = models.FloatField(
        blank=True, null=True,
        verbose_name="Niveau statique (m NGM)",
    )
    niveau_dynamique = models.FloatField(
        blank=True, null=True,
        verbose_name="Niveau dynamique (m NGM)",
    )
    methode_mesure = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Méthode de mesure",
    )

    class Meta:
        db_table = 'ressources_eau_profondeur_nappe'
        verbose_name = 'Profondeur de nappe'
        verbose_name_plural = 'Profondeurs de nappe'
        unique_together = [('piezometre', 'date_releve')]
        ordering = ['piezometre', '-date_releve']

    def __str__(self):
        return f"{self.piezometre.code_piezometre} — {self.date_releve} : {self.profondeur_m}m"


class Barrage(CoucheBase):
    """
    Barrage ou retenue d'eau.
    """
    code_barrage = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code du barrage",
    )
    nom_barrage = models.CharField(
        max_length=255,
        verbose_name="Nom du barrage",
    )
    type_barrage = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Type de barrage",
    )
    capacite_mm3 = models.FloatField(
        blank=True, null=True,
        verbose_name="Capacité (Mm³)",
    )
    volume_regularise_mm3 = models.FloatField(
        blank=True, null=True,
        verbose_name="Volume régularisé (Mm³)",
    )
    cours_eau = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Cours d'eau / Oued",
    )
    annee_mise_service = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Année de mise en service",
    )
    hauteur_m = models.FloatField(
        blank=True, null=True,
        verbose_name="Hauteur de la digue (m)",
    )
    superficie_retenue_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie de la retenue (ha)",
    )
    usage_principal = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Usage principal (irrigation, AEP, énergie…)",
    )

    class Meta:
        db_table = 'ressources_eau_barrage'
        verbose_name = 'Barrage'
        verbose_name_plural = 'Barrages'
        ordering = ['nom_barrage']

    def __str__(self):
        return f"Barrage {self.nom_barrage}"


class ReseauHydrographique(LigneBase):
    """
    Réseau hydrographique — cours d'eau, oueds.
    """
    code_cours_eau = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name="Code du cours d'eau",
    )
    nom_cours_eau = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Nom du cours d'eau / oued",
    )
    type_cours_eau = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Type (permanent/temporaire/intermittent)",
    )
    ordre_strahler = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Ordre de Strahler",
    )
    longueur_km = models.FloatField(
        blank=True, null=True,
        verbose_name="Longueur (km)",
    )
    bassin_versant = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Bassin versant",
    )

    class Meta:
        db_table = 'ressources_eau_reseau_hydrographique'
        verbose_name = 'Réseau hydrographique'
        verbose_name_plural = 'Réseaux hydrographiques'
        ordering = ['nom_cours_eau']

    def __str__(self):
        return self.nom_cours_eau or f"Cours d'eau {self.code_cours_eau}"
