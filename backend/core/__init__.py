"""
Core package — Géoportail Agricole CAR-GON.
Charge l'application Celery au démarrage de Django (si disponible).
"""

try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    # Celery n'est pas installé (dev local sans Docker)
    celery_app = None
    __all__ = ()
