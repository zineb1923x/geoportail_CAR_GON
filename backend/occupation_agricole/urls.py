from django.urls import path, include
from rest_framework.routers import DefaultRouter
from occupation_agricole.views import PerimetreIrrigueViewSet, PMHViewSet, PPPViewSet, IrrigationPriveeViewSet, ZoneOasienneViewSet, PlantationViewSet, ProjetPMVViewSet

router = DefaultRouter()
router.register(r'perimetreirrigue', PerimetreIrrigueViewSet)
router.register(r'pmh', PMHViewSet)
router.register(r'ppp', PPPViewSet)
router.register(r'irrigationprivee', IrrigationPriveeViewSet)
router.register(r'zoneoasienne', ZoneOasienneViewSet)
router.register(r'plantation', PlantationViewSet)
router.register(r'projetpmv', ProjetPMVViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
