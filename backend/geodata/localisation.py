import json
from django.contrib.gis.geos import GEOSGeometry, Point
from classement.models import UniteCarteAgricole

class LocalisationService:
    @staticmethod
    def localiser_coordonnees(lat, lng):
        """M2-01: Pointing direct et conversion à la volée."""
        # TODO: conversion de projection si besoin, pour l'instant on suppose wgs84
        point = Point(float(lng), float(lat), srid=4326)
        point_lambert = point.transform(26192, clone=True)
        return {
            'wgs84': {'lat': lat, 'lng': lng},
            'lambert': {'x': point_lambert.x, 'y': point_lambert.y}
        }
        
    @staticmethod
    def localiser_titre_foncier(tf):
        """M2-04: Recherche sur la couche parcellaire ANCFCC."""
        # Mock pour l'instant
        return {
            'tf': tf,
            'statut': 'Melk',
            'superficie_ha': 15.5,
            'commune': 'Guelmim',
            'geojson': {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-9.99, 28.98]
                },
                "properties": {"tf": tf}
            }
        }

    @staticmethod
    def localiser_commune(nom_commune):
        """M2-05: Zoom automatique et affichage des statistiques."""
        # Mock des limites de commune
        return {
            'nom': nom_commune,
            'geojson': {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-10.05, 28.98]
                },
                "properties": {"nom": nom_commune}
            }
        }
        
    @staticmethod
    def parser_fichier_geo(file_obj):
        """M2-03: Import de fichier géométrique, contrôle topo-géométrique."""
        # Lit un fichier geojson
        try:
            data = json.load(file_obj)
            # Validation très basique
            if data.get('type') != 'FeatureCollection':
                return None, "Le fichier doit être une FeatureCollection valide."
            return data, None
        except Exception as e:
            return None, str(e)
