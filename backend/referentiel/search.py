import re
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from classement.models import UniteCarteAgricole
from django.contrib.gis.geos import Point

# Liste statique des communes pour la démo
COMMUNES_MOCK = [
    "Guelmim", "Asrir", "Tighmert", "Fask", "Abaynou", 
    "Bouizakarne", "Taghjijt", "Sidi Ifni", "Mirleft", 
    "Tan-Tan", "El Ouatia", "Assa", "Zag"
]

@api_view(['GET'])
@permission_classes([AllowAny])
def recherche_globale(request):
    """
    Endpoint de recherche unifiée (M1-06).
    Recherche par Titre Foncier, Identifiant Unité CAR, ou Commune.
    """
    query = request.query_params.get('q', '').strip()
    if len(query) < 2:
        return Response([])

    results = []
    
    # 1. Recherche par Commune (Mock pour l'instant)
    for c in COMMUNES_MOCK:
        if query.lower() in c.lower():
            results.append({
                'type': 'Commune',
                'label': f"Commune de {c}",
                'sous_label': 'Découpage administratif',
                'id': c
            })

    # 2. Recherche par Unité CAR (si la table est peuplée)
    unites = UniteCarteAgricole.objects.filter(code_unite__icontains=query)[:5]
    for u in unites:
        results.append({
            'type': 'Unité CAR',
            'label': u.code_unite,
            'sous_label': f"Catégorie {u.categorie_finale}",
            'id': u.code_unite
        })

    # 3. Recherche par Titre Foncier (Mock)
    # Dans une vraie implémentation, on chercherait dans la couche des titres fonciers
    if re.match(r'^[A-Z0-9/]+$', query.upper()) or 'TF' in query.upper():
        results.append({
            'type': 'Titre Foncier',
            'label': f"TF {query.upper()}",
            'sous_label': 'Propriété privée',
            'id': query.upper()
        })

    return Response(results[:10])


@api_view(['GET'])
@permission_classes([AllowAny])
def coordonnees_info(request):
    """
    Interrogation ponctuelle par coordonnées WGS84 ou Lambert.
    Renvoie les infos croisées des couches à ce point (M1-02).
    """
    lat = request.query_params.get('lat')
    lng = request.query_params.get('lng')
    
    if not lat or not lng:
        return Response({'error': 'Coordonnées lat/lng manquantes'}, status=400)
        
    try:
        lat = float(lat)
        lng = float(lng)
    except ValueError:
        return Response({'error': 'Coordonnées invalides'}, status=400)

    # Point géométrique (WGS84)
    point = Point(lng, lat, srid=4326)
    point_lambert = point.transform(26192, clone=True)

    info = {
        'coordonnees': {
            'wgs84': {'lat': lat, 'lng': lng},
            'lambert': {'x': point_lambert.x, 'y': point_lambert.y}
        },
        'resultats': []
    }

    # Interrogation de l'Unité CAR (si disponible)
    unite = UniteCarteAgricole.objects.filter(geom__contains=point_lambert).first()
    if unite:
        info['resultats'].append({
            'couche': 'Carte Agricole',
            'valeur': f"Catégorie {unite.categorie_finale} ({unite.code_unite})"
        })
    else:
        info['resultats'].append({
            'couche': 'Carte Agricole',
            'valeur': "Hors classement"
        })

    # (Dans une vraie implémentation, on ferait un ST_Intersects sur toutes les couches validées)
    info['resultats'].append({'couche': 'Commune', 'valeur': 'Guelmim (estimé)'})
    info['resultats'].append({'couche': 'Type de sol', 'valeur': 'Non renseigné'})
    info['resultats'].append({'couche': 'Statut Foncier', 'valeur': 'Melk (estimé)'})

    return Response(info)
