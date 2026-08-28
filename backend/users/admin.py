from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'organisme', 'fonction',
                    'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'organisme']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'organisme']
    list_editable = ['role', 'is_active']

    fieldsets = UserAdmin.fieldsets + (
        ('Profil Géoportail', {
            'fields': ('role', 'organisme', 'fonction', 'telephone',
                       'modules_autorises', 'couches_editables', 'preferences'),
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Profil Géoportail', {
            'fields': ('role', 'organisme', 'fonction', 'telephone'),
        }),
    )
