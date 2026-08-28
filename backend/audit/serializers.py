from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from audit.models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

