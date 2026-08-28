"""
Modèles — D. Occupation agricole.

Bloc « D. OCCUPATION AGRICOLE » du MCD :
  - PPP : Périmètres de Petite et Moyenne Production
  - PMH : Petite et Moyenne Hydraulique
  - PI : Périmètres Irrigués (Grande Hydraulique)
  - Zone_Oasienne : zones oasiennes
  - Plantation : plantations (arboriculture, etc.)
  - PMV : projets Plan Maroc Vert

Référence : MCD section « D. OCCUPATION AGRICOLE », TDR chapitre 4.
"""

from django.contrib.gis.db import models
from common.models import CoucheBase, SRID_STOCKAGE


class PerimetreIrrigue(CoucheBase):
    """
    Périmètre irrigué en Grande Hydraulique (GH).
    Correspond à « Périmètres irrigués GH » du TDR chapitre 4.
    """
    code_perimetre = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code du périmètre",
    )
    nom_perimetre = models.CharField(
        max_length=255,
        verbose_name="Nom du périmètre",
    )
    type_irrigation = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Type d'irrigation",
    )
    superficie_equipee_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie équipée (ha)",
    )
    superficie_irriguee_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie irriguée (ha)",
    )
    barrage_source = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Barrage / source d'eau",
    )
    organisme_gestionnaire = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Organisme gestionnaire (ORMVA, etc.)",
    )
    annee_creation = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Année de création",
    )
    cultures_principales = models.TextField(
        blank=True, default='',
        verbose_name="Cultures principales",
    )

    class Meta:
        db_table = 'occupation_agricole_perimetre_irrigue'
        verbose_name = 'Périmètre irrigué (GH)'
        verbose_name_plural = 'Périmètres irrigués (GH)'
        ordering = ['nom_perimetre']

    def __str__(self):
        return f"PI {self.code_perimetre} — {self.nom_perimetre}"


class PMH(CoucheBase):
    """
    Petite et Moyenne Hydraulique.
    Peut être marquée comme couche forçante A (cf. Prompt section 5.1).
    """
    code_pmh = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code PMH",
    )
    nom_pmh = models.CharField(
        max_length=255,
        verbose_name="Nom du périmètre PMH",
    )
    type_amenagement = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Type d'aménagement",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    source_eau = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Source d'eau",
    )
    nombre_beneficiaires = models.PositiveIntegerField(
        blank=True, null=True,
        verbose_name="Nombre de bénéficiaires",
    )
    etat_fonctionnement = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="État de fonctionnement",
    )
    annee_amenagement = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Année d'aménagement",
    )
    cultures_principales = models.TextField(
        blank=True, default='',
        verbose_name="Cultures principales",
    )

    class Meta:
        db_table = 'occupation_agricole_pmh'
        verbose_name = 'PMH (Petite et Moyenne Hydraulique)'
        verbose_name_plural = 'PMH (Petite et Moyenne Hydraulique)'
        ordering = ['nom_pmh']

    def __str__(self):
        return f"PMH {self.code_pmh} — {self.nom_pmh}"


class PPP(CoucheBase):
    """
    Périmètre de Pompage Privé / Périmètre de Petite Production.
    """
    code_ppp = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code PPP",
    )
    nom_ppp = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Nom",
    )
    type_pompage = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Type de pompage",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    debit_l_s = models.FloatField(
        blank=True, null=True,
        verbose_name="Débit (l/s)",
    )
    profondeur_puits_m = models.FloatField(
        blank=True, null=True,
        verbose_name="Profondeur du puits (m)",
    )
    cultures_principales = models.TextField(
        blank=True, default='',
        verbose_name="Cultures principales",
    )

    class Meta:
        db_table = 'occupation_agricole_ppp'
        verbose_name = 'PPP (Pompage privé)'
        verbose_name_plural = 'PPP (Pompage privé)'
        ordering = ['code_ppp']

    def __str__(self):
        return f"PPP {self.code_ppp}"


class IrrigationPrivee(CoucheBase):
    """
    Irrigation privée — parcelles irriguées par initiative privée.
    """
    code = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code",
    )
    nom = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Nom / localisation",
    )
    type_irrigation = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Type d'irrigation",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    source_eau = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Source d'eau",
    )
    cultures_principales = models.TextField(
        blank=True, default='',
        verbose_name="Cultures principales",
    )

    class Meta:
        db_table = 'occupation_agricole_irrigation_privee'
        verbose_name = 'Irrigation privée'
        verbose_name_plural = 'Irrigations privées'

    def __str__(self):
        return f"Irrig. privée {self.code}"


class ZoneOasienne(CoucheBase):
    """
    Zone oasienne — palmeraie et espace oasien.
    """
    code_oasis = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de l'oasis",
    )
    nom_oasis = models.CharField(
        max_length=255,
        verbose_name="Nom de l'oasis",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    nombre_palmiers = models.PositiveIntegerField(
        blank=True, null=True,
        verbose_name="Nombre de palmiers",
    )
    varietes_principales = models.TextField(
        blank=True, default='',
        verbose_name="Variétés principales",
    )
    etat_palmeraie = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="État de la palmeraie",
    )
    systeme_irrigation = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Système d'irrigation (khettara, séguia…)",
    )

    class Meta:
        db_table = 'occupation_agricole_zone_oasienne'
        verbose_name = 'Zone oasienne'
        verbose_name_plural = 'Zones oasiennes'
        ordering = ['nom_oasis']

    def __str__(self):
        return f"Oasis {self.nom_oasis}"


class Plantation(CoucheBase):
    """
    Plantation — arboriculture fruitière, reboisement, etc.
    """
    code_plantation = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de la plantation",
    )
    nom_plantation = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Nom de la plantation",
    )
    type_plantation = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Type (arboriculture, reboisement…)",
    )
    espece_principale = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Espèce principale",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    annee_plantation = models.PositiveSmallIntegerField(
        blank=True, null=True,
        verbose_name="Année de plantation",
    )
    densite_arbres_ha = models.PositiveIntegerField(
        blank=True, null=True,
        verbose_name="Densité (arbres/ha)",
    )
    etat = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="État de la plantation",
    )

    class Meta:
        db_table = 'occupation_agricole_plantation'
        verbose_name = 'Plantation'
        verbose_name_plural = 'Plantations'
        ordering = ['code_plantation']

    def __str__(self):
        return f"Plantation {self.code_plantation} — {self.espece_principale}"


class ProjetPMV(CoucheBase):
    """
    Projets Plan Maroc Vert — Pilier I et Pilier II.
    Couvre aussi les projets MCA, PMVB.
    """
    code_projet = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code du projet",
    )
    nom_projet = models.CharField(
        max_length=500,
        verbose_name="Nom du projet",
    )
    pilier = models.CharField(
        max_length=10, blank=True, default='',
        choices=[('I', 'Pilier I'), ('II', 'Pilier II')],
        verbose_name="Pilier PMV",
    )
    type_projet = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Type de projet",
        help_text="PMV, MCA, PMVB, etc.",
    )
    filiere = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Filière",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    nombre_beneficiaires = models.PositiveIntegerField(
        blank=True, null=True,
        verbose_name="Nombre de bénéficiaires",
    )
    cout_investissement = models.FloatField(
        blank=True, null=True,
        verbose_name="Coût d'investissement (MDH)",
    )
    date_debut = models.DateField(
        blank=True, null=True,
        verbose_name="Date de début",
    )
    date_fin = models.DateField(
        blank=True, null=True,
        verbose_name="Date de fin prévue",
    )
    taux_realisation = models.FloatField(
        blank=True, null=True,
        verbose_name="Taux de réalisation (%)",
    )
    etat_projet = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="État du projet",
    )

    class Meta:
        db_table = 'occupation_agricole_projet_pmv'
        verbose_name = 'Projet PMV'
        verbose_name_plural = 'Projets PMV'
        ordering = ['code_projet']

    def __str__(self):
        return f"PMV {self.code_projet} — {self.nom_projet}"
