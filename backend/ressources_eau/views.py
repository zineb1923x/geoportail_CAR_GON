from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsEditeurOrAdmin
from ressources_eau.models import NappePhreatique, Piezometre, ProfondeurNappe, Barrage, ReseauHydrographique
from ressources_eau.serializers import NappePhreatiqueSerializer, PiezometreSerializer, ProfondeurNappeSerializer, BarrageSerializer, ReseauHydrographiqueSerializer

class NappePhreatiqueViewSet(viewsets.ModelViewSet):
    queryset = NappePhreatique.objects.all()
    serializer_class = NappePhreatiqueSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class PiezometreViewSet(viewsets.ModelViewSet):
    queryset = Piezometre.objects.all()
    serializer_class = PiezometreSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class ProfondeurNappeViewSet(viewsets.ModelViewSet):
    queryset = ProfondeurNappe.objects.all()
    serializer_class = ProfondeurNappeSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class BarrageViewSet(viewsets.ModelViewSet):
    queryset = Barrage.objects.all()
    serializer_class = BarrageSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class ReseauHydrographiqueViewSet(viewsets.ModelViewSet):
    queryset = ReseauHydrographique.objects.all()
    serializer_class = ReseauHydrographiqueSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

