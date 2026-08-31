from drf_spectacular.utils import extend_schema, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from classement.models import ScenarioAMC
from audit.models import AuditLog

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Statistiques du tableau de bord",
        description="Récupère les KPI (surface totale par classe A/B/C) et l'activité récente de la plateforme.",
        responses={200: OpenApiTypes.OBJECT}
    )
    def get(self, request):
        scenario = ScenarioAMC.objects.filter(est_car_validee=True).order_by('-date_calcul').first()
        
        stats = {
            "surface_a": 0,
            "surface_b": 0,
            "surface_c": 0,
            "surface_total": 0,
        }
        
        if scenario:
            stats["surface_a"] = scenario.surface_a_calculee_ha or 0
            stats["surface_b"] = scenario.surface_b_ha or 0
            stats["surface_c"] = scenario.surface_c_ha or 0
            stats["surface_total"] = stats["surface_a"] + stats["surface_b"] + stats["surface_c"]

        recent_activity = AuditLog.objects.order_by('-date_action')[:10]
        activity_data = []
        for log in recent_activity:
            activity_data.append({
                "time": log.date_action.strftime("%H:%M"),
                "date": log.date_action.strftime("%d/%m/%Y"),
                "type": log.action,
                "module": log.module,
                "desc": log.description,
                "user": log.utilisateur.get_full_name() if log.utilisateur else "Système",
            })

        return Response({
            "kpi": stats,
            "activity": activity_data
        })
