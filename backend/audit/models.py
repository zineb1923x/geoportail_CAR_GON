"""
Modèles — Journalisation et audit (M11).

Table d'audit unique pour tracer toutes les modifications :
  - Qui (utilisateur)
  - Quoi (entité, champ)
  - Quand (date/heure)
  - Avant/après (état)
  - Contexte (action, module, règle déclenchée…)

Référence : Prompt section 5.3 (journalisation des règles),
            Prompt section 6 (historique/audit par profil),
            TDR M11.
"""

from django.db import models
from django.conf import settings


ACTION_CHOICES = [
    ('create', 'Création'),
    ('update', 'Modification'),
    ('delete', 'Suppression'),
    ('validate', 'Validation'),
    ('publish', 'Publication (opposable)'),
    ('archive', 'Archivage'),
    ('restore', 'Restauration'),
    ('calcul', 'Calcul AMC/AHP'),
    ('forcage', 'Application de forçage'),
    ('exclusion', 'Application d\'exclusion'),
    ('login', 'Connexion'),
    ('logout', 'Déconnexion'),
    ('export', 'Export'),
    ('import', 'Import'),
]


class AuditLog(models.Model):
    """
    Table d'audit unique — journalisation de toutes les actions.
    """
    # Qui
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='audit_logs',
        verbose_name="Utilisateur",
    )
    role_utilisateur = models.CharField(
        max_length=20, blank=True, default='',
        verbose_name="Rôle au moment de l'action",
    )
    # Quoi
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        verbose_name="Type d'action",
    )
    module = models.CharField(
        max_length=50, blank=True, default='',
        verbose_name="Module concerné (M1-M13)",
    )
    app_label = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="App Django",
    )
    model_name = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="Modèle Django",
    )
    object_id = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name="ID de l'objet",
    )
    object_repr = models.CharField(
        max_length=500, blank=True, default='',
        verbose_name="Représentation de l'objet",
    )
    champ_modifie = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Champ modifié",
    )
    # Avant / Après
    valeur_avant = models.TextField(
        blank=True, default='',
        verbose_name="Valeur avant modification",
    )
    valeur_apres = models.TextField(
        blank=True, default='',
        verbose_name="Valeur après modification",
    )
    donnees_completes = models.JSONField(
        blank=True, null=True,
        verbose_name="Données complètes (snapshot JSON)",
    )
    # Contexte
    description = models.TextField(
        blank=True, default='',
        verbose_name="Description / justification",
    )
    regle_declenchee = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Règle déclenchée (si applicable)",
        help_text="Ex: forcage:PMH, exclusion:Zone_Urbanisable",
    )
    adresse_ip = models.GenericIPAddressField(
        blank=True, null=True,
        verbose_name="Adresse IP",
    )
    # Quand
    date_action = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Date de l'action",
    )

    class Meta:
        db_table = 'audit_log'
        verbose_name = 'Entrée d\'audit'
        verbose_name_plural = 'Journal d\'audit'
        ordering = ['-date_action']
        indexes = [
            models.Index(fields=['app_label', 'model_name', 'object_id']),
            models.Index(fields=['utilisateur', 'date_action']),
            models.Index(fields=['action', 'date_action']),
        ]

    def __str__(self):
        return (
            f"[{self.date_action:%Y-%m-%d %H:%M}] "
            f"{self.utilisateur or '?'} — {self.get_action_display()} "
            f"{self.model_name} #{self.object_id}"
        )
