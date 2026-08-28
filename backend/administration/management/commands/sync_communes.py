import sys
from django.core.management.base import BaseCommand
from django.db import connection
from referentiel.models import CoucheCatalogue
from administration.models import Commune, Province

from django.contrib.gis.geos import MultiPolygon, Polygon

class Command(BaseCommand):
    help = 'Synchronise la table administration_commune avec la couche dynamique des communes du référentiel'

    def handle(self, *args, **options):
        # 1. Trouver la couche des communes dans le CoucheCatalogue
        couche = CoucheCatalogue.objects.filter(nom_technique__icontains='communes').first()
        if getattr(couche, 'thematique', '') == 'administration' or not couche:
             couche = CoucheCatalogue.objects.filter(nom_technique='import_communes').first()
             
        if not couche:
            self.stdout.write(self.style.ERROR("Aucune couche 'communes' n'est définie dans le référentiel."))
            return
            
        table_name = couche.nom_technique
        if not table_name:
            self.stdout.write(self.style.ERROR("La couche 'communes' n'a pas de nom_technique défini."))
            return
            
        self.stdout.write(self.style.SUCCESS(f"Couche source trouvée : {table_name}"))
        
        # 2. Créer une province par défaut si elle n'existe pas
        # Normalement la province dépend des polygones, mais on met un fallback
        dummy_geom = MultiPolygon(Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0))))
        dummy_geom.srid = 26192
        province, created = Province.objects.get_or_create(
            code_province="GON",
            defaults={"nom_province": "Guelmim-Oued Noun", "geom": dummy_geom}
        )
        if created:
            self.stdout.write(self.style.WARNING("Province par défaut 'GON' créée."))
            
        # 3. Synchronisation
        try:
            with connection.cursor() as cursor:
                # Obtenir la liste des colonnes pour trouver un nom
                cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'")
                cols = [row[0].lower() for row in cursor.fetchall()]
                
                nom_col = None
                for candidate in ["nom", "nom_commune", "name", "commune", "nom_com", "label"]:
                    if candidate in cols:
                        nom_col = candidate
                        break
                
                if not nom_col:
                    nom_col = "id::text" # Fallback si pas de colonne texte claire
                else:
                    nom_col = f'"{nom_col}"'
                
                # Fetch avec conversion SRID et cast en MultiPolygon pour coller au modèle
                query = f'''
                    SELECT id, {nom_col}, 
                        ST_Multi(
                            CASE 
                                WHEN ST_SRID(geom) > 0 AND ST_SRID(geom) != 26192 THEN ST_Transform(geom, 26192)
                                ELSE geom
                            END
                        ) as geom
                    FROM "{table_name}"
                    WHERE geom IS NOT NULL
                '''
                cursor.execute(query)
                rows = cursor.fetchall()
                
                count_created = 0
                count_updated = 0
                for row in rows:
                    feat_id = row[0]
                    nom_commune = str(row[1] or f"Commune_{feat_id}")
                    geom_wkb = row[2]
                    
                    # On utilise un préfixe COM_ pour les codes
                    code_commune = f"COM_{feat_id}"
                    
                    obj, was_created = Commune.objects.update_or_create(
                        code_commune=code_commune,
                        defaults={
                            'nom_commune': nom_commune,
                            'province': province,
                            'geom': geom_wkb,
                        }
                    )
                    if was_created:
                        count_created += 1
                    else:
                        count_updated += 1
                        
                self.stdout.write(self.style.SUCCESS(
                    f"Terminé ! {count_created} créées, {count_updated} mises à jour "
                    f"depuis '{table_name}' vers la table 'administration_commune'."
                ))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erreur lors de la synchronisation : {e}"))
