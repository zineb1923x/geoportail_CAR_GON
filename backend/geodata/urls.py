from django.urls import path
from .views import localiser_coordonnees, localiser_titre_foncier, localiser_commune, localiser_fichier, export_rapport

urlpatterns = [
    path('localiser/coordonnees/', localiser_coordonnees, name='localiser-coordonnees'),
    path('localiser/titre-foncier/', localiser_titre_foncier, name='localiser-titre-foncier'),
    path('localiser/commune/', localiser_commune, name='localiser-commune'),
    path('localiser/fichier/', localiser_fichier, name='localiser-fichier'),
    path('export/', export_rapport, name='export-rapport'),
]
