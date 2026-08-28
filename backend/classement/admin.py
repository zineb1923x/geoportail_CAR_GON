from django.contrib import admin
from .models import (
    ClasseA, ClasseB, ClasseC,
    UniteCarteAgricole, RegleClassement, ScenarioAMC,
)


@admin.register(ClasseA)
class ClasseAAdmin(admin.ModelAdmin):
    list_display = ['code_unite', 'score_ipa', 'est_force', 'motif_classement',
                    'superficie_ha', 'scenario']
    list_filter = ['est_force', 'scenario']
    search_fields = ['code_unite']


@admin.register(ClasseB)
class ClasseBAdmin(admin.ModelAdmin):
    list_display = ['code_unite', 'score_ipa', 'facteur_limitant',
                    'superficie_ha', 'scenario']
    list_filter = ['scenario']
    search_fields = ['code_unite']


@admin.register(ClasseC)
class ClasseCAdmin(admin.ModelAdmin):
    list_display = ['code_unite', 'score_ipa', 'facteur_limitant',
                    'superficie_ha', 'scenario']
    list_filter = ['scenario']
    search_fields = ['code_unite']


@admin.register(UniteCarteAgricole)
class UniteCarteAgricoleAdmin(admin.ModelAdmin):
    list_display = ['code_unite', 'categorie', 'score_ipa', 'est_force',
                    'est_hors_classement', 'superficie_ha', 'est_car_validee']
    list_filter = ['categorie', 'est_force', 'est_hors_classement',
                   'est_car_validee', 'scenario']
    search_fields = ['code_unite', 'groupe_sol']
    readonly_fields = ['date_classement']


@admin.register(RegleClassement)
class RegleClassementAdmin(admin.ModelAdmin):
    list_display = ['couche_source', 'type_regle', 'priorite', 'actif',
                    'auteur', 'date_modification']
    list_filter = ['type_regle', 'actif']
    list_editable = ['actif', 'priorite']
    autocomplete_fields = ['couche_source']


@admin.register(ScenarioAMC)
class ScenarioAMCAdmin(admin.ModelAdmin):
    list_display = ['nom', 'moteur_scoring', 'ratio_coherence',
                    'surface_a_calculee_ha', 'surface_a_forcee_ha',
                    'surface_b_ha', 'surface_c_ha', 'surface_hors_classement_ha',
                    'est_car_validee', 'auteur', 'date_calcul']
    list_filter = ['moteur_scoring', 'est_car_validee']
    search_fields = ['nom']
    readonly_fields = ['date_calcul']
