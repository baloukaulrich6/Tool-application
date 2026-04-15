"""
Générateur de rapports CSV.
Adapté pour retourner des bytes (stream web) au lieu d'écrire sur disque.
"""

import io
import csv
import logging
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Générateur de rapports flexible"""

    CSV_COLUMNS = [
        'bug_id', 'user_id', 'nombre_interventions',
        'temps_total_secondes', 'temps_total_formate',
        'temps_heures', 'temps_jours', 'temps_jours_ouvres',
        'premiere_intervention', 'derniere_intervention',
        'statuts_assignation', 'est_handler', 'complexite_estimee',
    ]

    def generate_csv_bytes(self, results: Dict[str, Any]) -> bytes:
        """
        Génère le rapport CSV en mémoire et retourne des bytes.
        Utilisé par l'endpoint d'export web.
        """
        details = results.get('time', {}).get('details', [])

        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=self.CSV_COLUMNS,
            delimiter=';',
            quotechar='"',
            quoting=csv.QUOTE_MINIMAL,
            extrasaction='ignore',
        )
        writer.writeheader()

        sorted_details = sorted(details, key=lambda r: (r.get('bug_id', ''), r.get('user_id', '')))
        for row in sorted_details:
            writer.writerow(row)

        return output.getvalue().encode('utf-8-sig')  # BOM pour Excel

    def generate_summary_bytes(self, results: Dict[str, Any]) -> bytes:
        """Génère un rapport texte de synthèse en mémoire."""
        output = io.StringIO()
        stats = results.get('time', {}).get('statistics', {})
        insights_all = (
            results.get('time', {}).get('insights', []) +
            results.get('performance', {}).get('insights', []) +
            results.get('anomaly', {}).get('insights', [])
        )

        output.write("=" * 50 + "\n")
        output.write("RAPPORT D'ANALYSE MANTIS\n")
        output.write(f"Date : {datetime.now().strftime('%d/%m/%Y %H:%M')}\n")
        output.write("=" * 50 + "\n\n")

        if stats:
            output.write("STATISTIQUES GLOBALES\n")
            output.write("-" * 30 + "\n")
            output.write(f"Total tickets analysés : {stats.get('total_bugs', 0)}\n")
            output.write(f"Total utilisateurs     : {stats.get('total_users', 0)}\n")
            output.write(f"Total interventions    : {stats.get('total_interventions', 0)}\n")
            avg = stats.get('avg_time_per_bug_seconds', 0)
            output.write(f"Temps moyen / ticket   : {self._fmt(avg)}\n")
            output.write("\n")

            if stats.get('top_contributors'):
                output.write("TOP 10 CONTRIBUTEURS\n")
                output.write("-" * 30 + "\n")
                for uid, data in stats['top_contributors'].items():
                    output.write(
                        f"  User {uid}: {self._fmt(data['temps_total_secondes'])} "
                        f"({data['nombre_interventions']} interventions)\n"
                    )
                output.write("\n")

            if stats.get('complexity_distribution'):
                output.write("DISTRIBUTION DE COMPLEXITÉ\n")
                output.write("-" * 30 + "\n")
                for complexity, count in stats['complexity_distribution'].items():
                    output.write(f"  {complexity}: {count} tickets\n")
                output.write("\n")

        if insights_all:
            output.write("INSIGHTS ET RECOMMANDATIONS\n")
            output.write("-" * 30 + "\n")
            for i, ins in enumerate(insights_all, 1):
                prefix = {"critical": "[CRITIQUE]", "warning": "[ATTENTION]"}.get(
                    ins.get('severity', ''), "[INFO]"
                )
                output.write(f"{i}. {prefix} {ins.get('message', '')}\n")
            output.write("\n")

        return output.getvalue().encode('utf-8-sig')

    def _fmt(self, seconds: float) -> str:
        hours = seconds / 3600
        if hours > 24:
            return f"{hours / 24:.1f} jours"
        return f"{hours:.1f} heures"
