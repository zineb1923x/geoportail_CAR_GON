import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.apps import apps
from django.conf import settings

APPS_TO_PROCESS = [
    'administration', 'audit', 'bioclimat', 'classement', 'exclusions', 
    'geopedologie', 'occupation_agricole', 'referentiel', 'ressources_eau', 
    'zones_pastorales'
]

def is_geometric(model):
    from common.models import CoucheBase
    return issubclass(model, CoucheBase)

def generate_serializers(app_name, models):
    code = f"from rest_framework import serializers\n"
    code += f"from rest_framework_gis.serializers import GeoFeatureModelSerializer\n"
    code += f"from {app_name}.models import {', '.join(m.__name__ for m in models)}\n\n"
    
    for model in models:
        model_name = model.__name__
        if is_geometric(model):
            code += f"class {model_name}Serializer(GeoFeatureModelSerializer):\n"
            code += f"    class Meta:\n"
            code += f"        model = {model_name}\n"
            code += f"        geo_field = 'geom'\n"
            code += f"        fields = '__all__'\n\n"
        else:
            code += f"class {model_name}Serializer(serializers.ModelSerializer):\n"
            code += f"    class Meta:\n"
            code += f"        model = {model_name}\n"
            code += f"        fields = '__all__'\n\n"
    return code

def generate_views(app_name, models):
    code = f"from rest_framework import viewsets\n"
    code += f"from rest_framework.permissions import IsAuthenticated\n"
    code += f"from core.permissions import IsEditeurOrAdmin\n"
    code += f"from {app_name}.models import {', '.join(m.__name__ for m in models)}\n"
    code += f"from {app_name}.serializers import {', '.join(m.__name__ + 'Serializer' for m in models)}\n\n"
    
    for model in models:
        model_name = model.__name__
        code += f"class {model_name}ViewSet(viewsets.ModelViewSet):\n"
        code += f"    queryset = {model_name}.objects.all()\n"
        code += f"    serializer_class = {model_name}Serializer\n"
        code += f"    permission_classes = [IsAuthenticated, IsEditeurOrAdmin]\n\n"
    return code

def generate_urls(app_name, models):
    code = f"from django.urls import path, include\n"
    code += f"from rest_framework.routers import DefaultRouter\n"
    code += f"from {app_name}.views import {', '.join(m.__name__ + 'ViewSet' for m in models)}\n\n"
    code += f"router = DefaultRouter()\n"
    for model in models:
        model_name = model.__name__
        route_name = model_name.lower()
        code += f"router.register(r'{route_name}', {model_name}ViewSet)\n"
    
    code += f"\nurlpatterns = [\n"
    code += f"    path('', include(router.urls)),\n"
    code += f"]\n"
    return code


if __name__ == '__main__':
    for app_name in APPS_TO_PROCESS:
        app_config = apps.get_app_config(app_name)
        models = list(app_config.get_models())
        if not models:
            continue
            
        app_path = app_config.path
        
        # serializers.py
        with open(os.path.join(app_path, 'serializers.py'), 'w', encoding='utf-8') as f:
            f.write(generate_serializers(app_name, models))
            
        # views.py
        with open(os.path.join(app_path, 'views.py'), 'w', encoding='utf-8') as f:
            f.write(generate_views(app_name, models))
            
        # urls.py
        with open(os.path.join(app_path, 'urls.py'), 'w', encoding='utf-8') as f:
            f.write(generate_urls(app_name, models))
            
        print(f"Generated API files for {app_name}")
