"""
Celery configuration for Géoportail Agricole CAR-GON.

Traitements asynchrones > 5s : calculs AMC/AHP, exports,
génération de fiches synoptiques par lot, etc.
"""

import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('geoportail')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
