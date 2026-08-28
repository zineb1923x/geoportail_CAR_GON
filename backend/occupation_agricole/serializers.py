from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from occupation_agricole.models import PerimetreIrrigue, PMH, PPP, IrrigationPrivee, ZoneOasienne, Plantation, ProjetPMV

class PerimetreIrrigueSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PerimetreIrrigue
        geo_field = 'geom'
        fields = '__all__'

class PMHSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PMH
        geo_field = 'geom'
        fields = '__all__'

class PPPSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PPP
        geo_field = 'geom'
        fields = '__all__'

class IrrigationPriveeSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = IrrigationPrivee
        geo_field = 'geom'
        fields = '__all__'

class ZoneOasienneSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = ZoneOasienne
        geo_field = 'geom'
        fields = '__all__'

class PlantationSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Plantation
        geo_field = 'geom'
        fields = '__all__'

class ProjetPMVSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = ProjetPMV
        geo_field = 'geom'
        fields = '__all__'

