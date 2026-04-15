import uuid
from django.db import models


class AnalysisRun(models.Model):
    """Une entrée par fichier CSV uploadé et analysé."""

    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('running', 'En cours'),
        ('completed', 'Terminé'),
        ('failed', 'Échec'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)
    row_count = models.IntegerField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.filename} — {self.status} ({self.uploaded_at:%d/%m/%Y %H:%M})"


class AnalysisResult(models.Model):
    """Résultats JSON d'un moteur d'analyse pour un AnalysisRun donné."""

    RESULT_TYPE_CHOICES = [
        ('time', 'Analyse temporelle'),
        ('performance', 'Performance utilisateurs'),
        ('anomaly', 'Détection d\'anomalies'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    run = models.ForeignKey(AnalysisRun, on_delete=models.CASCADE, related_name='results')
    result_type = models.CharField(max_length=20, choices=RESULT_TYPE_CHOICES)
    payload = models.JSONField()

    class Meta:
        unique_together = [('run', 'result_type')]

    def __str__(self):
        return f"{self.run.filename} — {self.result_type}"


class Insight(models.Model):
    """Insight/alerte normalisé extrait des résultats d'analyse."""

    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Attention'),
        ('critical', 'Critique'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    run = models.ForeignKey(AnalysisRun, on_delete=models.CASCADE, related_name='insights')
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='info')
    category = models.CharField(max_length=50)
    message = models.TextField()
    affected_id = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        ordering = ['-severity', 'category']

    def __str__(self):
        return f"[{self.severity.upper()}] {self.message[:60]}"
