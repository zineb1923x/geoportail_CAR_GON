from django.contrib import admin
from .models import StationClimatique, Precipitation, Temperature, EtageBioclimatique


class PrecipitationInline(admin.TabularInline):
    model = Precipitation
    extra = 0


class TemperatureInline(admin.TabularInline):
    model = Temperature
    extra = 0


@admin.register(StationClimatique)
class StationClimatiqueAdmin(admin.ModelAdmin):
    list_display = ['code_station', 'nom_station', 'altitude', 'est_active']
    search_fields = ['code_station', 'nom_station']
    list_filter = ['est_active']
    inlines = [PrecipitationInline, TemperatureInline]


@admin.register(EtageBioclimatique)
class EtageBioclimatiqueAdmin(admin.ModelAdmin):
    list_display = ['code_etage', 'nom_etage', 'type_climat',
                    'precipitation_annuelle_min', 'precipitation_annuelle_max',
                    'quotient_emberger', 'superficie_ha']
    search_fields = ['code_etage', 'nom_etage']
    list_filter = ['type_climat']
