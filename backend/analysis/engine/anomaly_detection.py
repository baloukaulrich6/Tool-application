"""
Moteur de détection d'anomalies dans les données Mantis.
Identifie les actions rapprochées, durées excessives et activités inhabituelles.
"""

import logging
import pandas as pd
from typing import Any, Dict, List

from .data_processor import DataProcessor

logger = logging.getLogger(__name__)


class AnomalyDetectionEngine:
    """Détection d'anomalies dans les données"""

    engine_key = "anomaly"

    def __init__(self, processor: DataProcessor):
        self.processor = processor

    def analyze(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Détection d'anomalies. Retourne un dict JSON-sérialisable."""
        df = df.copy()
        df['date_converted'] = df['date_modified'].apply(self.processor.convert_timestamp)
        df_valid = df.dropna(subset=['date_converted'])

        rapid_actions = self._detect_rapid_actions(df_valid)
        excessive_durations = self._detect_excessive_durations(df_valid)
        unusual_activity = self._detect_unusual_activity(df_valid)

        all_anomalies = (
            [{'type': 'rapid_actions', **a} for a in rapid_actions] +
            [{'type': 'excessive_duration', **a} for a in excessive_durations] +
            [{'type': 'unusual_activity', **a} for a in unusual_activity]
        )

        by_type = {}
        by_severity = {}
        for a in all_anomalies:
            by_type[a['type']] = by_type.get(a['type'], 0) + 1
            by_severity[a['severity']] = by_severity.get(a['severity'], 0) + 1

        insights = self._generate_insights(all_anomalies, rapid_actions,
                                           excessive_durations, unusual_activity)

        return {
            'rapid_actions': rapid_actions,
            'excessive_durations': excessive_durations,
            'unusual_activity': unusual_activity,
            'anomaly_count': len(all_anomalies),
            'summary': {
                'total': len(all_anomalies),
                'by_type': by_type,
                'by_severity': by_severity,
            },
            'insights': insights,
        }

    def _detect_rapid_actions(self, df_valid: pd.DataFrame) -> List[Dict]:
        """Actions séparées de moins de 10 secondes sur un même bug."""
        results = []

        for bug_id in df_valid['bug_id'].unique():
            bug_data = df_valid[df_valid['bug_id'] == bug_id].sort_values('date_converted')

            if len(bug_data) < 2:
                continue

            time_diffs = bug_data['date_converted'].diff().dt.total_seconds()
            rapid = bug_data[time_diffs < 10].iloc[1:]  # skip first NaN

            if len(rapid) > 3:
                results.append({
                    'bug_id': str(bug_id),
                    'count': int(len(rapid)),
                    'severity': 'medium',
                    'description': f"{len(rapid)} actions en moins de 10s sur le ticket {bug_id}",
                })

        return results

    def _detect_excessive_durations(self, df_valid: pd.DataFrame) -> List[Dict]:
        """Bugs dont la durée totale dépasse le 95e percentile."""
        results = []

        bug_durations = df_valid.groupby('bug_id')['date_converted'].agg(['min', 'max'])
        bug_durations['duration_days'] = (
            bug_durations['max'] - bug_durations['min']
        ).dt.total_seconds() / (24 * 3600)

        if len(bug_durations) < 5:
            return results

        threshold = bug_durations['duration_days'].quantile(0.95)
        long_bugs = bug_durations[bug_durations['duration_days'] > threshold]

        for bug_id, row in long_bugs.iterrows():
            results.append({
                'bug_id': str(bug_id),
                'duration_days': round(float(row['duration_days']), 1),
                'severity': 'high',
                'description': f"Ticket {bug_id} ouvert depuis {row['duration_days']:.0f} jours (p95).",
            })

        return results

    def _detect_unusual_activity(self, df_valid: pd.DataFrame) -> List[Dict]:
        """Utilisateurs avec une activité hors-norme (±2 écarts-types)."""
        results = []

        user_activity = df_valid.groupby('user_id').size()
        if len(user_activity) < 3:
            return results

        activity_mean = float(user_activity.mean())
        activity_std = float(user_activity.std())

        if activity_std == 0:
            return results

        high_threshold = activity_mean + 2 * activity_std
        low_threshold = max(0, activity_mean - 2 * activity_std)

        for user_id, count in user_activity.items():
            if count > high_threshold or count < low_threshold:
                results.append({
                    'user_id': str(user_id),
                    'activity_count': int(count),
                    'mean_activity': round(activity_mean, 1),
                    'severity': 'low' if count > high_threshold else 'medium',
                    'description': (
                        f"Utilisateur {user_id} : {count} actions "
                        f"({'bien au-dessus' if count > high_threshold else 'bien en dessous'} "
                        f"de la moyenne {activity_mean:.0f})."
                    ),
                })

        return results

    def _generate_insights(self, all_anomalies: List[Dict],
                            rapid_actions: List[Dict],
                            excessive_durations: List[Dict],
                            unusual_activity: List[Dict]) -> List[Dict]:
        insights = []

        if len(all_anomalies) == 0:
            insights.append({
                'severity': 'info',
                'category': 'anomaly',
                'message': "Aucune anomalie significative détectée dans les données.",
                'affected_id': '',
            })
            return insights

        if len(excessive_durations) > 0:
            insights.append({
                'severity': 'warning',
                'category': 'anomaly',
                'message': (
                    f"{len(excessive_durations)} ticket(s) avec une durée anormalement longue "
                    f"(au-dessus du 95e percentile)."
                ),
                'affected_id': '',
            })

        if len(rapid_actions) > 0:
            insights.append({
                'severity': 'info',
                'category': 'anomaly',
                'message': (
                    f"{len(rapid_actions)} ticket(s) présentent des actions très rapprochées "
                    f"(< 10 secondes d'écart) — possible automatisation ou erreur de saisie."
                ),
                'affected_id': '',
            })

        high_severity = [a for a in all_anomalies if a.get('severity') == 'high']
        if len(high_severity) > 5:
            insights.append({
                'severity': 'critical',
                'category': 'anomaly',
                'message': f"{len(high_severity)} anomalies de haute sévérité détectées — revue recommandée.",
                'affected_id': '',
            })

        return insights
