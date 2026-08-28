from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsEditeurOrAdmin
from administration.models import Province, Commune
from administration.serializers import ProvinceSerializer, CommuneSerializer

class ProvinceViewSet(viewsets.ModelViewSet):
    queryset = Province.objects.all()
    serializer_class = ProvinceSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class CommuneViewSet(viewsets.ModelViewSet):
    queryset = Commune.objects.all()
    serializer_class = CommuneSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

