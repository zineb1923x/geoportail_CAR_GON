from django.urls import path, include
from rest_framework.routers import DefaultRouter
from exclusions.views import ZoneUrbanisableViewSet, DomaineForestierViewSet, ReseauRoutierViewSet, AVNAViewSet, StatutFoncierViewSet

router = DefaultRouter()
router.register(r'zoneurbanisable', ZoneUrbanisableViewSet)
router.register(r'domaineforestier', DomaineForestierViewSet)
router.register(r'reseauroutier', ReseauRoutierViewSet)
router.register(r'avna', AVNAViewSet)
router.register(r'statutfoncier', StatutFoncierViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
