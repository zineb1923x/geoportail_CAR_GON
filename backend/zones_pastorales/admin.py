from django.contrib import admin
from .models import ZonePastorale, SiteAmeliorationPastorale


@admin.register(ZonePastorale)
class ZonePastoraleAdmin(admin.ModelAdmin):
    list_display = ['code_zone', 'nom_zone', 'type_parcours',
                    'superficie_ha', 'etat_degradation']
    search_fields = ['code_zone', 'nom_zone']
    list_filter = ['type_parcours', 'etat_degradation']


@admin.register(SiteAmeliorationPastorale)
class SiteAmeliorationPastoraleAdmin(admin.ModelAdmin):
    list_display = ['code_site', 'nom_site', 'zone_pastorale',
                    'type_amelioration', 'superficie_ha', 'annee_realisation']
    search_fields = ['code_site', 'nom_site']
    list_filter = ['type_amelioration']
    autocomplete_fields = ['zone_pastorale']
