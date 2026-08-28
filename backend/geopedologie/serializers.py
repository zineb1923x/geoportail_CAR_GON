from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from geopedologie.models import RasterGeologie, RasterIndiceRougeur, RasterIndiceBrillance, RasterPente, RasterSable, PixelGeologie, PixelRougeur, PixelBrillance, PixelPente, PixelSable, ProfilPedologique, ZoneHomogene, ClasseSol

class RasterGeologieSerializer(serializers.ModelSerializer):
    class Meta:
        model = RasterGeologie
        fields = '__all__'

class RasterIndiceRougeurSerializer(serializers.ModelSerializer):
    class Meta:
        model = RasterIndiceRougeur
        fields = '__all__'

class RasterIndiceBrillanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = RasterIndiceBrillance
        fields = '__all__'

class RasterPenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RasterPente
        fields = '__all__'

class RasterSableSerializer(serializers.ModelSerializer):
    class Meta:
        model = RasterSable
        fields = '__all__'

class PixelGeologieSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PixelGeologie
        geo_field = 'geom'
        fields = '__all__'

class PixelRougeurSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PixelRougeur
        geo_field = 'geom'
        fields = '__all__'

class PixelBrillanceSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PixelBrillance
        geo_field = 'geom'
        fields = '__all__'

class PixelPenteSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PixelPente
        geo_field = 'geom'
        fields = '__all__'

class PixelSableSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = PixelSable
        geo_field = 'geom'
        fields = '__all__'

class ProfilPedologiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilPedologique
        fields = '__all__'

class ZoneHomogeneSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = ZoneHomogene
        geo_field = 'geom'
        fields = '__all__'

class ClasseSolSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClasseSol
        fields = '__all__'

