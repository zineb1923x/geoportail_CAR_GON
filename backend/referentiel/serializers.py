from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from referentiel.models import DomaineValeur, CoucheCatalogue, MetadonneeISO, Genealogie, VersionCouche


class DomaineValeurSerializer(serializers.ModelSerializer):
    class Meta:
        model = DomaineValeur
        fields = '__all__'


class CoucheCatalogueSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoucheCatalogue
        fields = '__all__'


class MetadonneeISOSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetadonneeISO
        fields = '__all__'


class GenealogieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genealogie
        fields = '__all__'


class VersionCoucheSerializer(serializers.ModelSerializer):
    class Meta:
        model = VersionCouche
        fields = '__all__'


# ===================================================================
# SERIALIZERS DÉTAILLÉS (pour le modal de détail de couche)
# ===================================================================

class VersionCoucheDetailSerializer(serializers.ModelSerializer):
    """Version avec le nom d'utilisateur de l'auteur (pas juste l'ID)."""
    auteur_nom = serializers.SerializerMethodField()

    class Meta:
        model = VersionCouche
        fields = [
            'id', 'couche', 'numero_version', 'description',
            'statut_avant', 'statut_apres', 'auteur', 'auteur_nom',
            'date_version', 'est_restaurable',
        ]

    def get_auteur_nom(self, obj):
        if obj.auteur:
            return obj.auteur.get_full_name() or obj.auteur.username
        return 'Système'


class MetadonneeISODetailSerializer(serializers.ModelSerializer):
    """Métadonnées ISO 19115 — lecture/écriture complète."""
    class Meta:
        model = MetadonneeISO
        fields = [
            'id', 'couche', 'titre', 'resume', 'mots_cles',
            'contact_responsable', 'organisme', 'date_publication',
            'date_revision', 'emprise_ouest', 'emprise_est',
            'emprise_nord', 'emprise_sud', 'systeme_reference',
            'qualite', 'contraintes_acces', 'licence',
        ]


class CoucheCatalogueDetailSerializer(serializers.ModelSerializer):
    """Fiche de couche enrichie avec le nombre de versions et la présence de métadonnées."""
    nb_versions = serializers.SerializerMethodField()
    has_metadonnee = serializers.SerializerMethodField()
    auteur_nom = serializers.SerializerMethodField()

    class Meta:
        model = CoucheCatalogue
        fields = [
            'id', 'nom_technique', 'nom_affichage', 'description',
            'domaine', 'sous_domaine', 'thematique', 'type_geometrie', 'table_django', 'srid',
            'est_editable', 'statut', 'millesime', 'source',
            'echelle_reference', 'forcage_categorie', 'est_exclusion',
            'date_creation', 'date_modification', 'auteur_modification',
            'auteur_nom', 'nb_versions', 'has_metadonnee',
        ]

    def get_nb_versions(self, obj):
        return obj.versions.count()

    def get_has_metadonnee(self, obj):
        return hasattr(obj, 'metadonnee_iso') and obj.metadonnee_iso is not None

    def get_auteur_nom(self, obj):
        if obj.auteur_modification:
            return obj.auteur_modification.get_full_name() or obj.auteur_modification.username
        return None

