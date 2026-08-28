from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from bioclimat.models import StationClimatique, Precipitation, Temperature, EtageBioclimatique

class StationClimatiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = StationClimatique
        fields = '__all__'

class PrecipitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Precipitation
        fields = '__all__'

class TemperatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Temperature
        fields = '__all__'

class EtageBioclimatiqueSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = EtageBioclimatique
        geo_field = 'geom'
        fields = '__all__'

