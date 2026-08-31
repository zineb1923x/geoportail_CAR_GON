from celery import shared_task
from django.utils import timezone
from .models import ScenarioAMC
from .engine import ClassementEngine
import time

@shared_task(bind=True)
def calculer_scenario_amc_task(self, scenario_id, user_id=None):
    """
    Tâche asynchrone pour exécuter la simulation de classement A/B/C.
    M6-08 : Calcul de l'IPA par algèbre de cartes sur l'emprise choisie (asynchrone).
    """
    try:
        scenario = ScenarioAMC.objects.get(id=scenario_id)
        
        # Mettre à jour l'état si besoin (on pourrait avoir un champ 'statut_calcul')
        
        start_time = time.time()
        
        # Initialiser le moteur
        engine = ClassementEngine(scenario=scenario, user=None) # user_id could be resolved to a User instance if needed for audit
        
        # Exécuter la simulation
        resultats = engine.run_simulation()
        
        end_time = time.time()
        duree = end_time - start_time
        
        # Mettre à jour le scénario avec la date de calcul et la durée
        scenario.date_calcul = timezone.now()
        scenario.duree_calcul_secondes = round(duree, 2)
        scenario.save(update_fields=['date_calcul', 'duree_calcul_secondes'])
        
        return {
            'status': 'success',
            'scenario_id': scenario_id,
            'summary': resultats['summary'],
            'changements': resultats['changements'],
            'top_units': resultats['top_units'],
            'duree_secondes': round(duree, 2)
        }
        
    except ScenarioAMC.DoesNotExist:
        return {'status': 'error', 'message': f"Scenario {scenario_id} introuvable."}
    except Exception as e:
        import traceback
        return {'status': 'error', 'message': str(e), 'traceback': traceback.format_exc()}
