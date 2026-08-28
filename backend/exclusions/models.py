"""
Modèles — F. Exclusions.

Bloc « F. EXCLUSIONS » du MCD :
  - Zone_Urbanisable : documents d'urbanisme (SDAU, PA, PDAR)
  - Domaine_Forestier : forêts
  - Reseau_Routier : réseau routier
  - AVNA : zones à vocation non agricole
  - Statut_Foncier : statuts fonciers (melk, collectif, habous, domanial)

Ces couches sont potentiellement déclarables comme couches d'exclusion
(retrait du domaine classifiable). Cf. Prompt section 5.2.

Référence : MCD section « F. EXCLUSIONS », TDR chapitre 4.
"""

from django.contrib.gis.db import models
from common.models import CoucheBase, LigneBase, SRID_STOCKAGE


class ZoneUrbanisable(CoucheBase):
    """
    Zone urbanisable — emprise des documents d'urbanisme en vigueur.
    Couche d'exclusion par défaut (Prompt section 5.2).
    """
    code_zone = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de la zone",
    )
    nom_zone = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Nom de la zone",
    )
    type_document = models.CharField(
        max_length=20,
        choices=[
            ('SDAU', 'SDAU'),
            ('PA', 'Plan d\'Aménagement'),
            ('PDAR', 'PDAR'),
            ('AUTRE', 'Autre'),
        ],
        verbose_name="Type de document d'urbanisme",
    )
    reference_document = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Référence du document",
    )
    date_homologation = models.DateField(
        blank=True, null=True,
        verbose_name="Date d'homologation",
    )
    date_expiration = models.DateField(
        blank=True, null=True,
        verbose_name="Date d'expiration",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    est_en_vigueur = models.BooleanField(
        default=True,
        verbose_name="En vigueur",
    )
    organisme_elaboration = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Organisme d'élaboration",
    )
    vocation_zone = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Vocation de la zone",
        help_text="Résidentielle, industrielle, touristique…",
    )

    class Meta:
        db_table = 'exclusions_zone_urbanisable'
        verbose_name = 'Zone urbanisable'
        verbose_name_plural = 'Zones urbanisables'
        ordering = ['code_zone']

    def __str__(self):
        return f"Zone urb. {self.code_zone} ({self.type_document})"


class DomaineForestier(CoucheBase):
    """
    Domaine forestier — forêts et espaces boisés.
    Potentiellement déclarable comme couche d'exclusion.
    """
    code_foret = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de la forêt",
    )
    nom_foret = models.CharField(
        max_length=255,
        verbose_name="Nom de la forêt",
    )
    type_formation = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Type de formation (futaie, maquis, steppe…)",
    )
    espece_dominante = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Espèce dominante",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    statut_juridique = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Statut juridique",
    )
    plan_amenagement = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Plan d'aménagement",
    )
    etat_conservation = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="État de conservation",
    )

    class Meta:
        db_table = 'exclusions_domaine_forestier'
        verbose_name = 'Domaine forestier'
        verbose_name_plural = 'Domaines forestiers'
        ordering = ['nom_foret']

    def __str__(self):
        return f"Forêt {self.code_foret} — {self.nom_foret}"


class ReseauRoutier(LigneBase):
    """
    Réseau routier — routes nationales, régionales, provinciales, pistes.
    """
    code_route = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name="Code de la route",
    )
    nom_route = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Nom / numéro de la route",
    )
    type_route = models.CharField(
        max_length=50, blank=True, default='',
        choices=[
            ('nationale', 'Route nationale'),
            ('regionale', 'Route régionale'),
            ('provinciale', 'Route provinciale'),
            ('communale', 'Route communale'),
            ('piste', 'Piste'),
            ('autoroute', 'Autoroute'),
        ],
        verbose_name="Type de route",
    )
    revetement = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name="Revêtement (bitumé, terre…)",
    )
    longueur_km = models.FloatField(
        blank=True, null=True,
        verbose_name="Longueur (km)",
    )
    largeur_m = models.FloatField(
        blank=True, null=True,
        verbose_name="Largeur (m)",
    )
    etat = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="État de la route",
    )

    class Meta:
        db_table = 'exclusions_reseau_routier'
        verbose_name = 'Réseau routier'
        verbose_name_plural = 'Réseau routier'
        ordering = ['type_route', 'code_route']

    def __str__(self):
        return f"{self.type_route} {self.code_route} — {self.nom_route}"


class AVNA(CoucheBase):
    """
    Zone à Vocation Non Agricole (AVNA).
    """
    code_avna = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code AVNA",
    )
    nom = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Nom / description",
    )
    type_vocation = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Type de vocation",
        help_text="Industrielle, touristique, militaire, minière…",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    reference_juridique = models.CharField(
        max_length=500, blank=True, default='',
        verbose_name="Référence juridique",
    )
    date_declaration = models.DateField(
        blank=True, null=True,
        verbose_name="Date de déclaration",
    )

    class Meta:
        db_table = 'exclusions_avna'
        verbose_name = 'Zone à vocation non agricole (AVNA)'
        verbose_name_plural = 'Zones à vocation non agricole (AVNA)'
        ordering = ['code_avna']

    def __str__(self):
        return f"AVNA {self.code_avna}"


class StatutFoncier(CoucheBase):
    """
    Statut foncier — melk, collectif, habous, domanial.
    """
    code_foncier = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code foncier",
    )
    type_statut = models.CharField(
        max_length=50,
        choices=[
            ('melk', 'Melk (privé)'),
            ('collectif', 'Collectif'),
            ('habous', 'Habous'),
            ('domanial', 'Domanial'),
            ('guich', 'Guich'),
            ('autre', 'Autre'),
        ],
        verbose_name="Type de statut foncier",
    )
    numero_titre = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Numéro de titre foncier",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    proprietaire = models.CharField(
        max_length=500, blank=True, default='',
        verbose_name="Propriétaire / collectivité",
    )
    date_immatriculation = models.DateField(
        blank=True, null=True,
        verbose_name="Date d'immatriculation",
    )
    conservation_fonciere = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Conservation foncière",
    )
    observations = models.TextField(
        blank=True, default='',
        verbose_name="Observations",
    )

    class Meta:
        db_table = 'exclusions_statut_foncier'
        verbose_name = 'Statut foncier'
        verbose_name_plural = 'Statuts fonciers'
        ordering = ['code_foncier']

    def __str__(self):
        return f"Foncier {self.code_foncier} ({self.type_statut})"
