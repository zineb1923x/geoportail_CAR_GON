from django.contrib import admin
from .models import (
    PerimetreIrrigue, PMH, PPP, IrrigationPrivee,
    ZoneOasienne, Plantation, ProjetPMV,
)


@admin.register(PerimetreIrrigue)
class PerimetreIrrigueAdmin(admin.ModelAdmin):
    list_display = ['code_perimetre', 'nom_perimetre', 'type_irrigation',
                    'superficie_equipee_ha', 'superficie_irriguee_ha']
    search_fields = ['code_perimetre', 'nom_perimetre']


@admin.register(PMH)
class PMHAdmin(admin.ModelAdmin):
    list_display = ['code_pmh', 'nom_pmh', 'type_amenagement',
                    'superficie_ha', 'etat_fonctionnement']
    search_fields = ['code_pmh', 'nom_pmh']


@admin.register(PPP)
class PPPAdmin(admin.ModelAdmin):
    list_display = ['code_ppp', 'nom_ppp', 'type_pompage', 'superficie_ha']
    search_fields = ['code_ppp', 'nom_ppp']


@admin.register(IrrigationPrivee)
class IrrigationPriveeAdmin(admin.ModelAdmin):
    list_display = ['code', 'nom', 'type_irrigation', 'superficie_ha']
    search_fields = ['code', 'nom']


@admin.register(ZoneOasienne)
class ZoneOasienneAdmin(admin.ModelAdmin):
    list_display = ['code_oasis', 'nom_oasis', 'superficie_ha',
                    'nombre_palmiers', 'etat_palmeraie']
    search_fields = ['code_oasis', 'nom_oasis']


@admin.register(Plantation)
class PlantationAdmin(admin.ModelAdmin):
    list_display = ['code_plantation', 'nom_plantation', 'type_plantation',
                    'espece_principale', 'superficie_ha', 'annee_plantation']
    search_fields = ['code_plantation', 'espece_principale']
    list_filter = ['type_plantation']


@admin.register(ProjetPMV)
class ProjetPMVAdmin(admin.ModelAdmin):
    list_display = ['code_projet', 'nom_projet', 'pilier', 'type_projet',
                    'superficie_ha', 'taux_realisation', 'etat_projet']
    search_fields = ['code_projet', 'nom_projet']
    list_filter = ['pilier', 'type_projet', 'etat_projet']
