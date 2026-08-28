from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsEditeurOrAdmin
from bioclimat.models import StationClimatique, Precipitation, Temperature, EtageBioclimatique
from bioclimat.serializers import StationClimatiqueSerializer, PrecipitationSerializer, TemperatureSerializer, EtageBioclimatiqueSerializer

class StationClimatiqueViewSet(viewsets.ModelViewSet):
    queryset = StationClimatique.objects.all()
    serializer_class = StationClimatiqueSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class PrecipitationViewSet(viewsets.ModelViewSet):
    queryset = Precipitation.objects.all()
    serializer_class = PrecipitationSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class TemperatureViewSet(viewsets.ModelViewSet):
    queryset = Temperature.objects.all()
    serializer_class = TemperatureSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class EtageBioclimatiqueViewSet(viewsets.ModelViewSet):
    queryset = EtageBioclimatique.objects.all()
    serializer_class = EtageBioclimatiqueSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

