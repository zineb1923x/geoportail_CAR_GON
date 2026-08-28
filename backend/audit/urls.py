from django.urls import path, include
from rest_framework.routers import DefaultRouter
from audit.views import AuditLogViewSet

router = DefaultRouter()
router.register(r'auditlog', AuditLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
