from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from core.permissions import IsEditeurOrAdmin
from classement.models import ClasseA, ClasseB, ClasseC, UniteCarteAgricole, RegleClassement, ScenarioAMC
from classement.serializers import ClasseASerializer, ClasseBSerializer, ClasseCSerializer, UniteCarteAgricoleSerializer, RegleClassementSerializer, ScenarioAMCSerializer

class ClasseAViewSet(viewsets.ModelViewSet):
    queryset = ClasseA.objects.all()
    serializer_class = ClasseASerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class ClasseBViewSet(viewsets.ModelViewSet):
    queryset = ClasseB.objects.all()
    serializer_class = ClasseBSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class ClasseCViewSet(viewsets.ModelViewSet):
    queryset = ClasseC.objects.all()
    serializer_class = ClasseCSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

from django.db.models import Q
from django.db.models.functions import Round

class UniteCarteAgricoleViewSet(viewsets.ModelViewSet):
    queryset = UniteCarteAgricole.objects.all()
    serializer_class = UniteCarteAgricoleSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def requetes(self, request):
        """
        Exécute une requête multi-critères sur les Unités de Carte Agricole.
        """
        criteria = request.data.get('criteria', [])
        
        # Mapping frontend fields to backend model fields
        field_map = {
            'cat': 'categorie',
            'com': 'commune__nom_commune',
            'statut': 'statut_foncier', # Wait, UniteCarteAgricole doesn't have statut_foncier. Let's map what we can.
            'surf': 'superficie_ha',
            'score': 'score_ipa',
            'limitant': 'facteur_limitant'
        }
        
        q_objects = Q()
        annotations = {}
        
        for c in criteria:
            field = c.get('field')
            operator = c.get('operator')
            value = c.get('value')
            
            if not field or not operator or value is None or value == '':
                continue
                
            model_field = field_map.get(field, field)
            
            # Pour la commune, on gère insensible à la casse
            if field == 'com':
                if operator == '=':
                    q_objects &= Q(**{f"{model_field}__iexact": value})
                elif operator == '!=':
                    q_objects &= ~Q(**{f"{model_field}__iexact": value})
                elif operator == 'contains':
                    q_objects &= Q(**{f"{model_field}__icontains": value})
            elif operator in ('=', '!=') and str(value).replace('.', '', 1).replace('-', '', 1).isdigit():
                parsed = float(value)
                # Déterminer la précision décimale saisie par l'utilisateur
                decimal_places = len(value.split('.')[-1]) if '.' in value else 0
                # Annoter avec Round pour comparer à la même précision que l'affichage
                ann_key = f"{model_field}_rounded"
                annotations[ann_key] = Round(model_field, decimal_places)
                if operator == '=':
                    q_objects &= Q(**{ann_key: round(parsed, decimal_places)})
                else:
                    q_objects &= ~Q(**{ann_key: round(parsed, decimal_places)})
            elif operator == '>':
                q_objects &= Q(**{f"{model_field}__gt": float(value) if str(value).replace('.', '', 1).isdigit() else value})
            elif operator == '<':
                q_objects &= Q(**{f"{model_field}__lt": float(value) if str(value).replace('.', '', 1).isdigit() else value})
            elif operator == 'contains':
                q_objects &= Q(**{f"{model_field}__icontains": value})

        # Apply filters
        # On filtre aussi sur est_car_validee=True pour ne renvoyer que le référentiel validé
        queryset = self.get_queryset()
        if annotations:
            queryset = queryset.annotate(**annotations)
        queryset = queryset.filter(q_objects, est_car_validee=True).select_related('commune')
        
        # Optimize query: only fetch what's needed for the frontend tables & charts
        results = []
        for uca in queryset[:1000]: # Limite à 1000 pour éviter de bloquer le navigateur
            results.append({
                'id': uca.code_unite,
                'cat': uca.categorie,
                'com': uca.commune.nom_commune if uca.commune else 'N/A',
                'surf': uca.superficie_ha or 0,
                'statut': 'Inconnu', # Mocked as model doesn't store this directly
                'score': uca.score_ipa,
                'limitant': uca.facteur_limitant
            })
            
        return Response(results, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def fiche_pdf(self, request, pk=None):
        """
        M7: Génération PDF normalisé pour la Fiche Synoptique Parcellaire.
        """
        uca = self.get_object()
        
        from django.http import HttpResponse
        import io
        
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import A4
            
            buffer = io.BytesIO()
            p = canvas.Canvas(buffer, pagesize=A4)
            p.setFont("Helvetica-Bold", 16)
            p.drawString(50, 800, f"Fiche Synoptique Parcellaire - {uca.code_unite}")
            
            p.setFont("Helvetica", 12)
            p.drawString(50, 770, f"Commune: {uca.commune.nom_commune if uca.commune else 'N/A'}")
            p.drawString(50, 750, f"Superficie: {uca.superficie_ha} ha")
            p.drawString(50, 730, f"Classe CAR: {uca.categorie}")
            p.drawString(50, 710, f"Score IPA: {uca.score_ipa}")
            p.drawString(50, 690, f"Facteur limitant: {uca.facteur_limitant}")
            
            p.showPage()
            p.save()
            
            buffer.seek(0)
            return HttpResponse(buffer, content_type='application/pdf')
            
        except ImportError:
            return Response({"error": "ReportLab non installé"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegleClassementViewSet(viewsets.ModelViewSet):
    queryset = RegleClassement.objects.all()
    serializer_class = RegleClassementSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

class ScenarioAMCViewSet(viewsets.ModelViewSet):
    queryset = ScenarioAMC.objects.all()
    serializer_class = ScenarioAMCSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def criteres(self, request):
        """
        Retourne la liste des critères évaluables pour l'AMC.
        """
        criteres = [
            {'id': 'eau', 'label': 'Proximité de l\'eau', 'defaultWeight': 25, 'description': 'normalisation 0-1 (fonction expert validée)'},
            {'id': 'occ', 'label': 'Occupation du sol', 'defaultWeight': 25, 'description': 'normalisation 0-1 (fonction expert validée)'},
            {'id': 'cont', 'label': 'Contraintes physiques', 'defaultWeight': 25, 'description': 'normalisation 0-1 (fonction expert validée)'},
            {'id': 'urb', 'label': 'Éloignement urbain', 'defaultWeight': 25, 'description': 'normalisation 0-1 (fonction expert validée)'}
        ]
        return Response(criteres)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def simuler(self, request):
        """
        Simule le classement AMC sans sauvegarder en base.
        Attend un payload JSON avec 'poids' et 'seuils'.
        """
        poids = request.data.get('poids', {})
        seuils = request.data.get('seuils', {})
        
        seuil_a = seuils.get('A', 70)
        seuil_b = seuils.get('B', 45)

        # Simulation: dans une vraie intégration, on ferait une requête PostGIS
        # sur UniteCarteAgricole pour calculer l'IPA et renvoyer les stats réelles.
        # Ici, on renvoie un résultat simulé pour l'API.
        
        resultat = {
            'summary': 'A 4500.0 ha · B 2100.0 ha · C 1200.0 ha',
            'by': { 'A': 4500.0, 'B': 2100.0, 'C': 1200.0 },
            'chg': [
                {'id': 'UCA-001', 'from': 'B', 'to': 'A', 'ipa': 75.5},
                {'id': 'UCA-002', 'from': 'C', 'to': 'B', 'ipa': 48.2}
            ]
        }
        
        return Response(resultat, status=status.HTTP_200_OK)
