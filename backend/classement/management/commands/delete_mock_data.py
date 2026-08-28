from django.core.management.base import BaseCommand
from classement.models import ScenarioAMC

class Command(BaseCommand):
    help = 'Supprime toutes les données fictives de test'

    def handle(self, *args, **options):
        self.stdout.write("Suppression des données fictives de test...")
        
        # Supprime le scénario de test. 
        # Grâce à 'on_delete=models.CASCADE' dans les modèles, cela supprimera 
        # automatiquement toutes les parcelles (Classes A, B, C et UCA) associées à ce test.
        deleted_count, details = ScenarioAMC.objects.filter(nom="Scénario de Test Fictif").delete()
        
        if deleted_count > 0:
            self.stdout.write(self.style.SUCCESS(
                f"Succès ! Les données de test ont été supprimées : {details}"
            ))
        else:
            self.stdout.write(self.style.WARNING(
                "Aucune donnée de test n'a été trouvée (déjà supprimée)."
            ))
