import math

# Valeurs de l'indice aléatoire (Random Index) selon le nombre de critères n (jusqu'à n=10)
RI_TABLE = {
    1: 0.00,
    2: 0.00,
    3: 0.58,
    4: 0.90,
    5: 1.12,
    6: 1.24,
    7: 1.32,
    8: 1.41,
    9: 1.45,
    10: 1.49
}

def calculate_ahp(matrix):
    """
    Calcule le vecteur de poids (eigenvector) et le ratio de cohérence (CR)
    d'une matrice de comparaison par paires AHP en utilisant la méthode de
    la moyenne géométrique.
    
    :param matrix: Liste de listes (matrice carrée n x n)
    :return: dict {'weights': list, 'cr': float, 'is_consistent': bool, 'error': str}
    """
    n = len(matrix)
    if n == 0:
        return {'error': 'Matrice vide'}
    
    # Vérifier que c'est une matrice carrée
    for row in matrix:
        if len(row) != n:
            return {'error': 'La matrice n\'est pas carrée'}

    if n <= 2:
        # Pas de vérification de cohérence possible pour n <= 2
        # On calcule juste les moyennes géométriques
        weights = []
        for row in matrix:
            geo_mean = math.prod(row) ** (1/n)
            weights.append(geo_mean)
        total = sum(weights)
        if total == 0:
            return {'error': 'Somme des poids nulle'}
        weights = [w / total for w in weights]
        return {
            'weights': weights,
            'cr': 0.0,
            'is_consistent': True
        }

    # 1. Calcul du vecteur propre (poids) par la moyenne géométrique
    geo_means = []
    for row in matrix:
        geo_mean = math.prod(row) ** (1/n)
        geo_means.append(geo_mean)
    
    total_geo_means = sum(geo_means)
    if total_geo_means == 0:
         return {'error': 'Calcul impossible (somme des moyennes géométriques = 0)'}
         
    weights = [g / total_geo_means for g in geo_means]

    # 2. Calcul du lambda max (pour le ratio de cohérence)
    # λ_max = Sum (somme_colonne_i * poids_i)
    lambda_max = 0
    for j in range(n):
        col_sum = sum(matrix[i][j] for i in range(n))
        lambda_max += col_sum * weights[j]

    # 3. Indice de cohérence (CI)
    ci = (lambda_max - n) / (n - 1)

    # 4. Ratio de cohérence (CR)
    ri = RI_TABLE.get(n, 1.49) # Valeur par défaut pour n>10 (rare en AHP)
    
    cr = ci / ri if ri > 0 else 0

    return {
        'weights': weights,
        'cr': round(cr, 4),
        'is_consistent': cr < 0.10
    }
