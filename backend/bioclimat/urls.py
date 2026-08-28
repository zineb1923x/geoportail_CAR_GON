from django.urls import path, include
from rest_framework.routers import DefaultRouter
from bioclimat.views import StationClimatiqueViewSet, PrecipitationViewSet, TemperatureViewSet, EtageBioclimatiqueViewSet

router = DefaultRouter()
router.register(r'stationclimatique', StationClimatiqueViewSet)
router.register(r'precipitation', PrecipitationViewSet)
router.register(r'temperature', TemperatureViewSet)
router.register(r'etagebioclimatique', EtageBioclimatiqueViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
