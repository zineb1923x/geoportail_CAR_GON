from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsEditeurOrAdmin
from occupation_agricole.models import PerimetreIrrigue, PMH, PPP, IrrigationPrivee, ZoneOasienne, Plantation, ProjetPMV
from occupation_agricole.serializers import PerimetreIrrigueSerializer, PMHSerializer, PPPSerializer, IrrigationPriveeSerializer, ZoneOasienneSerializer, PlantationSerializer, ProjetPMVSerializer

class PerimetreIrrigueViewSet(viewsets.ModelViewSet):
    queryset = PerimetreIrrigue.objects.all()
    serializer_class = PerimetreIrrigueSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class PMHViewSet(viewsets.ModelViewSet):
    queryset = PMH.objects.all()
    serializer_class = PMHSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class PPPViewSet(viewsets.ModelViewSet):
    queryset = PPP.objects.all()
    serializer_class = PPPSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class IrrigationPriveeViewSet(viewsets.ModelViewSet):
    queryset = IrrigationPrivee.objects.all()
    serializer_class = IrrigationPriveeSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class ZoneOasienneViewSet(viewsets.ModelViewSet):
    queryset = ZoneOasienne.objects.all()
    serializer_class = ZoneOasienneSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class PlantationViewSet(viewsets.ModelViewSet):
    queryset = Plantation.objects.all()
    serializer_class = PlantationSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class ProjetPMVViewSet(viewsets.ModelViewSet):
    queryset = ProjetPMV.objects.all()
    serializer_class = ProjetPMVSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

