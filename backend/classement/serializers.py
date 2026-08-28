from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from classement.models import ClasseA, ClasseB, ClasseC, UniteCarteAgricole, RegleClassement, ScenarioAMC

class ClasseASerializer(GeoFeatureModelSerializer):
    class Meta:
        model = ClasseA
        geo_field = 'geom'
        fields = '__all__'

class ClasseBSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = ClasseB
        geo_field = 'geom'
        fields = '__all__'

class ClasseCSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = ClasseC
        geo_field = 'geom'
        fields = '__all__'

class UniteCarteAgricoleSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = UniteCarteAgricole
        geo_field = 'geom'
        fields = '__all__'

class RegleClassementSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegleClassement
        fields = '__all__'

class ScenarioAMCSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScenarioAMC
        fields = '__all__'

