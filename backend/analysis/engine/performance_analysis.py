"""
Moteur d'analyse de performance des utilisateurs.
Calcule des scores de productivité et identifie les top contributeurs.
"""

import logging
import pandas as pd
from typing import Any, Dict, List

from .data_processor import DataProcessor

logger = logging.getLogger(__name__)


class PerformanceAnalysisEngine:
    """Analyse de performance des utilisateurs"""

    engine_key = "performance"

    def __init__(self, processor: DataProcessor):
        self.processor = processor

    def analyze(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyse de la performance. Retourne un dict JSON-sérialisable."""
        df = df.copy()
        df['date_converted'] = df['date_modified'].apply(self.processor.convert_timestamp)
        df_valid = df.dropna(subset=['date_converted'])

        performance_metrics = {}

        for user_id in df_valid['user_id'].unique():
            user_data = df_valid[df_valid['user_id'] == user_id]
            unique_bugs = int(user_data['bug_id'].nunique())

            metrics = {
                'user_id': str(user_id),
                'total_actions': int(len(user_data)),
                'unique_bugs': unique_bugs,
                'avg_actions_per_bug': round(len(user_data) / unique_bugs, 2) if unique_bugs > 0 else 0,
                'active_days': int(
                    (user_data['date_converted'].max() - user_data['date_converted'].min()).days
                ),
                'action_types': {str(k): int(v) for k, v in
                                 user_data['field_name'].value_counts().to_dict().items()},
                'productivity_score': round(self._calculate_productivity_score(user_data), 2),
            }
            performance_metrics[str(user_id)] = metrics

        # Classement par score
        sorted_performers = sorted(
            performance_metrics.values(),
            key=lambda x: x['productivity_score'],
            reverse=True,
        )
        for rank, item in enumerate(sorted_performers, start=1):
            item['rank'] = rank

        insights = self._generate_insights(sorted_performers)

        return {
            'user_performance': performance_metrics,
            'top_performers': sorted_performers[:10],
            'insights': insights,
        }

    def _calculate_productivity_score(self, user_data: pd.DataFrame) -> float:
        base_score = len(user_data) * 10
        bug_diversity = user_data['bug_id'].nunique() * 5
        action_diversity = user_data['field_name'].nunique() * 3

        critical_actions = user_data[user_data['field_name'].isin(['status', 'priority', 'severity'])]
        critical_bonus = len(critical_actions) * 2

        return base_score + bug_diversity + action_diversity + critical_bonus

    def _generate_insights(self, sorted_performers: List[Dict]) -> List[Dict]:
        insights = []

        if len(sorted_performers) < 2:
            return insights

        top = sorted_performers[0]
        bottom = sorted_performers[-1]

        if bottom['productivity_score'] > 0:
            ratio = top['productivity_score'] / bottom['productivity_score']
            if ratio > 10:
                insights.append({
                    'severity': 'info',
                    'category': 'performance',
                    'message': (
                        f"Écart de productivité important : l'utilisateur {top['user_id']} "
                        f"a un score {ratio:.1f}x supérieur au dernier du classement."
                    ),
                    'affected_id': str(top['user_id']),
                })

        # Utilisateurs avec très peu de bugs uniques mais beaucoup d'actions
        for perf in sorted_performers:
            if perf['unique_bugs'] > 0 and perf['avg_actions_per_bug'] > 20:
                insights.append({
                    'severity': 'info',
                    'category': 'performance',
                    'message': (
                        f"Utilisateur {perf['user_id']} : {perf['avg_actions_per_bug']:.1f} actions/ticket "
                        f"en moyenne — activité intensive sur peu de tickets."
                    ),
                    'affected_id': str(perf['user_id']),
                })

        return insights
