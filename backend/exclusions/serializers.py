from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from exclusions.models import ZoneUrbanisable, DomaineForestier, ReseauRoutier, AVNA, StatutFoncier

class ZoneUrbanisableSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = ZoneUrbanisable
        geo_field = 'geom'
        fields = '__all__'

class DomaineForestierSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = DomaineForestier
        geo_field = 'geom'
        fields = '__all__'

class ReseauRoutierSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReseauRoutier
        fields = '__all__'

class AVNASerializer(GeoFeatureModelSerializer):
    class Meta:
        model = AVNA
        geo_field = 'geom'
        fields = '__all__'

class StatutFoncierSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = StatutFoncier
        geo_field = 'geom'
        fields = '__all__'

