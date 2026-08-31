import logging
from .models import RegleClassement, UniteCarteAgricole, ClasseA, ClasseB, ClasseC
from audit.models import AuditLog
from .ahp import calculate_ahp

logger = logging.getLogger(__name__)

class ClassementEngine:
    """
    Moteur principal de classement A/B/C.
    Applique la logique métier : Exclusions > Forçages > Scoring IPA par AHP.
    """
    
    def __init__(self, scenario, user=None):
        self.scenario = scenario
        self.user = user
        self.regles_actives = list(RegleClassement.objects.filter(actif=True).select_related('couche_source'))
        
    def calculer_ahp(self):
        """
        Calcule les poids et le ratio de cohérence à partir de la matrice
        de comparaison stockée dans le scénario.
        """
        if self.scenario.moteur_scoring == 'ahp' and self.scenario.matrice_comparaison:
            result = calculate_ahp(self.scenario.matrice_comparaison)
            if 'error' in result:
                raise ValueError(f"Erreur calcul AHP: {result['error']}")
            
            self.scenario.ratio_coherence = result['cr']
            
            # Mettre à jour les poids (suppose que l'ordre des critères correspond à l'ordre de la matrice)
            criteres_list = self.scenario.criteres or [
                {'id': 'eau'}, {'id': 'occ'}, {'id': 'cont'}, {'id': 'urb'}
            ]
            if len(criteres_list) == len(result['weights']):
                poids_dict = {}
                for i, crit in enumerate(criteres_list):
                    # Stocker en pourcentage ou ratio (0-1). Choisissons ratio.
                    poids_dict[crit['id']] = result['weights'][i]
                self.scenario.poids = poids_dict
                
            self.scenario.save(update_fields=['ratio_coherence', 'poids'])
            return result
        return None

    def run_simulation(self):
        """
        Exécute la simulation complète sur toutes les Unités de Carte Agricole (UCA).
        Retourne des statistiques de changement.
        """
        # 1. Vérifier si on doit recalculer les poids AHP
        if self.scenario.moteur_scoring == 'ahp':
            self.calculer_ahp()
            if self.scenario.ratio_coherence and self.scenario.ratio_coherence > 0.10:
                raise ValueError("Ratio de cohérence AHP > 0.10, matrice incohérente.")
        
        weights = self.scenario.poids or {}
        seuils = self.scenario.seuils or {'A': 65, 'B': 40}
        seuil_A = seuils.get('A', 65)
        seuil_B = seuils.get('B', 40)
        
        # Mappings des attributs de score dans le modèle UniteCarteAgricole
        score_mapping = {
            'eau': 'score_eau',
            'occ': 'score_occ',
            'cont': 'score_cont',
            'urb': 'score_clim' # Proxy: on utilise score_clim pour l'éloignement urbain dans cette démo
        }
        
        unites = UniteCarteAgricole.objects.all()
        changements = []
        evaluations = []
        
        stats = {
            'A': 0, 'B': 0, 'C': 0, 'HC': 0, 'forces': 0
        }
        
        # Vider les classes précédentes (Toutes, pour éviter les erreurs d'unicité sur code_unite lors des simulations)
        ClasseA.objects.all().delete()
        ClasseB.objects.all().delete()
        ClasseC.objects.all().delete()

        classes_a_to_create = []
        classes_b_to_create = []
        classes_c_to_create = []
        
        # Évaluation unité par unité (Idéalement en SQL bulk update pour la perf, mais boucle pour logique complexe)
        for uca in unites:
            ancienne_categorie = uca.categorie
            
            # --- Étape 1 : Exclusions (simplifié pour démo sans intersection spatiale réelle)
            # En réalité, on ferait `if uca.geom.intersects(couche_exclusion.geom)`
            if uca.est_hors_classement:
                uca.categorie = 'HC'
                stats['HC'] += 1
                continue
                
            # --- Étape 2 : Forçage
            if uca.est_force:
                uca.categorie = 'A'  # Ou B selon la règle
                stats['A'] += 1
                stats['forces'] += 1
                classes_a_to_create.append(ClasseA(
                    scenario=self.scenario,
                    code_unite=uca.code_unite,
                    geom=uca.geom,
                    est_force=True,
                    couche_forcante=uca.motif_forcage
                ))
                continue
            
            # --- Étape 3 : Calcul IPA (Map Algebra vectoriel)
            ipa_score = 0.0
            total_weight = 0.0
            
            for crit_id, weight in weights.items():
                attr_name = score_mapping.get(crit_id)
                if attr_name and hasattr(uca, attr_name):
                    val = getattr(uca, attr_name) or 0.0
                    # Note: score_eau est supposé être entre 0 et 1, weight entre 0 et 1
                    # On multiplie par 100 pour avoir un score sur 100
                    ipa_score += (val * 100) * weight
                    total_weight += weight
            
            if total_weight > 0:
                 ipa_score = ipa_score / total_weight # Normalisation si somme poids != 1
            
            uca.score_ipa = round(ipa_score, 2)
            
            # --- Étape 4 : Seuillage
            nouvelle_categorie = 'C'
            if ipa_score >= seuil_A:
                nouvelle_categorie = 'A'
                classes_a_to_create.append(ClasseA(
                    scenario=self.scenario,
                    code_unite=uca.code_unite,
                    score_ipa=ipa_score,
                    geom=uca.geom
                ))
            elif ipa_score >= seuil_B:
                nouvelle_categorie = 'B'
                classes_b_to_create.append(ClasseB(
                    scenario=self.scenario,
                    code_unite=uca.code_unite,
                    score_ipa=ipa_score,
                    geom=uca.geom
                ))
            else:
                classes_c_to_create.append(ClasseC(
                    scenario=self.scenario,
                    code_unite=uca.code_unite,
                    score_ipa=ipa_score,
                    geom=uca.geom
                ))
                
            uca.categorie = nouvelle_categorie
            stats[nouvelle_categorie] += 1
            evaluations.append({'id': uca.code_unite, 'score': round(ipa_score, 1), 'cat': nouvelle_categorie})
            
            if ancienne_categorie != nouvelle_categorie:
                changements.append({
                    'id': uca.code_unite,
                    'from': ancienne_categorie,
                    'to': nouvelle_categorie,
                    'score': round(ipa_score, 1)
                })

        # Bulk save des unités (simulation sur la base principale, attention en prod on isolerait)
        # UniteCarteAgricole.objects.bulk_update(unites, ['score_ipa', 'categorie'])
        
        # Enregistrer les géométries classées
        if classes_a_to_create: ClasseA.objects.bulk_create(classes_a_to_create)
        if classes_b_to_create: ClasseB.objects.bulk_create(classes_b_to_create)
        if classes_c_to_create: ClasseC.objects.bulk_create(classes_c_to_create)
        
        # Mettre à jour les stats du scénario
        self.scenario.nombre_unites = len(unites)
        # Note: on devrait additionner les superficies géométriques ici avec PostGIS (ST_Area)
        self.scenario.save()
        
        # Trier pour obtenir le top 5 des meilleurs scores
        evaluations.sort(key=lambda x: x['score'], reverse=True)
        top_units = evaluations[:5]

        return {
            'stats': stats,
            'changements': changements,
            'top_units': top_units,
            'summary': f"Classé: {stats['A']} (A), {stats['B']} (B), {stats['C']} (C)"
        }
