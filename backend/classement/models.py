"""
Modèles — Classement A/B/C et Carte Agricole.

Ce module est le cœur métier du Géoportail. Il contient :
  - ClasseA, ClasseB, ClasseC : résultats géométriques du classement
  - UniteCarteAgricole : table pivot de sortie (synthèse complète)
  - RegleClassement : règles de forçage/exclusion (Prompt section 5)
  - ScenarioAMC : scénarios de modélisation AMC/AHP

Référence : MCD sections « CLASSEMENT A B C » et « Carte agricole »,
            Prompt sections 5.1, 5.2, 5.3.
"""

from django.contrib.gis.db import models
from django.conf import settings
from common.models import CoucheBase, TraçabilitéMixin, SRID_STOCKAGE


# ===================================================================
# CLASSES A / B / C — résultats géométriques du classement
# ===================================================================

class ClasseA(CoucheBase):
    """
    Terre de catégorie A (vert foncé) — haute aptitude agricole.
    Inclut les terres classées A par score IPA ET par forçage.
    """
    code_unite = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de l'unité",
    )
    score_ipa = models.FloatField(
        blank=True, null=True,
        verbose_name="Score IPA calculé",
    )
    motif_classement = models.CharField(
        max_length=255, blank=True, default='seuillage_ipa',
        verbose_name="Motif du classement",
        help_text="seuillage_ipa, forcage:PMH, forcage:GH, etc.",
    )
    est_force = models.BooleanField(
        default=False,
        verbose_name="Classé par forçage",
    )
    couche_forcante = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Couche forçante (si forçage)",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    scenario = models.ForeignKey(
        'ScenarioAMC',
        on_delete=models.CASCADE,
        related_name='classes_a',
        verbose_name="Scénario",
    )

    class Meta:
        db_table = 'classement_classe_a'
        verbose_name = 'Classe A'
        verbose_name_plural = 'Classes A'
        ordering = ['code_unite']

    def __str__(self):
        suffix = f" (forcé: {self.couche_forcante})" if self.est_force else ""
        return f"Classe A — {self.code_unite}{suffix}"


class ClasseB(CoucheBase):
    """
    Terre de catégorie B (vert clair) — aptitude agricole moyenne.
    """
    code_unite = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de l'unité",
    )
    score_ipa = models.FloatField(
        blank=True, null=True,
        verbose_name="Score IPA calculé",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    facteur_limitant = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Facteur limitant principal",
    )
    scenario = models.ForeignKey(
        'ScenarioAMC',
        on_delete=models.CASCADE,
        related_name='classes_b',
        verbose_name="Scénario",
    )

    class Meta:
        db_table = 'classement_classe_b'
        verbose_name = 'Classe B'
        verbose_name_plural = 'Classes B'
        ordering = ['code_unite']

    def __str__(self):
        return f"Classe B — {self.code_unite}"


class ClasseC(CoucheBase):
    """
    Terre de catégorie C (jaune) — faible aptitude agricole.
    """
    code_unite = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de l'unité",
    )
    score_ipa = models.FloatField(
        blank=True, null=True,
        verbose_name="Score IPA calculé",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    facteur_limitant = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Facteur limitant principal",
    )
    scenario = models.ForeignKey(
        'ScenarioAMC',
        on_delete=models.CASCADE,
        related_name='classes_c',
        verbose_name="Scénario",
    )

    class Meta:
        db_table = 'classement_classe_c'
        verbose_name = 'Classe C'
        verbose_name_plural = 'Classes C'
        ordering = ['code_unite']

    def __str__(self):
        return f"Classe C — {self.code_unite}"


# ===================================================================
# UNITE CARTE AGRICOLE — table pivot de sortie
# ===================================================================

CATEGORIE_CHOICES = [
    ('A', 'Catégorie A — Haute aptitude'),
    ('B', 'Catégorie B — Aptitude moyenne'),
    ('C', 'Catégorie C — Faible aptitude'),
    ('HC', 'Hors classement'),
]

MOTIF_HORS_CLASSEMENT_CHOICES = [
    ('zone_urbanisable', 'Zone urbanisable'),
    ('domaine_forestier', 'Domaine forestier'),
    ('reseau_routier', 'Réseau routier'),
    ('avna', 'Zone à vocation non agricole'),
    ('autre', 'Autre motif d\'exclusion'),
]


class UniteCarteAgricole(CoucheBase):
    """
    Table pivot de sortie du classement — synthèse complète.
    Chaque enregistrement représente une unité de la carte agricole
    avec sa classification finale, son score IPA, les risques identifiés,
    le groupe de sol, le facteur limitant et la justification.
    """
    code_unite = models.CharField(
        max_length=50, unique=True,
        verbose_name="Code de l'unité cartographique",
    )
    # Classification
    categorie = models.CharField(
        max_length=2,
        choices=CATEGORIE_CHOICES,
        verbose_name="Catégorie (A/B/C/HC)",
    )
    score_ipa = models.FloatField(
        blank=True, null=True,
        verbose_name="Score IPA final",
    )
    # Forçage
    est_force = models.BooleanField(
        default=False,
        verbose_name="Classé par forçage",
    )
    motif_forcage = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Motif du forçage",
        help_text="Ex: forcage:PMH, forcage:GH",
    )
    # Exclusion
    est_hors_classement = models.BooleanField(
        default=False,
        verbose_name="Hors classement (exclusion)",
    )
    motif_exclusion = models.CharField(
        max_length=100, blank=True, default='',
        choices=MOTIF_HORS_CLASSEMENT_CHOICES,
        verbose_name="Motif d'exclusion",
    )
    source_exclusion = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Source réglementaire d'exclusion",
    )
    # Détails pédologiques
    groupe_sol = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Groupe de sol",
    )
    facteur_limitant = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Facteur limitant principal",
    )
    risque = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Risque identifié",
    )
    justification = models.TextField(
        blank=True, default='',
        verbose_name="Justification du classement",
    )
    # Métadonnées cartographiques
    echelle = models.CharField(
        max_length=50, default='1/25000',
        verbose_name="Échelle de la carte",
    )
    projection = models.CharField(
        max_length=100, default='Merchich / Sud Maroc (EPSG:26192)',
        verbose_name="Projection",
    )
    date_classement = models.DateField(
        blank=True, null=True,
        verbose_name="Date du classement",
    )
    superficie_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Superficie (ha)",
    )
    # Scores normalisés par critère (0.0 à 1.0)
    # Utilisés par le moteur AMC pour le calcul IPA = SUM(poids_i * score_i)
    score_eau = models.FloatField(
        blank=True, null=True, default=0.5,
        verbose_name="Score eau (0-1)",
        help_text="Proximité aux ressources en eau, normalisé 0-1.",
    )
    score_sol = models.FloatField(
        blank=True, null=True, default=0.5,
        verbose_name="Score sol (0-1)",
        help_text="Qualité pédologique, normalisé 0-1.",
    )
    score_clim = models.FloatField(
        blank=True, null=True, default=0.5,
        verbose_name="Score climat (0-1)",
        help_text="Aptitude climatique, normalisé 0-1.",
    )
    score_occ = models.FloatField(
        blank=True, null=True, default=0.5,
        verbose_name="Score occupation du sol (0-1)",
        help_text="Occupation du sol actuelle, normalisé 0-1.",
    )
    score_cont = models.FloatField(
        blank=True, null=True, default=0.5,
        verbose_name="Score contraintes (0-1)",
        help_text="Contraintes physiques (pente, érosion), normalisé 0-1.",
    )
    # Scénario
    scenario = models.ForeignKey(
        'ScenarioAMC',
        on_delete=models.CASCADE,
        related_name='unites',
        verbose_name="Scénario source",
    )
    est_car_validee = models.BooleanField(
        default=False,
        verbose_name="Fait partie de la CAR validée (référentiel opposable)",
    )

    class Meta:
        db_table = 'classement_unite_carte_agricole'
        verbose_name = 'Unité de carte agricole'
        verbose_name_plural = 'Unités de carte agricole'
        ordering = ['code_unite']

    def __str__(self):
        return f"UCA {self.code_unite} — {self.categorie}"


# ===================================================================
# RÈGLES DE CLASSEMENT — forçage / exclusion (Prompt section 5.3)
# ===================================================================

TYPE_REGLE_CHOICES = [
    ('forcage_A', 'Forçage en catégorie A'),
    ('forcage_B', 'Forçage en catégorie B'),
    ('exclusion', 'Exclusion (hors classement)'),
]


class RegleClassement(models.Model):
    """
    Table des règles de forçage/exclusion.
    Administrée par l'Administrateur (M3/M11).
    Consultée par le moteur M6 avant et après le calcul IPA.

    Cf. Prompt section 5.3 :
    regle_classement(id, couche_source, type_regle, actif, auteur, date_maj)
    """
    couche_source = models.ForeignKey(
        'referentiel.CoucheCatalogue',
        on_delete=models.CASCADE,
        related_name='regles_classement',
        verbose_name="Couche source",
        help_text="La couche dont les géométries déclenchent la règle.",
    )
    type_regle = models.CharField(
        max_length=20,
        choices=TYPE_REGLE_CHOICES,
        verbose_name="Type de règle",
    )
    description = models.TextField(
        blank=True, default='',
        verbose_name="Description de la règle",
    )
    priorite = models.PositiveSmallIntegerField(
        default=10,
        verbose_name="Priorité (plus petit = plus prioritaire)",
        help_text="L'exclusion prime sur le forçage (section 5.2).",
    )
    actif = models.BooleanField(
        default=True,
        verbose_name="Règle active",
    )
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Auteur",
    )
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création",
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de dernière modification",
    )

    class Meta:
        db_table = 'classement_regle_classement'
        verbose_name = 'Règle de classement'
        verbose_name_plural = 'Règles de classement'
        ordering = ['priorite', 'type_regle']

    def __str__(self):
        etat = "✅" if self.actif else "❌"
        return f"{etat} [{self.type_regle}] {self.couche_source}"


# ===================================================================
# SCÉNARIO AMC — simulation de classement
# ===================================================================

MOTEUR_SCORING_CHOICES = [
    ('ahp', 'AHP (Analytic Hierarchy Process)'),
    ('ponderation', 'Pondération directe'),
    ('floue', 'Logique floue'),
    ('fao', 'FAO'),
    ('ml', 'Machine Learning'),
    ('autre', 'Autre'),
]


class ScenarioAMC(TraçabilitéMixin):
    """
    Scénario de modélisation AMC/AHP.
    Peut être en simulation (non publié) ou validé (CAR opposable).
    """
    nom = models.CharField(
        max_length=255,
        verbose_name="Nom du scénario",
    )
    description = models.TextField(
        blank=True, default='',
        verbose_name="Description",
    )
    moteur_scoring = models.CharField(
        max_length=20,
        choices=MOTEUR_SCORING_CHOICES,
        default='ahp',
        verbose_name="Moteur de scoring",
    )
    # Paramètres AMC
    criteres = models.JSONField(
        blank=True, null=True,
        verbose_name="Critères",
        help_text="Liste des critères avec leur configuration.",
    )
    poids = models.JSONField(
        blank=True, null=True,
        verbose_name="Poids (pondérations)",
        help_text="Pondérations des critères. Ex: {sol: 35, eau: 25, …}",
    )
    seuils = models.JSONField(
        blank=True, null=True,
        verbose_name="Seuils A/B/C",
        help_text="Ex: {seuil_A: 70, seuil_B: 45}",
    )
    matrice_comparaison = models.JSONField(
        blank=True, null=True,
        verbose_name="Matrice de comparaison par paires (AHP)",
    )
    ratio_coherence = models.FloatField(
        blank=True, null=True,
        verbose_name="Ratio de cohérence (RC)",
    )
    parametres_supplementaires = models.JSONField(
        blank=True, null=True,
        verbose_name="Paramètres supplémentaires du moteur",
    )
    # Résultats
    surface_a_calculee_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Surface A calculée (ha)",
    )
    surface_a_forcee_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Surface A forcée (ha)",
    )
    surface_b_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Surface B (ha)",
    )
    surface_c_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Surface C (ha)",
    )
    surface_hors_classement_ha = models.FloatField(
        blank=True, null=True,
        verbose_name="Surface hors classement (ha)",
    )
    nombre_unites = models.PositiveIntegerField(
        blank=True, null=True,
        verbose_name="Nombre d'unités classées",
    )
    # Statut
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='scenarios_amc',
        verbose_name="Auteur",
    )
    est_car_validee = models.BooleanField(
        default=False,
        verbose_name="Est la CAR validée (référentiel opposable)",
    )
    date_calcul = models.DateTimeField(
        blank=True, null=True,
        verbose_name="Date du dernier calcul",
    )
    duree_calcul_secondes = models.FloatField(
        blank=True, null=True,
        verbose_name="Durée du calcul (secondes)",
    )

    class Meta:
        db_table = 'classement_scenario_amc'
        verbose_name = 'Scénario AMC'
        verbose_name_plural = 'Scénarios AMC'
        ordering = ['-date_creation']

    def __str__(self):
        statut = '✅ CAR validée' if self.est_car_validee else '🔬 Simulation'
        return f"{self.nom} ({statut})"
