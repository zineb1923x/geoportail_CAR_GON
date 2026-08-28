from django.urls import path, include
from rest_framework.routers import DefaultRouter
from zones_pastorales.views import ZonePastoraleViewSet, SiteAmeliorationPastoraleViewSet

router = DefaultRouter()
router.register(r'zonepastorale', ZonePastoraleViewSet)
router.register(r'siteameliorationpastorale', SiteAmeliorationPastoraleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
