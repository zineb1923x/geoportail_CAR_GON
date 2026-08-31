from django.urls import path, include
from rest_framework.routers import DefaultRouter
from classement.views import ClasseAViewSet, ClasseBViewSet, ClasseCViewSet, UniteCarteAgricoleViewSet, RegleClassementViewSet, ScenarioAMCViewSet
from classement.dashboard_api import DashboardStatsView

router = DefaultRouter()
router.register(r'classea', ClasseAViewSet)
router.register(r'classeb', ClasseBViewSet)
router.register(r'classec', ClasseCViewSet)
router.register(r'unitecarteagricole', UniteCarteAgricoleViewSet)
router.register(r'regleclassement', RegleClassementViewSet)
router.register(r'scenarioamc', ScenarioAMCViewSet)

urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('', include(router.urls)),
]
