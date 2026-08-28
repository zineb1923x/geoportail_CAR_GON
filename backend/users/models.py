"""
Modèle utilisateur enrichi — Géoportail Agricole CAR-GON.

Profils conformes à la matrice de droits (Prompt section 6) :
  - Consultation : lecture seule (navigation, fiche synoptique)
  - Décideur : lecture + requêtes/AMC simulation (pas d'écriture)
  - Éditeur : édition couches, proposition MAJ CAR, historique
  - Administrateur : tout (comptes, publication, audit complet)

Référence : Prompt section 6, TDR M11.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


ROLE_CHOICES = [
    ('consult', 'Consultation'),
    ('decideur', 'Décideur'),
    ('editeur', 'Éditeur'),
    ('admin', 'Administrateur SIG'),
]

# Hiérarchie des rôles (pour contrôle d'accès simplifié)
ROLE_RANK = {
    'consult': 0,
    'decideur': 1,
    'editeur': 2,
    'admin': 3,
}


class CustomUser(AbstractUser):
    """
    Utilisateur du Géoportail avec profil et permissions fines.
    La création/modification/désactivation est réservée à l'Administrateur (M11).
    Pas d'auto-inscription.
    """
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='consult',
        verbose_name="Profil / rôle",
    )
    organisme = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Organisme de rattachement",
    )
    fonction = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name="Fonction",
    )
    telephone = models.CharField(
        max_length=20, blank=True, default='',
        verbose_name="Téléphone",
    )
    # Permissions fines par module (JSON list of module codes)
    modules_autorises = models.JSONField(
        blank=True, null=True,
        verbose_name="Modules autorisés",
        help_text="Liste des codes modules accessibles. Null = tous selon le rôle.",
    )
    # Permissions fines par couche (JSON list of couche IDs)
    couches_editables = models.JSONField(
        blank=True, null=True,
        verbose_name="Couches éditables (IDs)",
        help_text="Liste des IDs de couches que cet utilisateur peut éditer. "
                  "Null = toutes les couches éditables selon le rôle.",
    )
    # Préférences d'interface
    preferences = models.JSONField(
        blank=True, null=True,
        verbose_name="Préférences d'interface (JSON)",
    )

    class Meta:
        db_table = 'users_customuser'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def rank(self):
        """Rang numérique du rôle pour comparaisons de droits."""
        return ROLE_RANK.get(self.role, 0)

    def has_min_role(self, min_role: str) -> bool:
        """Vérifie si l'utilisateur a au moins le rôle spécifié."""
        return self.rank >= ROLE_RANK.get(min_role, 0)

    @property
    def peut_editer(self) -> bool:
        """L'utilisateur peut-il éditer des couches/géométries ?"""
        return self.role in ('editeur', 'admin')

    @property
    def peut_publier(self) -> bool:
        """L'utilisateur peut-il publier la CAR comme opposable ?"""
        return self.role == 'admin'

    @property
    def peut_gerer_comptes(self) -> bool:
        """L'utilisateur peut-il gérer les comptes ?"""
        return self.role == 'admin'

    @property
    def peut_simuler_amc(self) -> bool:
        """L'utilisateur peut-il exécuter des simulations AMC ?"""
        return self.role in ('decideur', 'editeur', 'admin')

    @property
    def peut_proposer_maj_car(self) -> bool:
        """L'utilisateur peut-il proposer une mise à jour de la CAR ?"""
        return self.role == 'editeur'

    @property
    def acces_audit_complet(self) -> bool:
        """L'utilisateur a-t-il accès complet à l'audit ?"""
        return self.role == 'admin'

    @property
    def acces_audit_etendu(self) -> bool:
        """L'utilisateur a-t-il un accès étendu à l'audit ?"""
        return self.role in ('editeur', 'admin')
