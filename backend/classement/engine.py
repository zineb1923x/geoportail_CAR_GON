import logging
from .models import RegleClassement
from audit.models import AuditLog

logger = logging.getLogger(__name__)

class ClassementEngine:
    """
    Moteur principal de classement A/B/C.
    Applique la logique métier : Exclusions > Forçages > Scoring IPA.
    """
    
    def __init__(self, scoring_algorithm, user=None):
        self.scoring_algorithm = scoring_algorithm
        self.user = user
        self.regles_actives = list(RegleClassement.objects.filter(actif=True))
        
    def evaluate_unit(self, unit_feature, criteria_weights):
        """
        Évalue une unité territoriale (entité géométrique avec attributs)
        et renvoie sa classe finale.
        
        :param unit_feature: Dictionnaire représentant l'unité (doit contenir 'geom' et les attributs)
        :param criteria_weights: Dictionnaire des critères.
        :return: dict contenant le résultat du classement.
        """
        
        result = {
            'ipa_score': 0.0,
            'categorie': None,
            'motif': None,
            'statut': 'Classé'
        }
        
        # 1. Vérification des règles d'exclusion (Priorité absolue)
        # TODO: L'intersection géométrique doit être faite via PostGIS. 
        # Ici on simule que l'unité a déjà été enrichie spatialement avec les tags de superposition.
        
        exclusions = [r for r in self.regles_actives if r.type_regle == 'exclusion']
        for exclusion in exclusions:
            # Simulation: Si l'unité intersecte la couche d'exclusion
            if unit_feature.get(f'intersects_{exclusion.couche_source}'):
                result['categorie'] = None
                result['statut'] = 'Hors classement'
                result['motif'] = f'Exclusion: {exclusion.couche_source}'
                self._log_action(unit_feature.get('id'), 'Exclusion appliquée', result['motif'])
                return result
                
        # 2. Vérification des règles de forçage A
        forcages_a = [r for r in self.regles_actives if r.type_regle == 'forcage_A']
        for forcage in forcages_a:
            if unit_feature.get(f'intersects_{forcage.couche_source}'):
                result['categorie'] = 'A'
                result['motif'] = f'Forçage: {forcage.couche_source}'
                # On peut quand même calculer l'IPA pour information
                result['ipa_score'] = self.scoring_algorithm.calculate_score(unit_feature, criteria_weights)
                self._log_action(unit_feature.get('id'), 'Forçage A appliqué', result['motif'])
                return result
                
        # 3. Calcul du score IPA normal
        ipa_score = self.scoring_algorithm.calculate_score(unit_feature, criteria_weights)
        result['ipa_score'] = ipa_score
        
        # 4. Application des seuils (Exemple basique)
        if ipa_score >= 80:
            result['categorie'] = 'A'
        elif ipa_score >= 50:
            result['categorie'] = 'B'
        else:
            result['categorie'] = 'C'
            
        result['motif'] = 'Calcul IPA'
        return result
        
    def _log_action(self, unit_id, action, details):
        if not self.user:
            return
            
        try:
            action_code = 'exclusion' if 'Exclusion' in action else ('forcage' if 'Forçage' in action else 'calcul')
            AuditLog.objects.create(
                utilisateur=self.user,
                role_utilisateur=self.user.role if hasattr(self.user, 'role') else '',
                action=action_code,
                module='M6',
                app_label='classement',
                model_name='UniteCarteAgricole',
                object_id=str(unit_id),
                description=f"{action} : {details}",
                donnees_completes={'details': details}
            )
        except Exception as e:
            logger.error(f"Erreur d'audit: {e}")
