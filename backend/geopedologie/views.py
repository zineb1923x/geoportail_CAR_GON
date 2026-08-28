from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsEditeurOrAdmin
from geopedologie.models import RasterGeologie, RasterIndiceRougeur, RasterIndiceBrillance, RasterPente, RasterSable, PixelGeologie, PixelRougeur, PixelBrillance, PixelPente, PixelSable, ProfilPedologique, ZoneHomogene, ClasseSol
from geopedologie.serializers import RasterGeologieSerializer, RasterIndiceRougeurSerializer, RasterIndiceBrillanceSerializer, RasterPenteSerializer, RasterSableSerializer, PixelGeologieSerializer, PixelRougeurSerializer, PixelBrillanceSerializer, PixelPenteSerializer, PixelSableSerializer, ProfilPedologiqueSerializer, ZoneHomogeneSerializer, ClasseSolSerializer

class RasterGeologieViewSet(viewsets.ModelViewSet):
    queryset = RasterGeologie.objects.all()
    serializer_class = RasterGeologieSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class RasterIndiceRougeurViewSet(viewsets.ModelViewSet):
    queryset = RasterIndiceRougeur.objects.all()
    serializer_class = RasterIndiceRougeurSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class RasterIndiceBrillanceViewSet(viewsets.ModelViewSet):
    queryset = RasterIndiceBrillance.objects.all()
    serializer_class = RasterIndiceBrillanceSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class RasterPenteViewSet(viewsets.ModelViewSet):
    queryset = RasterPente.objects.all()
    serializer_class = RasterPenteSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class RasterSableViewSet(viewsets.ModelViewSet):
    queryset = RasterSable.objects.all()
    serializer_class = RasterSableSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class PixelGeologieViewSet(viewsets.ModelViewSet):
    queryset = PixelGeologie.objects.all()
    serializer_class = PixelGeologieSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class PixelRougeurViewSet(viewsets.ModelViewSet):
    queryset = PixelRougeur.objects.all()
    serializer_class = PixelRougeurSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class PixelBrillanceViewSet(viewsets.ModelViewSet):
    queryset = PixelBrillance.objects.all()
    serializer_class = PixelBrillanceSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class PixelPenteViewSet(viewsets.ModelViewSet):
    queryset = PixelPente.objects.all()
    serializer_class = PixelPenteSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class PixelSableViewSet(viewsets.ModelViewSet):
    queryset = PixelSable.objects.all()
    serializer_class = PixelSableSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class ProfilPedologiqueViewSet(viewsets.ModelViewSet):
    queryset = ProfilPedologique.objects.all()
    serializer_class = ProfilPedologiqueSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class ZoneHomogeneViewSet(viewsets.ModelViewSet):
    queryset = ZoneHomogene.objects.all()
    serializer_class = ZoneHomogeneSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class ClasseSolViewSet(viewsets.ModelViewSet):
    queryset = ClasseSol.objects.all()
    serializer_class = ClasseSolSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

