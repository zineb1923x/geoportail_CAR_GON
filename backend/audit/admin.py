from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['date_action', 'utilisateur', 'role_utilisateur',
                    'action', 'module', 'model_name', 'object_id', 'object_repr']
    list_filter = ['action', 'module', 'app_label', 'role_utilisateur']
    search_fields = ['object_repr', 'description', 'regle_declenchee']
    readonly_fields = [
        'utilisateur', 'role_utilisateur', 'action', 'module',
        'app_label', 'model_name', 'object_id', 'object_repr',
        'champ_modifie', 'valeur_avant', 'valeur_apres',
        'donnees_completes', 'description', 'regle_declenchee',
        'adresse_ip', 'date_action',
    ]
    date_hierarchy = 'date_action'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
