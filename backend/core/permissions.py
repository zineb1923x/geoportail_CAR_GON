from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Seul l'Administrateur SIG a accès complet (y compris gestion des comptes, publication CAR, restauration).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

class IsEditeurOrAdmin(permissions.BasePermission):
    """
    L'Éditeur peut modifier les entités géographiques et attributaires (POST, PUT, PATCH, DELETE),
    et lancer le Temps 1 et Temps 2 du calcul CAR.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # SAFE_METHODS (GET, HEAD, OPTIONS) sont permis pour tous (Consultation, Décideur, etc.)
        if request.method in permissions.SAFE_METHODS:
            return True
            
        return request.user.role in ['admin', 'editeur']

class IsDecideurOrHigher(permissions.BasePermission):
    """
    Le Décideur a accès aux requêtes complexes et à l'AMC en mode simulation (mais pas d'écriture directe).
    Les méthodes d'écriture sur ces endpoints spécifiques (par ex. créer un scénario) nécessitent au moins le niveau Décideur.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.method in permissions.SAFE_METHODS:
            return True
            
        return request.user.role in ['admin', 'editeur', 'decideur']
