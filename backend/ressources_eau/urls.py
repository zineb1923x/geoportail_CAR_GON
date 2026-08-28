from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ressources_eau.views import NappePhreatiqueViewSet, PiezometreViewSet, ProfondeurNappeViewSet, BarrageViewSet, ReseauHydrographiqueViewSet

router = DefaultRouter()
router.register(r'nappephreatique', NappePhreatiqueViewSet)
router.register(r'piezometre', PiezometreViewSet)
router.register(r'profondeurnappe', ProfondeurNappeViewSet)
router.register(r'barrage', BarrageViewSet)
router.register(r'reseauhydrographique', ReseauHydrographiqueViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
