from django.contrib import admin
from .models import (
    ZoneUrbanisable, DomaineForestier, ReseauRoutier, AVNA, StatutFoncier,
)


@admin.register(ZoneUrbanisable)
class ZoneUrbanisableAdmin(admin.ModelAdmin):
    list_display = ['code_zone', 'nom_zone', 'type_document',
                    'date_homologation', 'est_en_vigueur', 'superficie_ha']
    search_fields = ['code_zone', 'nom_zone', 'reference_document']
    list_filter = ['type_document', 'est_en_vigueur']


@admin.register(DomaineForestier)
class DomaineForestierAdmin(admin.ModelAdmin):
    list_display = ['code_foret', 'nom_foret', 'type_formation',
                    'espece_dominante', 'superficie_ha']
    search_fields = ['code_foret', 'nom_foret']
    list_filter = ['type_formation']


@admin.register(ReseauRoutier)
class ReseauRoutierAdmin(admin.ModelAdmin):
    list_display = ['code_route', 'nom_route', 'type_route',
                    'revetement', 'longueur_km']
    search_fields = ['code_route', 'nom_route']
    list_filter = ['type_route', 'revetement']


@admin.register(AVNA)
class AVNAAdmin(admin.ModelAdmin):
    list_display = ['code_avna', 'nom', 'type_vocation',
                    'superficie_ha', 'date_declaration']
    search_fields = ['code_avna', 'nom']
    list_filter = ['type_vocation']


@admin.register(StatutFoncier)
class StatutFoncierAdmin(admin.ModelAdmin):
    list_display = ['code_foncier', 'type_statut', 'numero_titre',
                    'superficie_ha', 'proprietaire']
    search_fields = ['code_foncier', 'numero_titre', 'proprietaire']
    list_filter = ['type_statut']
