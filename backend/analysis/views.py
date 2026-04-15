import time
import logging

from django.http import HttpResponse
from rest_framework import status
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from .models import AnalysisRun, AnalysisResult, Insight
from .serializers import AnalysisRunListSerializer, AnalysisRunDetailSerializer
from .engine.orchestrator import MantisAnalyzer

logger = logging.getLogger(__name__)


class AnalysisRunListCreateView(APIView):
    """
    GET  /api/v1/analyses/       — liste paginée de l'historique
    POST /api/v1/analyses/       — upload CSV et démarrage de l'analyse
    """

    parser_classes = [MultiPartParser, JSONParser]

    def get(self, request):
        runs = AnalysisRun.objects.all()
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(runs, request)
        serializer = AnalysisRunListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return Response(
                {'detail': 'Le champ csv_file est requis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not csv_file.name.lower().endswith('.csv'):
            return Response(
                {'detail': 'Le fichier doit être au format CSV.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        run = AnalysisRun.objects.create(
            filename=csv_file.name,
            status='running',
        )

        try:
            t0 = time.time()
            analyzer = MantisAnalyzer()
            output = analyzer.run_from_bytes(csv_file.read())

            # Persister les résultats par moteur
            for result_type, payload in output['results'].items():
                AnalysisResult.objects.create(
                    run=run,
                    result_type=result_type,
                    payload=payload,
                )

            # Persister les insights normalisés
            insights_to_create = [
                Insight(
                    run=run,
                    severity=ins.get('severity', 'info'),
                    category=ins.get('category', ''),
                    message=ins.get('message', ''),
                    affected_id=ins.get('affected_id', ''),
                )
                for ins in output['insights']
            ]
            Insight.objects.bulk_create(insights_to_create)

            run.status = 'completed'
            run.row_count = output['row_count']
            run.duration_seconds = round(time.time() - t0, 3)
            run.save()

            logger.info(f"Analysis {run.id} completed: {run.row_count} rows in {run.duration_seconds}s")

        except ValueError as e:
            run.status = 'failed'
            run.error_message = str(e)
            run.save()
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception(f"Unexpected error during analysis {run.id}")
            run.status = 'failed'
            run.error_message = str(e)
            run.save()
            return Response(
                {'detail': 'Erreur interne lors de l\'analyse. Vérifiez le format du fichier.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = AnalysisRunListSerializer(run)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AnalysisRunDetailView(APIView):
    """
    GET /api/v1/analyses/{id}/   — détail complet avec résultats et insights
    """

    def get(self, request, pk):
        try:
            run = AnalysisRun.objects.prefetch_related('results', 'insights').get(pk=pk)
        except AnalysisRun.DoesNotExist:
            return Response({'detail': 'Analyse non trouvée.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AnalysisRunDetailSerializer(run)
        return Response(serializer.data)


class AnalysisExportView(APIView):
    """
    GET /api/v1/analyses/{id}/export/   — téléchargement CSV des résultats
    """

    def get(self, request, pk):
        try:
            run = AnalysisRun.objects.prefetch_related('results').get(pk=pk)
        except AnalysisRun.DoesNotExist:
            return Response({'detail': 'Analyse non trouvée.'}, status=status.HTTP_404_NOT_FOUND)

        if run.status != 'completed':
            return Response(
                {'detail': 'L\'analyse n\'est pas encore terminée.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Reconstituer le dict results pour le générateur
        results = {r.result_type: r.payload for r in run.results.all()}

        from .engine.report_generator import ReportGenerator
        reporter = ReportGenerator()
        csv_bytes = reporter.generate_csv_bytes(results)

        filename = f"mantis_analyse_{str(run.id)[:8]}.csv"
        response = HttpResponse(csv_bytes, content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
