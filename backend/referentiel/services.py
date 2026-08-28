"""
Service d'import de couches géospatiales.
Gère l'import de fichiers Shapefile (.shp), GeoJSON, KML, GeoPackage (.gpkg)
dans la géodatabase PostGIS du géoportail.
"""

import os
import json
import zipfile
import tempfile
import logging
from datetime import datetime

from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import GEOSGeometry
from django.db import connection

from referentiel.models import CoucheCatalogue, VersionCouche, Genealogie
from audit.models import AuditLog

logger = logging.getLogger(__name__)

# Extensions acceptées
ALLOWED_EXTENSIONS = {
    '.geojson', '.json',   # GeoJSON
    '.zip',                # Shapefile (zippé)
    '.kml', '.kmz',        # KML/KMZ
    '.gpkg',               # GeoPackage
    '.dxf',                # AutoCAD DXF
}

SRID_STOCKAGE = 26192  # Lambert Maroc zone Sud (Merchich)


class ImportError(Exception):
    """Erreur spécifique à l'import de couches."""
    pass


class LayerImportService:
    """
    Service d'import de couches géospatiales.
    
    Pipeline :
    1. Validation du fichier (extension, taille, intégrité)
    2. Extraction (si zip/shapefile)
    3. Lecture via OGR/GDAL
    4. Contrôle topologique basique
    5. Reprojection vers SRID de stockage (26192)
    6. Création de la table dynamique dans PostGIS
    7. Insertion des entités
    8. Enregistrement dans le catalogue (statut « brouillon »)
    9. Journalisation dans AuditLog
    """

    def __init__(self, user):
        self.user = user
        self.errors = []
        self.warnings = []
        self.feature_count = 0

    def import_layer(self, uploaded_file, nom_couche, thematique, description='', source=''):
        """
        Point d'entrée principal pour l'import d'une couche.
        
        :param uploaded_file: Fichier uploadé (InMemoryUploadedFile ou TemporaryUploadedFile)
        :param nom_couche: Nom technique de la couche (format : thematique_objet_millesime)
        :param thematique: Thématique (clé de THEMATIQUE_CHOICES)
        :param description: Description de la couche
        :param source: Source / organisme producteur
        :return: dict avec le résultat de l'import
        """
        result = {
            'success': False,
            'couche_id': None,
            'feature_count': 0,
            'table_name': '',
            'errors': [],
            'warnings': [],
        }

        try:
            # 1. Validation de l'extension
            filename = uploaded_file.name
            ext = os.path.splitext(filename)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                raise ImportError(
                    f"Extension « {ext} » non supportée. "
                    f"Formats acceptés : {', '.join(sorted(ALLOWED_EXTENSIONS))}"
                )

            # 2. Sauvegarder le fichier temporairement
            file_path = self._save_temp_file(uploaded_file, ext)

            # 3. Si c'est un ZIP (shapefile), extraire
            if ext == '.zip':
                file_path = self._extract_shapefile(file_path)

            # 4. Lire les données avec OGR/GDAL
            ds = DataSource(file_path)
            if ds.layer_count == 0:
                raise ImportError("Le fichier ne contient aucune couche.")

            layer = ds[0]
            geom_type = layer.geom_type.name
            srs = layer.srs
            field_names = layer.fields
            field_types = [f.__name__ for f in layer.field_types]

            logger.info(
                f"Import de « {nom_couche} » : {layer.num_feat} entités, "
                f"géométrie={geom_type}, SRID source={srs.srid if srs else 'inconnu'}"
            )

            # 5. Construire le nom de table sécurisé
            table_name = self._sanitize_table_name(nom_couche)

            # 6. Créer la table PostGIS dynamiquement
            self._create_postgis_table(table_name, field_names, field_types, geom_type)

            # 7. Insérer les entités (avec reprojection vers SRID 26192)
            inserted = self._insert_features(table_name, layer, field_names, srs)
            self.feature_count = inserted

            # 8. Enregistrer dans le catalogue
            couche = CoucheCatalogue.objects.create(
                nom_technique=table_name,
                nom_affichage=nom_couche,
                description=description,
                thematique=thematique,
                type_geometrie=self._map_geom_type(geom_type),
                table_django='',
                srid=SRID_STOCKAGE,
                est_editable=True,
                statut='brouillon',
                millesime=datetime.now().year,
                source=source,
                auteur_modification=self.user,
            )

            # 9. Créer la version initiale
            VersionCouche.objects.create(
                couche=couche,
                numero_version=1,
                description=f"Import initial — {inserted} entités importées depuis « {filename} »",
                statut_avant='',
                statut_apres='brouillon',
                auteur=self.user,
            )

            # 10. Journaliser
            AuditLog.objects.create(
                utilisateur=self.user,
                role_utilisateur=self.user.role if hasattr(self.user, 'role') else '',
                action='import',
                module='M3',
                app_label='referentiel',
                model_name='CoucheCatalogue',
                object_id=str(couche.id),
                object_repr=str(couche),
                description=f"Import de la couche « {nom_couche} » ({inserted} entités)",
                donnees_completes={
                    'fichier': filename,
                    'nom_couche': nom_couche,
                    'thematique': thematique,
                    'entites': inserted,
                    'geometrie': geom_type,
                    'table': table_name,
                }
            )

            result['success'] = True
            result['couche_id'] = couche.id
            result['feature_count'] = inserted
            result['table_name'] = table_name
            result['warnings'] = self.warnings

        except ImportError as e:
            result['errors'] = [str(e)]
            logger.warning(f"Erreur d'import : {e}")
        except Exception as e:
            result['errors'] = [f"Erreur inattendue : {str(e)}"]
            logger.exception(f"Erreur inattendue lors de l'import de « {nom_couche} »")

        return result

    def _save_temp_file(self, uploaded_file, ext):
        """Sauvegarde le fichier uploadé dans un répertoire temporaire."""
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        for chunk in uploaded_file.chunks():
            tmp.write(chunk)
        tmp.close()
        return tmp.name

    def _extract_shapefile(self, zip_path):
        """Extrait un shapefile depuis un ZIP et retourne le chemin du .shp."""
        extract_dir = tempfile.mkdtemp()
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(extract_dir)

        # Chercher le .shp
        shp_files = []
        for root, dirs, files in os.walk(extract_dir):
            for f in files:
                if f.lower().endswith('.shp'):
                    shp_files.append(os.path.join(root, f))

        if not shp_files:
            raise ImportError(
                "Aucun fichier .shp trouvé dans le ZIP. "
                "Le ZIP doit contenir au minimum : .shp, .shx, .dbf"
            )

        return shp_files[0]

    def _sanitize_table_name(self, name):
        """Transforme un nom de couche en nom de table PostgreSQL unique et valide."""
        import re
        import unicodedata
        import time
        # Retirer les accents
        name = unicodedata.normalize('NFD', name)
        name = ''.join(c for c in name if unicodedata.category(c) != 'Mn')
        # Remplacer les espaces et caractères spéciaux
        name = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower())
        # Préfixer avec "import_"
        if not name.startswith('import_'):
            name = f"import_{name}"
        
        base_name = name[:50]
        # Si la couche existe déjà dans le catalogue, ajouter un timestamp pour l'unicité
        if CoucheCatalogue.objects.filter(nom_technique=base_name).exists():
            base_name = f"{base_name}_{int(time.time())}"
        return base_name[:63]

    def _create_postgis_table(self, table_name, field_names, field_types, geom_type):
        """Crée une table PostGIS dynamiquement."""
        type_mapping = {
            'OFTInteger': 'INTEGER',
            'OFTReal': 'DOUBLE PRECISION',
            'OFTString': 'TEXT',
            'OFTDate': 'DATE',
            'OFTDateTime': 'TIMESTAMP',
            'OFTInteger64': 'BIGINT',
        }

        columns = ['id SERIAL PRIMARY KEY']
        for fname, ftype in zip(field_names, field_types):
            pg_type = type_mapping.get(ftype, 'TEXT')
            safe_name = fname.lower().replace(' ', '_')[:63]
            if safe_name == 'id':
                safe_name = 'orig_id'
            columns.append(f'"{safe_name}" {pg_type}')

        # Champs obligatoires (TDR 5.14)
        columns.append('"statut_cycle" VARCHAR(20) DEFAULT \'brouillon\'')
        columns.append('"millesime" INTEGER')
        columns.append('"source_donnee" TEXT')
        columns.append('"date_modification" TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
        columns.append('"auteur_modification" VARCHAR(150)')

        columns_sql = ',\n    '.join(columns)

        with connection.cursor() as cursor:
            # Supprimer la table si elle existe déjà en résidu
            cursor.execute(f'DROP TABLE IF EXISTS "{table_name}" CASCADE')
            # Créer la table
            cursor.execute(f'''
                CREATE TABLE "{table_name}" (
                    {columns_sql}
                )
            ''')
            # Ajouter la colonne géométrie
            pg_geom = geom_type.upper()
            if pg_geom in ('POLYGON', 'POLYGON25D'):
                pg_geom = 'MULTIPOLYGON'
            elif pg_geom in ('LINESTRING', 'LINESTRING25D'):
                pg_geom = 'MULTILINESTRING'
            elif pg_geom in ('POINT', 'POINT25D'):
                pg_geom = 'POINT'

            cursor.execute(f'''
                SELECT AddGeometryColumn('{table_name}', 'geom', {SRID_STOCKAGE}, '{pg_geom}', 2)
            ''')
            # Index spatial
            cursor.execute(f'''
                CREATE INDEX IF NOT EXISTS "idx_{table_name}_geom" 
                ON "{table_name}" USING GIST (geom)
            ''')

    def _insert_features(self, table_name, layer, field_names, srs):
        """Insère les entités de la couche OGR dans la table PostGIS."""
        inserted = 0
        source_srid = srs.srid if srs and srs.srid else 4326

        with connection.cursor() as cursor:
            for feature in layer:
                try:
                    # Récupérer la géométrie
                    geom = GEOSGeometry(feature.geom.wkt, srid=source_srid)

                    # Reprojeter vers le SRID de stockage
                    if source_srid != SRID_STOCKAGE:
                        geom.transform(SRID_STOCKAGE)

                    # Forcer le type Multi si nécessaire
                    if geom.geom_type == 'Polygon':
                        from django.contrib.gis.geos import MultiPolygon
                        geom = MultiPolygon(geom, srid=SRID_STOCKAGE)
                    elif geom.geom_type == 'LineString':
                        from django.contrib.gis.geos import MultiLineString
                        geom = MultiLineString(geom, srid=SRID_STOCKAGE)

                    # Récupérer les valeurs des champs
                    values = []
                    placeholders = []
                    col_names = []
                    for fname in field_names:
                        val = feature.get(fname)
                        safe_name = fname.lower().replace(' ', '_')[:63]
                        if safe_name == 'id':
                            safe_name = 'orig_id'
                        col_names.append(f'"{safe_name}"')
                        placeholders.append('%s')
                        values.append(val)

                    # Ajouter les champs obligatoires
                    col_names.append('"millesime"')
                    placeholders.append('%s')
                    values.append(datetime.now().year)

                    col_names.append('"auteur_modification"')
                    placeholders.append('%s')
                    values.append(self.user.username if self.user else 'import')

                    col_names.append('"geom"')
                    placeholders.append('ST_GeomFromEWKT(%s)')
                    values.append(geom.ewkt)

                    sql = f'''
                        INSERT INTO "{table_name}" ({', '.join(col_names)})
                        VALUES ({', '.join(placeholders)})
                    '''
                    cursor.execute(sql, values)
                    inserted += 1

                except Exception as e:
                    self.warnings.append(
                        f"Entité {feature.fid} ignorée : {str(e)}"
                    )
                    logger.warning(f"Erreur sur l'entité {feature.fid} : {e}")

        return inserted

    def _map_geom_type(self, ogr_type):
        """Convertit le type de géométrie OGR vers les choix du catalogue."""
        mapping = {
            'Point': 'point',
            'Point25D': 'point',
            'MultiPoint': 'point',
            'LineString': 'ligne',
            'LineString25D': 'ligne',
            'MultiLineString': 'ligne',
            'Polygon': 'polygone',
            'Polygon25D': 'polygone',
            'MultiPolygon': 'multi_polygone',
        }
        return mapping.get(ogr_type, 'polygone')
