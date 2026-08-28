from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsEditeurOrAdmin
from exclusions.models import ZoneUrbanisable, DomaineForestier, ReseauRoutier, AVNA, StatutFoncier
from exclusions.serializers import ZoneUrbanisableSerializer, DomaineForestierSerializer, ReseauRoutierSerializer, AVNASerializer, StatutFoncierSerializer

class ZoneUrbanisableViewSet(viewsets.ModelViewSet):
    queryset = ZoneUrbanisable.objects.all()
    serializer_class = ZoneUrbanisableSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class DomaineForestierViewSet(viewsets.ModelViewSet):
    queryset = DomaineForestier.objects.all()
    serializer_class = DomaineForestierSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class ReseauRoutierViewSet(viewsets.ModelViewSet):
    queryset = ReseauRoutier.objects.all()
    serializer_class = ReseauRoutierSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class AVNAViewSet(viewsets.ModelViewSet):
    queryset = AVNA.objects.all()
    serializer_class = AVNASerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class StatutFoncierViewSet(viewsets.ModelViewSet):
    queryset = StatutFoncier.objects.all()
    serializer_class = StatutFoncierSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

