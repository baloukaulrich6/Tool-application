"""
Moteur d'analyse temporelle des tickets Mantis.
Calcule le temps passé par bug et par utilisateur, génère des statistiques et insights.
"""

import logging
import pandas as pd
import numpy as np
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from .data_processor import DataProcessor

logger = logging.getLogger(__name__)


class TimeAnalysisEngine:
    """Moteur d'analyse temporelle"""

    engine_key = "time"

    def __init__(self, processor: DataProcessor):
        self.processor = processor

    def analyze(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyse temporelle avancée des tickets. Retourne un dict JSON-sérialisable."""
        details = []
        insights = []

        df = df.copy()
        df['date_converted'] = df['date_modified'].apply(self.processor.convert_timestamp)
        df_valid = df.dropna(subset=['date_converted'])

        if df_valid.empty:
            logger.warning("No valid data after date conversion")
            return {'details': [], 'statistics': {}, 'insights': []}

        bug_ids = sorted(df_valid['bug_id'].unique())
        logger.info(f"Analyzing {len(bug_ids)} bugs...")

        for bug_id in bug_ids:
            bug_analysis = self._analyze_bug(df_valid, bug_id)
            details.extend(bug_analysis)

        statistics = self._calculate_statistics(details)
        insights = self._generate_insights(details, statistics)

        return {
            'details': details,
            'statistics': statistics,
            'insights': insights,
        }

    def _analyze_bug(self, df: pd.DataFrame, bug_id: str) -> List[Dict]:
        df_bug = df[df['bug_id'] == bug_id].sort_values('date_converted')

        if df_bug.empty:
            return []

        results = []

        handler_periods = self._extract_handler_periods(df_bug)
        status_periods = self._extract_status_periods(df_bug)
        user_times = self._calculate_user_times(handler_periods)
        interventions = self._analyze_interventions(df_bug)
        status_mapping = self._map_status_to_handlers(handler_periods, status_periods)

        all_users = set(user_times.keys()) | set(interventions.keys())

        for user_id in sorted(all_users):
            duration_info = self.processor.format_duration(user_times.get(user_id, 0))

            result = {
                'bug_id': str(bug_id),
                'user_id': str(user_id),
                'nombre_interventions': interventions.get(user_id, {}).get('count', 0),
                'temps_total_secondes': duration_info['seconds'],
                'temps_total_formate': duration_info['formatted'],
                'temps_heures': duration_info['hours'],
                'temps_jours': duration_info['days'],
                'temps_jours_ouvres': duration_info['business_days'],
                'premiere_intervention': interventions.get(user_id, {}).get('first', ''),
                'derniere_intervention': interventions.get(user_id, {}).get('last', ''),
                'statuts_assignation': ','.join(status_mapping.get(user_id, [])),
                'est_handler': user_id in user_times,
                'complexite_estimee': self._estimate_complexity(df_bug),
            }
            results.append(result)

        return results

    def _extract_handler_periods(self, df_bug: pd.DataFrame) -> List[Tuple[datetime, datetime, str]]:
        handler_changes = df_bug[df_bug['field_name'].str.lower() == 'handler_id']
        periods = []

        if handler_changes.empty:
            return periods

        for _, row in handler_changes.iterrows():
            start = row['date_converted']
            next_changes = handler_changes[handler_changes['date_converted'] > start]
            end = next_changes.iloc[0]['date_converted'] if not next_changes.empty else df_bug['date_converted'].max()

            if row['new_value']:
                periods.append((start, end, str(row['new_value'])))

        return periods

    def _extract_status_periods(self, df_bug: pd.DataFrame) -> List[Tuple[datetime, datetime, str]]:
        status_changes = df_bug[df_bug['field_name'].str.lower() == 'status']
        periods = []

        if status_changes.empty:
            return periods

        for _, row in status_changes.iterrows():
            start = row['date_converted']
            next_changes = status_changes[status_changes['date_converted'] > start]
            end = next_changes.iloc[0]['date_converted'] if not next_changes.empty else df_bug['date_converted'].max()

            if row['new_value']:
                periods.append((start, end, str(row['new_value'])))

        return periods

    def _calculate_user_times(self, periods: List[Tuple]) -> Dict[str, float]:
        user_times: Dict[str, float] = defaultdict(float)

        for start, end, user_id in periods:
            if user_id and start and end:
                duration = (end - start).total_seconds()
                user_times[user_id] += duration

        return dict(user_times)

    def _analyze_interventions(self, df_bug: pd.DataFrame) -> Dict[str, Dict]:
        interventions = {}

        for user_id in df_bug['user_id'].unique():
            user_actions = df_bug[df_bug['user_id'] == user_id]
            if not user_actions.empty:
                interventions[str(user_id)] = {
                    'count': len(user_actions),
                    'first': self.processor.format_date(user_actions['date_converted'].min()),
                    'last': self.processor.format_date(user_actions['date_converted'].max()),
                    'actions': user_actions['field_name'].value_counts().to_dict(),
                }

        return interventions

    def _map_status_to_handlers(self, handler_periods: List[Tuple],
                                status_periods: List[Tuple]) -> Dict[str, List[str]]:
        status_mapping: Dict[str, set] = defaultdict(set)

        for h_start, h_end, handler_id in handler_periods:
            for s_start, s_end, status in status_periods:
                overlap_start = max(h_start, s_start)
                overlap_end = min(h_end, s_end)
                if overlap_start < overlap_end:
                    status_mapping[handler_id].add(status)

        return {k: sorted(v) for k, v in status_mapping.items()}

    def _estimate_complexity(self, df_bug: pd.DataFrame) -> str:
        n_interventions = len(df_bug)
        n_users = df_bug['user_id'].nunique()
        n_status_changes = len(df_bug[df_bug['field_name'].str.lower() == 'status'])
        duration = (df_bug['date_converted'].max() - df_bug['date_converted'].min()).days

        score = 0
        if n_interventions > 50:
            score += 3
        elif n_interventions > 20:
            score += 2
        elif n_interventions > 10:
            score += 1

        if n_users > 5:
            score += 2
        elif n_users > 3:
            score += 1

        if n_status_changes > 10:
            score += 2
        elif n_status_changes > 5:
            score += 1

        if duration > 30:
            score += 2
        elif duration > 7:
            score += 1

        if score >= 7:
            return "Très complexe"
        elif score >= 4:
            return "Complexe"
        elif score >= 2:
            return "Moyen"
        else:
            return "Simple"

    def _calculate_statistics(self, details: List[Dict]) -> Dict[str, Any]:
        if not details:
            return {}

        df_stats = pd.DataFrame(details)

        bug_times = df_stats.groupby('bug_id')['temps_total_secondes'].sum()
        user_times = df_stats.groupby('user_id')['temps_total_secondes'].sum()

        top_contributors_raw = (
            df_stats.groupby('user_id')
            .agg(temps_total_secondes=('temps_total_secondes', 'sum'),
                 nombre_interventions=('nombre_interventions', 'sum'))
            .nlargest(10, 'temps_total_secondes')
        )

        top_contributors = {
            str(uid): {
                'temps_total_secondes': int(row['temps_total_secondes']),
                'nombre_interventions': int(row['nombre_interventions']),
            }
            for uid, row in top_contributors_raw.iterrows()
        }

        complexity_dist = {}
        if 'complexite_estimee' in df_stats.columns:
            complexity_dist = df_stats.drop_duplicates(subset=['bug_id'])[
                'complexite_estimee'].value_counts().to_dict()

        handlers_df = df_stats[df_stats['est_handler'] == True]

        return {
            'total_bugs': int(df_stats['bug_id'].nunique()),
            'total_users': int(df_stats['user_id'].nunique()),
            'total_interventions': int(df_stats['nombre_interventions'].sum()),
            'avg_time_per_bug_seconds': round(float(bug_times.mean()), 2) if len(bug_times) > 0 else 0,
            'median_time_per_bug_seconds': round(float(bug_times.median()), 2) if len(bug_times) > 0 else 0,
            'p95_time_per_bug_seconds': round(float(bug_times.quantile(0.95)), 2) if len(bug_times) > 0 else 0,
            'avg_time_per_user_seconds': round(float(user_times.mean()), 2) if len(user_times) > 0 else 0,
            'top_contributors': top_contributors,
            'complexity_distribution': {str(k): int(v) for k, v in complexity_dist.items()},
            'handler_stats': {
                'total_handlers': int(handlers_df['user_id'].nunique()) if not handlers_df.empty else 0,
                'avg_handling_time_seconds': round(float(handlers_df['temps_total_secondes'].mean()), 2)
                if not handlers_df.empty else 0,
            },
            'time_per_bug': [
                {
                    'bug_id': str(bug_id),
                    'total_seconds': int(secs),
                    'total_hours': round(float(secs) / 3600, 2),
                }
                for bug_id, secs in bug_times.nlargest(50).items()
            ],
        }

    def _generate_insights(self, details: List[Dict], statistics: Dict) -> List[Dict]:
        insights = []

        if not details or not statistics:
            return insights

        df = pd.DataFrame(details)

        # Goulot d'étranglement utilisateur
        top_contributors = statistics.get('top_contributors', {})
        if top_contributors:
            top_user = list(top_contributors.keys())[0]
            top_time = top_contributors[top_user]['temps_total_secondes']
            avg_time = statistics.get('avg_time_per_user_seconds', 0)
            if avg_time > 0 and top_time > avg_time * 3:
                insights.append({
                    'severity': 'warning',
                    'category': 'time',
                    'message': f"Utilisateur {top_user} concentre un temps 3x supérieur à la moyenne — risque de goulot d'étranglement.",
                    'affected_id': str(top_user),
                })

        # Tickets complexes
        complex_bugs = df[df['complexite_estimee'].isin(['Complexe', 'Très complexe'])]
        if len(df) > 0:
            pct_complex = (len(complex_bugs) / len(df)) * 100
            if pct_complex > 30:
                insights.append({
                    'severity': 'warning',
                    'category': 'time',
                    'message': f"{pct_complex:.1f}% des tickets sont complexes — revoir le processus de qualification.",
                    'affected_id': '',
                })

        # Handlers avec trop d'interventions
        handlers_df = df[df['est_handler'] == True]
        if not handlers_df.empty:
            avg_interventions = handlers_df['nombre_interventions'].mean()
            if avg_interventions > 10:
                insights.append({
                    'severity': 'info',
                    'category': 'time',
                    'message': f"Les handlers font en moyenne {avg_interventions:.1f} interventions par ticket — optimisation possible.",
                    'affected_id': '',
                })

        # Distribution déséquilibrée
        user_workload = df.groupby('user_id')['temps_total_secondes'].sum()
        if len(user_workload) > 1:
            workload_std = user_workload.std()
            workload_mean = user_workload.mean()
            if workload_mean > 0 and workload_std > workload_mean:
                insights.append({
                    'severity': 'info',
                    'category': 'time',
                    'message': "Distribution du travail déséquilibrée entre les utilisateurs.",
                    'affected_id': '',
                })

        # Tickets hors-norme
        bug_times = df.groupby('bug_id')['temps_total_secondes'].sum()
        if len(bug_times) > 5:
            p90 = bug_times.quantile(0.9)
            p50 = bug_times.quantile(0.5)
            if p50 > 0 and p90 > p50 * 5:
                insights.append({
                    'severity': 'warning',
                    'category': 'time',
                    'message': "10% des tickets prennent 5x plus de temps que la médiane — analyser ces cas prioritairement.",
                    'affected_id': '',
                })

        return insights
