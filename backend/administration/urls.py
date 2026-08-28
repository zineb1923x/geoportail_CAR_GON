from django.urls import path, include
from rest_framework.routers import DefaultRouter
from administration.views import ProvinceViewSet, CommuneViewSet

router = DefaultRouter()
router.register(r'province', ProvinceViewSet)
router.register(r'commune', CommuneViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
