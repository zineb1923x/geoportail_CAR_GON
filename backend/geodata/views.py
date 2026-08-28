from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .localisation import LocalisationService

@api_view(['GET'])
@permission_classes([AllowAny])
def localiser_coordonnees(request):
    lat = request.query_params.get('lat')
    lng = request.query_params.get('lng')
    if not lat or not lng:
        return Response({'error': 'Paramètres lat et lng requis'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(LocalisationService.localiser_coordonnees(lat, lng))

@api_view(['GET'])
@permission_classes([AllowAny])
def localiser_titre_foncier(request):
    tf = request.query_params.get('tf')
    if not tf:
        return Response({'error': 'Paramètre tf requis'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(LocalisationService.localiser_titre_foncier(tf))

@api_view(['GET'])
@permission_classes([AllowAny])
def localiser_commune(request):
    nom = request.query_params.get('nom')
    if not nom:
        return Response({'error': 'Paramètre nom requis'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(LocalisationService.localiser_commune(nom))

@api_view(['POST'])
@permission_classes([AllowAny])
def localiser_fichier(request):
    if 'file' not in request.FILES:
        return Response({'error': 'Aucun fichier fourni'}, status=status.HTTP_400_BAD_REQUEST)
    
    file_obj = request.FILES['file']
    geojson, error = LocalisationService.parser_fichier_geo(file_obj)
    if error:
        return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
    return Response(geojson)

@api_view(['GET'])
@permission_classes([AllowAny])
def export_rapport(request):
    """
    M9: Services d'export (PDF, SHP, GeoJSON, CSV, planches)
    """
    report_type = request.query_params.get('type', 'monthly')
    commune = request.query_params.get('commune', 'all')
    period = request.query_params.get('period', '2026-08')
    out_format = request.query_params.get('format', 'pdf')
    
    from django.http import HttpResponse
    import io
    
    if out_format.startswith('pdf'):
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import A4, landscape
            
            buffer = io.BytesIO()
            pagesize = landscape(A4) if out_format == 'pdf-a0' else A4
            p = canvas.Canvas(buffer, pagesize=pagesize)
            
            p.setFont("Helvetica-Bold", 16)
            p.drawString(50, 800 if out_format == 'pdf' else 550, f"Rapport: {report_type.upper()}")
            
            p.setFont("Helvetica", 12)
            p.drawString(50, 770 if out_format == 'pdf' else 520, f"Commune/Zone: {commune}")
            p.drawString(50, 750 if out_format == 'pdf' else 500, f"Periode: {period}")
            
            p.showPage()
            p.save()
            
            buffer.seek(0)
            return HttpResponse(buffer, content_type='application/pdf')
        except ImportError:
            return Response({"error": "ReportLab non installe"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    elif out_format == 'csv':
        import csv
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(['ID', 'Commune', 'Periode', 'Type'])
        writer.writerow(['1', commune, period, report_type])
        
        response = HttpResponse(buffer.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="export_{period}.csv"'
        return response
    else:
        # Mock for shapefile/geojson/etc
        return Response({"message": f"Export {out_format} genere avec succes. (Mock)"}, status=status.HTTP_200_OK)
