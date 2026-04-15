from django.urls import path
from .views import AnalysisRunListCreateView, AnalysisRunDetailView, AnalysisExportView

urlpatterns = [
    path('analyses/', AnalysisRunListCreateView.as_view(), name='analysis-list-create'),
    path('analyses/<uuid:pk>/', AnalysisRunDetailView.as_view(), name='analysis-detail'),
    path('analyses/<uuid:pk>/export/', AnalysisExportView.as_view(), name='analysis-export'),
]
