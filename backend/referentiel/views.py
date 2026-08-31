"""
Vues API pour le référentiel de couches — inclut l'endpoint d'import.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, parser_classes, action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import IsEditeurOrAdmin
from django.db import models
from referentiel.models import CoucheCatalogue, MetadonneeISO, Genealogie, DomaineValeur, VersionCouche
from referentiel.serializers import (
    CoucheCatalogueSerializer, MetadonneeISOSerializer,
    GenealogieSerializer, DomaineValeurSerializer, VersionCoucheSerializer,
    CoucheCatalogueDetailSerializer, VersionCoucheDetailSerializer,
    MetadonneeISODetailSerializer
)
from referentiel.services import LayerImportService


class DomaineValeurViewSet(viewsets.ModelViewSet):
    queryset = DomaineValeur.objects.all()
    serializer_class = DomaineValeurSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]


class CoucheCatalogueViewSet(viewsets.ModelViewSet):
    queryset = CoucheCatalogue.objects.all()
    serializer_class = CoucheCatalogueSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]

    def get_permissions(self):
        from rest_framework.permissions import AllowAny
        if self.action in ['list', 'retrieve', 'geojson', 'versions', 'metadonnees', 'champs']:
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        thematique = self.request.query_params.get('thematique')
        statut = self.request.query_params.get('statut')
        if thematique:
            qs = qs.filter(thematique=thematique)
        if statut:
            qs = qs.filter(statut=statut)
        return qs

    def retrieve(self, request, *args, **kwargs):
        """Retourne la fiche enrichie d'une couche (avec nb_versions, has_metadonnee)."""
        instance = self.get_object()
        serializer = CoucheCatalogueDetailSerializer(instance)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        table_name = instance.nom_technique
        if table_name and table_name.startswith('import_'):
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(f'DROP TABLE IF EXISTS "{table_name}" CASCADE')
        
        from audit.models import AuditLog
        AuditLog.objects.create(
            utilisateur=self.request.user,
            role_utilisateur=getattr(self.request.user, 'role', ''),
            action='delete',
            module='M3',
            app_label='referentiel',
            model_name='CoucheCatalogue',
            object_id=str(instance.id),
            object_repr=str(instance),
            description=f"Suppression/Rejet de la couche « {instance.nom_affichage or instance.nom_technique} »"
        )
        instance.delete()

    @action(detail=True, methods=['post'])
    def soumettre(self, request, pk=None):
        """Passe la couche de brouillon à soumise."""
        couche = self.get_object()
        
        # Seuls éditeurs/admins peuvent soumettre
        role = getattr(request.user, 'role', '')
        if role not in ('editeur', 'admin') and not request.user.is_superuser:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
            
        if couche.statut != 'brouillon':
            return Response({'error': 'La couche doit être à l\'état brouillon.'}, status=status.HTTP_400_BAD_REQUEST)
            
        couche.statut = 'soumise'
        couche.save()
        
        from audit.models import AuditLog
        AuditLog.objects.create(
            utilisateur=request.user,
            role_utilisateur=getattr(request.user, 'role', ''),
            action='submit',
            module='M3',
            app_label='referentiel',
            model_name='CoucheCatalogue',
            object_id=str(couche.id),
            object_repr=str(couche),
            description=f"Soumission pour validation : {couche.nom_affichage}"
        )
        return Response({'status': 'Couche soumise à validation avec succès.'})

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        """Passe la couche de soumise à brouillon."""
        couche = self.get_object()
        
        role = getattr(request.user, 'role', '')
        if role != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Seul un Administrateur peut rejeter une couche.'}, status=status.HTTP_403_FORBIDDEN)
            
        if couche.statut != 'soumise':
            return Response({'error': 'La couche doit être à l\'état soumise.'}, status=status.HTTP_400_BAD_REQUEST)
            
        couche.statut = 'brouillon'
        couche.save()
        
        from audit.models import AuditLog
        AuditLog.objects.create(
            utilisateur=request.user,
            role_utilisateur=role,
            action='reject',
            module='M3',
            app_label='referentiel',
            model_name='CoucheCatalogue',
            object_id=str(couche.id),
            object_repr=str(couche),
            description=f"Rejet de la couche : {couche.nom_affichage}"
        )
        return Response({'status': 'Couche rejetée avec succès.'})

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        """Archive l'ancienne couche et valide la nouvelle en créant une VersionCouche."""
        couche = self.get_object()
        
        # Seuls les admins peuvent valider
        role = getattr(request.user, 'role', '')
        if role != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Seul un Administrateur peut valider une couche.'}, status=status.HTTP_403_FORBIDDEN)
            
        if couche.statut not in ['soumise', 'brouillon']:
            return Response({'error': 'La couche doit être à l\'état soumise ou brouillon pour être validée.'}, status=status.HTTP_400_BAD_REQUEST)

        # Archiver l'ancienne couche de même thématique (si elle existe et est validée/opposable)
        anciennes_couches = CoucheCatalogue.objects.filter(
            thematique=couche.thematique,
            statut__in=['validee', 'opposable']
        ).exclude(id=couche.id)
        
        for ancienne in anciennes_couches:
            ancienne.statut = 'archivee'
            ancienne.save()
            
        # Valider la nouvelle couche
        couche.statut = 'validee'
        couche.save()
        
        # Calculer le numéro de version (max + 1)
        dernier_num = VersionCouche.objects.filter(couche=couche).aggregate(models.Max('numero_version'))['numero_version__max']
        num_version = 1 if dernier_num is None else dernier_num + 1

        # Créer une version d'historique
        VersionCouche.objects.create(
            couche=couche,
            numero_version=num_version,
            description="Validation et publication de la couche",
            statut_avant="soumise",
            statut_apres="validee",
            auteur=request.user
        )
        
        from audit.models import AuditLog
        AuditLog.objects.create(
            utilisateur=request.user,
            role_utilisateur=getattr(request.user, 'role', ''),
            action='validate',
            module='M3',
            app_label='referentiel',
            model_name='CoucheCatalogue',
            object_id=str(couche.id),
            object_repr=str(couche),
            description=f"Validation de la couche : {couche.nom_affichage} (Version {num_version})"
        )
        return Response({'status': 'Couche validée et publiée avec succès.'})

    @action(detail=True, methods=['get'])
    def geojson(self, request, pk=None):
        couche = self.get_object()
        
        # Mapping thematique to actual django table names
        THEMATIQUE_TO_TABLE = {
            'car_a': 'classement_classe_a',
            'car_b': 'classement_classe_b',
            'car_c': 'classement_classe_c',
            'communes': 'administration_commune',
            'provinces': 'administration_province',
        }
        
        table_name = couche.table_django or THEMATIQUE_TO_TABLE.get(couche.thematique) or couche.nom_technique
        
        if not table_name:
            return Response({"type": "FeatureCollection", "features": []})
        
        import json
        from django.db import connection
        try:
            with connection.cursor() as cursor:
                # On utilise row_to_json pour récupérer toutes les colonnes de la table métier
                # tout en formatant la géométrie en geojson.
                cursor.execute(f'''
                    SELECT 
                        ST_AsGeoJSON(
                            CASE 
                                WHEN ST_SRID(geom) > 0 AND ST_SRID(geom) != 4326 THEN ST_Transform(geom, 4326)
                                ELSE geom
                            END
                        ) as geom_json,
                        row_to_json(t) as properties,
                        id
                    FROM "{table_name}" t
                    WHERE geom IS NOT NULL
                    LIMIT 2000
                ''')
                rows = cursor.fetchall()
            
            features = []
            for row in rows:
                if row[0]:
                    geom_dict = json.loads(row[0])
                    props = row[1] if isinstance(row[1], dict) else json.loads(row[1])
                    # Suppression du gros objet geom des propriétés
                    if 'geom' in props:
                        del props['geom']
                    props['couche'] = couche.nom_affichage
                    
                    # Mapping spécifique pour les popups du MapPanel (cat, surf, etc)
                    if 'score_ipa' in props:
                        props['cat'] = couche.nom_affichage.split('-')[0].strip() if '-' in couche.nom_affichage else 'CAR'
                    if 'superficie_ha' in props:
                        props['surf'] = props['superficie_ha']
                    if 'facteur_limitant' in props:
                        props['Facteur Limitant'] = props['facteur_limitant']
                        
                    features.append({
                        "type": "Feature",
                        "id": row[2],
                        "geometry": geom_dict,
                        "properties": props
                    })
            return Response({
                "type": "FeatureCollection",
                "features": features
            })
        except Exception as e:
            return Response({
                "type": "FeatureCollection",
                "features": [],
                "error": str(e)
            })

    # ------------------------------------------------------------------
    # ENDPOINT NESTED : Historique des versions d'une couche
    # GET /api/referentiel/couches/{id}/versions/
    # ------------------------------------------------------------------
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """Retourne l'historique des versions d'une couche, trié du plus récent au plus ancien."""
        couche = self.get_object()
        versions = VersionCouche.objects.filter(couche=couche).select_related('auteur').order_by('-numero_version')
        serializer = VersionCoucheDetailSerializer(versions, many=True)
        return Response(serializer.data)

    # ------------------------------------------------------------------
    # ENDPOINT NESTED : Métadonnées ISO 19115 d'une couche
    # GET /api/referentiel/couches/{id}/metadonnees/
    # PATCH /api/referentiel/couches/{id}/metadonnees/  (Éditeur/Admin)
    # ------------------------------------------------------------------
    @action(detail=True, methods=['get', 'patch'])
    def metadonnees(self, request, pk=None):
        """
        GET : Retourne les métadonnées ISO 19115 de la couche.
        PATCH : Met à jour les métadonnées (Éditeur/Admin uniquement).
        """
        couche = self.get_object()

        if request.method == 'PATCH':
            # Vérifier les permissions d'édition
            if not request.user.is_authenticated:
                return Response({'error': 'Authentification requise.'}, status=status.HTTP_401_UNAUTHORIZED)
            role = getattr(request.user, 'role', '')
            if role not in ('editeur', 'admin') and not request.user.is_superuser:
                return Response({'error': 'Seuls les Éditeurs et Administrateurs peuvent modifier les métadonnées.'},
                                status=status.HTTP_403_FORBIDDEN)

            try:
                meta = couche.metadonnee_iso
            except MetadonneeISO.DoesNotExist:
                # Créer la fiche de métadonnées si elle n'existe pas
                meta = MetadonneeISO(couche=couche, titre=couche.nom_affichage or couche.nom_technique)

            serializer = MetadonneeISODetailSerializer(meta, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        # GET
        try:
            meta = couche.metadonnee_iso
            serializer = MetadonneeISODetailSerializer(meta)
            return Response(serializer.data)
        except MetadonneeISO.DoesNotExist:
            return Response({
                'id': None,
                'couche': couche.id,
                'titre': couche.nom_affichage or couche.nom_technique,
                'resume': '', 'mots_cles': '', 'contact_responsable': '',
                'organisme': '', 'date_publication': None, 'date_revision': None,
                'emprise_ouest': None, 'emprise_est': None,
                'emprise_nord': None, 'emprise_sud': None,
                'systeme_reference': f'EPSG:{couche.srid}',
                'qualite': '', 'contraintes_acces': '', 'licence': '',
            })

    # ------------------------------------------------------------------
    # ENDPOINT NESTED : Champs (colonnes) de la table PostGIS
    # GET /api/referentiel/couches/{id}/champs/
    # ------------------------------------------------------------------
    @action(detail=True, methods=['get', 'patch', 'post'])
    def champs(self, request, pk=None):
        """
        Gère les colonnes de la table PostGIS associée à la couche.
        GET : Liste les colonnes (nom, type, nullable, description).
        PATCH/POST : Met à jour la description (alias) des colonnes.
        """
        couche = self.get_object()
        table_name = couche.nom_technique
        if not table_name:
            return Response([])

        from django.db import connection
        
        if request.method in ['PATCH', 'POST']:
            champs_data = request.data
            if not isinstance(champs_data, list):
                return Response({'error': 'Expected a list of fields'}, status=status.HTTP_400_BAD_REQUEST)
                
            try:
                with connection.cursor() as cursor:
                    for champ in champs_data:
                        nom_colonne = champ.get('nom')
                        description = champ.get('description', '')
                        
                        if nom_colonne:
                            # Use parameterized query or safe formatting for COMMENT
                            # PostgreSQL COMMENT syntax doesn't support parameterized queries directly for identifiers
                            # so we must make sure identifiers are properly quoted
                            cursor.execute(
                                f'COMMENT ON COLUMN "{table_name}"."{nom_colonne}" IS %s',
                                [description]
                            )
                return Response({'status': 'success'})
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Handle GET request
        try:
            with connection.cursor() as cursor:
                # Récupérer les colonnes et leurs types
                cursor.execute("""
                    SELECT 
                        c.column_name,
                        c.data_type,
                        c.is_nullable,
                        c.character_maximum_length,
                        pgd.description
                    FROM information_schema.columns c
                    LEFT JOIN pg_catalog.pg_statio_all_tables st
                        ON st.relname = c.table_name
                        AND st.schemaname = c.table_schema
                    LEFT JOIN pg_catalog.pg_description pgd
                        ON pgd.objoid = st.relid
                        AND pgd.objsubid = c.ordinal_position
                    WHERE c.table_name = %s
                    AND c.table_schema = 'public'
                    ORDER BY c.ordinal_position
                """, [table_name])
                columns = cursor.fetchall()

            champs = []
            for col in columns:
                col_type = col[1]
                if col[3]:  # character_maximum_length
                    col_type = f'{col[1]}({col[3]})'
                champs.append({
                    'nom': col[0],
                    'type': col_type,
                    'nullable': col[2] == 'YES',
                    'description': col[4] or '',
                    'est_geometrie': col[1] in ('USER-DEFINED', 'geometry'),
                })
            return Response(champs)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MetadonneeISOViewSet(viewsets.ModelViewSet):
    queryset = MetadonneeISO.objects.all()
    serializer_class = MetadonneeISOSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]


class GenealogieViewSet(viewsets.ModelViewSet):
    queryset = Genealogie.objects.all()
    serializer_class = GenealogieSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]


class VersionCoucheViewSet(viewsets.ModelViewSet):
    queryset = VersionCouche.objects.all()
    serializer_class = VersionCoucheSerializer
    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsEditeurOrAdmin])
@parser_classes([MultiPartParser, FormParser])
def import_layer_view(request):
    """
    Endpoint d'import de couches géospatiales.
    
    Méthode : POST (multipart/form-data)
    Paramètres :
        - file : le fichier géospatial (SHP zippé, GeoJSON, KML, GPKG, DXF)
        - nom : nom de la couche (ex: « carte_agricole_2026 »)
        - thematique : clé thématique (ex: « ressources_eau », « classement »)
        - description : description de la couche (optionnel)
        - source : source / organisme producteur (optionnel)
    
    Retour :
        - 201 : import réussi
        - 400 : erreur de validation ou d'import
        - 403 : profil insuffisant (seuls Éditeur et Administrateur ont le droit)
    """
    file = request.FILES.get('file')
    if not file:
        return Response(
            {'error': 'Aucun fichier fourni. Veuillez joindre un fichier géospatial.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    nom = request.data.get('nom', '').strip()
    if not nom:
        return Response(
            {'error': 'Le champ « nom » est obligatoire.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    thematique = request.data.get('thematique', '').strip()
    valid_thematiques = [c[0] for c in CoucheCatalogue._meta.get_field('thematique').choices]
    if thematique not in valid_thematiques:
        return Response(
            {'error': f'Thématique invalide. Valeurs acceptées : {", ".join(valid_thematiques)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    description = request.data.get('description', '')
    source = request.data.get('source', '')

    # Lancer l'import
    service = LayerImportService(user=request.user)
    result = service.import_layer(
        uploaded_file=file,
        nom_couche=nom,
        thematique=thematique,
        description=description,
        source=source,
    )

    if result['success']:
        return Response({
            'message': f"Import réussi : {result['feature_count']} entités importées dans « {nom} ».",
            'couche_id': result['couche_id'],
            'table_name': result['table_name'],
            'feature_count': result['feature_count'],
            'warnings': result['warnings'],
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'error': 'Échec de l\'import.',
            'details': result['errors'],
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_thematiques(request):
    """Retourne la liste des thématiques disponibles pour l'import."""
    choices = CoucheCatalogue._meta.get_field('thematique').choices
    return Response([{'value': c[0], 'label': c[1]} for c in choices])
