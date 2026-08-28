from django.contrib import admin
from .models import (
    RasterGeologie, RasterIndiceRougeur, RasterIndiceBrillance,
    RasterPente, RasterSable, PixelGeologie, PixelRougeur,
    PixelBrillance, PixelPente, PixelSable,
    ProfilPedologique, ZoneHomogene, ClasseSol,
)


# Rasters
for RasterModel in [RasterGeologie, RasterIndiceRougeur, RasterIndiceBrillance,
                     RasterPente, RasterSable]:
    @admin.register(RasterModel)
    class RasterAdmin(admin.ModelAdmin):
        list_display = ['nom', 'resolution', 'nombre_bandes', 'date_acquisition', 'statut_cycle_vie']
        list_filter = ['statut_cycle_vie']
        search_fields = ['nom']


# Pixels
for PixelModel in [PixelGeologie, PixelRougeur, PixelBrillance, PixelPente, PixelSable]:
    @admin.register(PixelModel)
    class PixelAdmin(admin.ModelAdmin):
        list_display = ['__str__', 'commune', 'statut_cycle_vie']
        list_filter = ['statut_cycle_vie']


@admin.register(ProfilPedologique)
class ProfilPedologiqueAdmin(admin.ModelAdmin):
    list_display = ['code_profil', 'date_observation', 'observateur',
                    'profondeur_utile', 'texture_dominante']
    search_fields = ['code_profil', 'observateur']
    list_filter = ['texture_dominante']


@admin.register(ZoneHomogene)
class ZoneHomogeneAdmin(admin.ModelAdmin):
    list_display = ['code_zone', 'nom_zone', 'groupe_sol', 'classe_sol',
                    'aptitude_agricole', 'superficie_ha']
    search_fields = ['code_zone', 'nom_zone']
    list_filter = ['groupe_sol', 'aptitude_agricole']


@admin.register(ClasseSol)
class ClasseSolAdmin(admin.ModelAdmin):
    list_display = ['code_classe', 'nom_classe', 'systeme_classification', 'aptitude_agricole']
    search_fields = ['code_classe', 'nom_classe']
    list_filter = ['systeme_classification']
