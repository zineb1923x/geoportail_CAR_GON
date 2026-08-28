"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/administration/', include('administration.urls')),
    path('api/audit/', include('audit.urls')),
    path('api/bioclimat/', include('bioclimat.urls')),
    path('api/classement/', include('classement.urls')),
    path('api/exclusions/', include('exclusions.urls')),
    path('api/geopedologie/', include('geopedologie.urls')),
    path('api/occupation_agricole/', include('occupation_agricole.urls')),
    path('api/referentiel/', include('referentiel.urls')),
    path('api/geodata/', include('geodata.urls')),
    path('api/ressources_eau/', include('ressources_eau.urls')),
    path('api/zones_pastorales/', include('zones_pastorales.urls')),
    # OpenAPI Swagger Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
