from django.contrib import admin
from .models import (
    NappePhreatique, Piezometre, ProfondeurNappe,
    Barrage, ReseauHydrographique,
)


class ProfondeurNappeInline(admin.TabularInline):
    model = ProfondeurNappe
    extra = 0


@admin.register(NappePhreatique)
class NappePhreatiqueAdmin(admin.ModelAdmin):
    list_display = ['code_nappe', 'nom_nappe', 'type_nappe', 'profondeur_moyenne',
                    'superficie_km2', 'etat_exploitation']
    search_fields = ['code_nappe', 'nom_nappe']
    list_filter = ['type_nappe', 'bassin_hydraulique']


@admin.register(Piezometre)
class PiezometreAdmin(admin.ModelAdmin):
    list_display = ['code_piezometre', 'nom', 'nappe', 'profondeur_forage', 'est_actif']
    search_fields = ['code_piezometre', 'nom']
    list_filter = ['est_actif', 'nappe']
    inlines = [ProfondeurNappeInline]


@admin.register(Barrage)
class BarrageAdmin(admin.ModelAdmin):
    list_display = ['code_barrage', 'nom_barrage', 'type_barrage', 'capacite_mm3',
                    'annee_mise_service', 'usage_principal']
    search_fields = ['nom_barrage', 'code_barrage']
    list_filter = ['type_barrage']


@admin.register(ReseauHydrographique)
class ReseauHydrographiqueAdmin(admin.ModelAdmin):
    list_display = ['code_cours_eau', 'nom_cours_eau', 'type_cours_eau',
                    'ordre_strahler', 'longueur_km']
    search_fields = ['nom_cours_eau', 'code_cours_eau']
    list_filter = ['type_cours_eau']
