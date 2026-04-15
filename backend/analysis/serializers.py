from rest_framework import serializers
from .models import AnalysisRun, AnalysisResult, Insight


class InsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insight
        fields = ['id', 'severity', 'category', 'message', 'affected_id']


class AnalysisResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisResult
        fields = ['result_type', 'payload']


class AnalysisRunListSerializer(serializers.ModelSerializer):
    """Serializer léger pour la liste historique."""

    class Meta:
        model = AnalysisRun
        fields = [
            'id', 'filename', 'uploaded_at', 'status',
            'row_count', 'duration_seconds', 'error_message',
        ]


class AnalysisRunDetailSerializer(serializers.ModelSerializer):
    """Serializer complet avec résultats et insights imbriqués."""
    results = serializers.SerializerMethodField()
    insights = InsightSerializer(many=True, read_only=True)

    class Meta:
        model = AnalysisRun
        fields = [
            'id', 'filename', 'uploaded_at', 'status',
            'row_count', 'duration_seconds', 'error_message',
            'results', 'insights',
        ]

    def get_results(self, obj):
        """Retourne les résultats sous forme {result_type: payload}."""
        return {r.result_type: r.payload for r in obj.results.all()}
