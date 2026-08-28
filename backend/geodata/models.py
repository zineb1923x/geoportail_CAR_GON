"""
Modèles geodata — DÉPRÉCIÉ.

Les modèles de ce module (CoucheCartographique, ScenarioCAR, Parcelle)
ont été remplacés par les nouvelles apps thématiques conformes au MCD :
  - referentiel.CoucheCatalogue (remplace CoucheCartographique)
  - classement.ScenarioAMC (remplace ScenarioCAR)
  - classement.UniteCarteAgricole (remplace Parcelle)

Ce fichier est conservé temporairement pour ne pas casser les migrations
existantes. Après la migration vers le nouveau schéma, ce fichier sera
supprimé.
"""

# Les anciens modèles sont commentés pour éviter les conflits
# avec les nouveaux modèles. La suppression sera faite après migration.

# from django.contrib.gis.db import models
# from django.conf import settings
#
# class CoucheCartographique(models.Model): ...
# class ScenarioCAR(models.Model): ...
# class Parcelle(models.Model): ...
