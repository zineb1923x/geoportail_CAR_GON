from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsEditeurOrAdmin
from zones_pastorales.models import ZonePastorale, SiteAmeliorationPastorale
from zones_pastorales.serializers import ZonePastoraleSerializer, SiteAmeliorationPastoraleSerializer

class ZonePastoraleViewSet(viewsets.ModelViewSet):
    queryset = ZonePastorale.objects.all()
    serializer_class = ZonePastoraleSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class SiteAmeliorationPastoraleViewSet(viewsets.ModelViewSet):
    queryset = SiteAmeliorationPastorale.objects.all()
    serializer_class = SiteAmeliorationPastoraleSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

