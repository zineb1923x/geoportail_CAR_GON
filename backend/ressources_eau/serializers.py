from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from ressources_eau.models import NappePhreatique, Piezometre, ProfondeurNappe, Barrage, ReseauHydrographique

class NappePhreatiqueSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = NappePhreatique
        geo_field = 'geom'
        fields = '__all__'

class PiezometreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Piezometre
        fields = '__all__'

class ProfondeurNappeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfondeurNappe
        fields = '__all__'

class BarrageSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Barrage
        geo_field = 'geom'
        fields = '__all__'

class ReseauHydrographiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReseauHydrographique
        fields = '__all__'

