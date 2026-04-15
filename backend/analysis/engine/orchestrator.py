"""
Orchestrateur principal de l'analyse Mantis.
Point d'entrée pour les vues Django : run_from_bytes().
"""

import logging
import time
from typing import Any, Dict, List

import pandas as pd

from .config import AnalysisConfig
from .data_processor import DataProcessor
from .time_analysis import TimeAnalysisEngine
from .performance_analysis import PerformanceAnalysisEngine
from .anomaly_detection import AnomalyDetectionEngine
from .report_generator import ReportGenerator

logger = logging.getLogger(__name__)


class MantisAnalyzer:
    """Classe principale orchestrant l'analyse"""

    def __init__(self, config: AnalysisConfig = None):
        self.config = config or AnalysisConfig()
        self.processor = DataProcessor(self.config)
        self.engines = [
            TimeAnalysisEngine(self.processor),
            PerformanceAnalysisEngine(self.processor),
            AnomalyDetectionEngine(self.processor),
        ]
        self.reporter = ReportGenerator()

    # --- Usage web (upload) ---

    def run_from_bytes(self, file_bytes: bytes) -> Dict[str, Any]:
        """
        Point d'entrée principal pour les vues Django.
        Accepte les bytes d'un fichier CSV uploadé, retourne un dict complet.
        """
        t0 = time.time()

        logger.info("Loading CSV from bytes...")
        df = self.processor.load_from_bytes(file_bytes)
        row_count = len(df)
        logger.info(f"Loaded {row_count} rows")

        results = {}
        all_insights = []

        for engine in self.engines:
            logger.info(f"Running {engine.__class__.__name__}...")
            engine_result = engine.analyze(df)
            # Extraire les insights normalisés avant de stocker le payload
            engine_insights = engine_result.pop('insights', [])
            for ins in engine_insights:
                ins.setdefault('category', engine.engine_key)
            all_insights.extend(engine_insights)
            results[engine.engine_key] = engine_result

        duration = round(time.time() - t0, 3)
        logger.info(f"Analysis complete in {duration}s — {len(all_insights)} insights generated")

        return {
            'row_count': row_count,
            'duration_seconds': duration,
            'results': results,
            'insights': all_insights,
        }

    def generate_export_bytes(self, results: Dict[str, Any]) -> bytes:
        """Génère le CSV d'export depuis les résultats déjà calculés."""
        return self.reporter.generate_csv_bytes(results)

    # --- Usage script standalone (chemin fichier) ---

    def run(self) -> bool:
        """Exécution en mode script (chemin fichier fixe, génère des fichiers)."""
        logger.info("Starting Mantis analysis (file mode)...")

        df = self.processor.load_data()
        if df is None:
            logger.error("Failed to load data")
            return False

        logger.info(f"Loaded {len(df)} rows")

        all_insights = []
        results = {}

        for engine in self.engines:
            engine_result = engine.analyze(df)
            insights = engine_result.pop('insights', [])
            all_insights.extend(insights)
            results[engine.engine_key] = engine_result

        csv_bytes = self.reporter.generate_csv_bytes(results)
        with open(self.config.output_file, 'wb') as f:
            f.write(csv_bytes)

        logger.info(f"Report exported to: {self.config.output_file}")

        if all_insights:
            logger.info("Key insights:")
            for ins in all_insights:
                logger.info(f"  [{ins.get('severity','').upper()}] {ins.get('message','')}")

        logger.info("Analysis complete!")
        return True
