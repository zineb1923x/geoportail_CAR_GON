from django.urls import path, include
from rest_framework.routers import DefaultRouter
from geopedologie.views import RasterGeologieViewSet, RasterIndiceRougeurViewSet, RasterIndiceBrillanceViewSet, RasterPenteViewSet, RasterSableViewSet, PixelGeologieViewSet, PixelRougeurViewSet, PixelBrillanceViewSet, PixelPenteViewSet, PixelSableViewSet, ProfilPedologiqueViewSet, ZoneHomogeneViewSet, ClasseSolViewSet

router = DefaultRouter()
router.register(r'rastergeologie', RasterGeologieViewSet)
router.register(r'rasterindicerougeur', RasterIndiceRougeurViewSet)
router.register(r'rasterindicebrillance', RasterIndiceBrillanceViewSet)
router.register(r'rasterpente', RasterPenteViewSet)
router.register(r'rastersable', RasterSableViewSet)
router.register(r'pixelgeologie', PixelGeologieViewSet)
router.register(r'pixelrougeur', PixelRougeurViewSet)
router.register(r'pixelbrillance', PixelBrillanceViewSet)
router.register(r'pixelpente', PixelPenteViewSet)
router.register(r'pixelsable', PixelSableViewSet)
router.register(r'profilpedologique', ProfilPedologiqueViewSet)
router.register(r'zonehomogene', ZoneHomogeneViewSet)
router.register(r'classesol', ClasseSolViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
