import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import MultiPolygon, Polygon, Point
from administration.models import Commune
from classement.models import ScenarioAMC, UniteCarteAgricole, ClasseA, ClasseB, ClasseC

class Command(BaseCommand):
    help = 'Génère des données fictives de test pour la CAR'

    def handle(self, *args, **options):
        self.stdout.write("Génération des données fictives de test...")
        
        # 1. Nettoyage de l'ancien mock
        ScenarioAMC.objects.filter(nom="Scénario de Test Fictif").delete()
        
        # 2. Création d'un utilisateur admin par défaut pour l'auteur
        User = get_user_model()
        admin = User.objects.filter(is_superuser=True).first()
        
        # 3. Création d'un scénario validé
        scenario = ScenarioAMC.objects.create(
            nom="Scénario de Test Fictif",
            description="Données mock générées aléatoirement pour tester les dashboards et requêtes.",
            auteur=admin,
            est_car_validee=True,
            moteur_scoring='ahp'
        )
        
        communes = Commune.objects.all()
        if not communes.exists():
            self.stdout.write(self.style.ERROR("Aucune commune trouvée ! Veuillez d'abord synchroniser les communes."))
            return
            
        groupes_sols = ['Vertisols', 'Calcosols', 'Sols isohumiques', 'Sols peu évolués', 'Sols halomorphes']
        occupations = ['Cultures annuelles', 'Arboriculture', 'Parcours', 'Nu', 'Maraîchage']
        
        count_a, count_b, count_c = 0, 0, 0
        
        # Pour chaque commune, on va créer entre 3 et 8 parcelles fictives
        for com in communes:
            num_parcelles = random.randint(3, 8)
            
            # On prend le centroid de la commune pour éviter de taper hors de la carte
            centroid = com.geom.centroid
            base_x, base_y = centroid.x, centroid.y
            
            for i in range(num_parcelles):
                # Décalage aléatoire pour éparpiller un peu dans la commune (approximation très grossière)
                offset_x = random.uniform(-0.05, 0.05) * 100000  # On est en EPSG:26192 (mètres)
                offset_y = random.uniform(-0.05, 0.05) * 100000
                
                # Taille aléatoire du buffer (superficie)
                radius = random.uniform(500, 3000) # rayon entre 500m et 3km
                
                # Création d'un polygone fictif (un carré)
                p1 = Point(base_x + offset_x - radius, base_y + offset_y - radius)
                p2 = Point(base_x + offset_x + radius, base_y + offset_y - radius)
                p3 = Point(base_x + offset_x + radius, base_y + offset_y + radius)
                p4 = Point(base_x + offset_x - radius, base_y + offset_y + radius)
                poly = Polygon((p1, p2, p3, p4, p1))
                poly.srid = 26192
                geom_multi = MultiPolygon(poly)
                geom_multi.srid = 26192
                
                # Intersection avec la commune pour que ça ne déborde pas (si possible)
                try:
                    geom_final = geom_multi.intersection(com.geom)
                    if geom_final.geom_type == 'Polygon':
                        geom_final = MultiPolygon(geom_final)
                        geom_final.srid = 26192
                    elif geom_final.geom_type != 'MultiPolygon':
                        continue # On passe si ce n'est ni polygone ni multipolygone
                except:
                    geom_final = geom_multi

                if geom_final.empty:
                    continue

                cat = random.choices(['A', 'B', 'C'], weights=[0.2, 0.5, 0.3])[0]
                score_ipa = random.uniform(20.0, 95.0)
                superficie = (geom_final.area / 10000.0) # en ha
                code_unite = f"UCA_{com.id}_{i}_{random.randint(100,999)}"
                
                # Create UniteCarteAgricole
                uca = UniteCarteAgricole.objects.create(
                    code_unite=code_unite,
                    categorie=cat,
                    score_ipa=score_ipa,
                    groupe_sol=random.choice(groupes_sols),
                    facteur_limitant=random.choice(['Eau', 'Pente', 'Salinité', 'Profondeur sol', 'Rien']),
                    superficie_ha=superficie,
                    scenario=scenario,
                    commune=com,
                    geom=geom_final,
                    est_car_validee=True
                )
                
                # Create ClasseA/B/C pour la cartographie
                if cat == 'A':
                    ClasseA.objects.create(code_unite=code_unite, score_ipa=score_ipa, superficie_ha=superficie, scenario=scenario, commune=com, geom=geom_final)
                    count_a += 1
                elif cat == 'B':
                    ClasseB.objects.create(code_unite=code_unite, score_ipa=score_ipa, superficie_ha=superficie, facteur_limitant=uca.facteur_limitant, scenario=scenario, commune=com, geom=geom_final)
                    count_b += 1
                else:
                    ClasseC.objects.create(code_unite=code_unite, score_ipa=score_ipa, superficie_ha=superficie, facteur_limitant=uca.facteur_limitant, scenario=scenario, commune=com, geom=geom_final)
                    count_c += 1

        self.stdout.write(self.style.SUCCESS(
            f"Succès ! Généré : {count_a} Catégorie A, {count_b} Catégorie B, {count_c} Catégorie C."
        ))
