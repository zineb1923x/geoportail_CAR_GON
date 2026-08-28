from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from administration.models import Province, Commune

class ProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = '__all__'

class CommuneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commune
        fields = '__all__'

