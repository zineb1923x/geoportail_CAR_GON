from django.contrib import admin
from .models import (
    DomaineValeur, CoucheCatalogue, MetadonneeISO,
    Genealogie, VersionCouche,
)


@admin.register(DomaineValeur)
class DomaineValeurAdmin(admin.ModelAdmin):
    list_display = ['domaine', 'code', 'libelle', 'ordre', 'actif']
    list_filter = ['domaine', 'actif']
    search_fields = ['code', 'libelle', 'domaine']
    list_editable = ['ordre', 'actif']


class MetadonneeISOInline(admin.StackedInline):
    model = MetadonneeISO
    extra = 0


class GenealogieInline(admin.TabularInline):
    model = Genealogie
    fk_name = 'couche'
    extra = 0


@admin.register(CoucheCatalogue)
class CoucheCatalogueAdmin(admin.ModelAdmin):
    list_display = ['nom_technique', 'nom_affichage', 'thematique', 'type_geometrie',
                    'statut', 'forcage_categorie', 'est_exclusion']
    list_filter = ['thematique', 'statut', 'type_geometrie', 'est_exclusion']
    search_fields = ['nom_technique', 'nom_affichage']
    inlines = [MetadonneeISOInline, GenealogieInline]


@admin.register(VersionCouche)
class VersionCoucheAdmin(admin.ModelAdmin):
    list_display = ['couche', 'numero_version', 'statut_avant', 'statut_apres',
                    'auteur', 'date_version', 'est_restaurable']
    list_filter = ['couche', 'est_restaurable']
    readonly_fields = ['date_version']
