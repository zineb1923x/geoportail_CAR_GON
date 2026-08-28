from django.urls import path, include
from rest_framework.routers import DefaultRouter
from referentiel.views import (
    DomaineValeurViewSet, CoucheCatalogueViewSet, MetadonneeISOViewSet,
    GenealogieViewSet, VersionCoucheViewSet,
    import_layer_view, list_thematiques
)
from referentiel.search import recherche_globale, coordonnees_info

router = DefaultRouter()
router.register(r'domaines', DomaineValeurViewSet)
router.register(r'couches', CoucheCatalogueViewSet)
router.register(r'metadonnees', MetadonneeISOViewSet)
router.register(r'genealogies', GenealogieViewSet)
router.register(r'versions', VersionCoucheViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('import/', import_layer_view, name='import-layer'),
    path('thematiques/', list_thematiques, name='list-thematiques'),
    path('recherche-globale/', recherche_globale, name='recherche-globale'),
    path('coordonnees-info/', coordonnees_info, name='coordonnees-info'),
]
