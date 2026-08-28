from django.contrib import admin
from .models import Province, Commune


@admin.register(Province)
class ProvinceAdmin(admin.ModelAdmin):
    list_display = ['code_province', 'nom_province', 'chef_lieu', 'superficie_km2', 'population']
    search_fields = ['nom_province', 'code_province']
    list_filter = ['millesime']


@admin.register(Commune)
class CommuneAdmin(admin.ModelAdmin):
    list_display = ['code_commune', 'nom_commune', 'province', 'type_commune', 'superficie_km2', 'population']
    search_fields = ['nom_commune', 'code_commune']
    list_filter = ['province', 'type_commune', 'millesime']
    autocomplete_fields = ['province']
