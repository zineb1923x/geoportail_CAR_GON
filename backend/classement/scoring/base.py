from abc import ABC, abstractmethod

class BaseScoring(ABC):
    """
    Classe de base abstraite pour les algorithmes de scoring AMC (AHP, Pondération...).
    """
    
    @abstractmethod
    def calculate_score(self, feature, criteria_weights):
        """
        Calcule le score IPA (Indice de Potentialité Agricole) pour une entité donnée.
        :param feature: L'entité géométrique à évaluer (dict ou objet).
        :param criteria_weights: Dictionnaire des critères et leurs poids/paramètres.
        :return: float (score IPA)
        """
        pass
