from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from zones_pastorales.models import ZonePastorale, SiteAmeliorationPastorale

class ZonePastoraleSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = ZonePastorale
        geo_field = 'geom'
        fields = '__all__'

class SiteAmeliorationPastoraleSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = SiteAmeliorationPastorale
        geo_field = 'geom'
        fields = '__all__'

