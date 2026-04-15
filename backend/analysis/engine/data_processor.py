"""
Processeur de données avec gestion intelligente des erreurs.
Adapté pour accepter des bytes (upload web) en plus des fichiers.
"""

import io
import os
import csv
import json
import logging
import pandas as pd
from datetime import datetime
from typing import Any, Dict, List, Optional

from .config import AnalysisConfig

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = ['id', 'user_id', 'bug_id', 'field_name',
                    'old_value', 'new_value', 'type', 'date_modified']


class DataProcessor:
    """Processeur de données avec gestion intelligente des erreurs"""

    def __init__(self, config: AnalysisConfig):
        self.config = config
        self.errors = []
        self.warnings = []

    def convert_timestamp(self, timestamp: Any) -> Optional[datetime]:
        """Conversion intelligente de timestamp avec gestion d'erreurs"""
        if pd.isna(timestamp):
            return None
        try:
            if isinstance(timestamp, (int, float)):
                return datetime.fromtimestamp(float(timestamp) + self.config.timezone_offset)
            elif isinstance(timestamp, str):
                try:
                    return datetime.fromtimestamp(float(timestamp) + self.config.timezone_offset)
                except Exception:
                    for fmt in ['%Y-%m-%d %H:%M:%S', '%d/%m/%Y %H:%M', '%Y-%m-%d']:
                        try:
                            return datetime.strptime(timestamp, fmt)
                        except Exception:
                            continue
            return None
        except Exception as e:
            self.warnings.append(f"Conversion timestamp failed for {timestamp}: {str(e)}")
            return None

    def format_date(self, date: datetime) -> str:
        """Formatage uniforme des dates"""
        return date.strftime('%d/%m/%Y %H:%M') if pd.notnull(date) else ''

    def format_duration(self, seconds: float) -> Dict[str, Any]:
        """Format duration with multiple representations"""
        if seconds <= 0:
            return {
                'seconds': 0,
                'formatted': '0 seconde',
                'hours': 0,
                'days': 0,
                'business_days': 0
            }

        mois = seconds // (30 * 24 * 3600)
        reste = seconds % (30 * 24 * 3600)
        jours = reste // (24 * 3600)
        reste %= (24 * 3600)
        heures = reste // 3600
        reste %= 3600
        minutes = reste // 60
        secondes = reste % 60

        parties = []
        if mois > 0:
            parties.append(f"{int(mois)} mois")
        if jours > 0:
            parties.append(f"{int(jours)} jour{'s' if jours > 1 else ''}")
        if heures > 0:
            parties.append(f"{int(heures)} heure{'s' if heures > 1 else ''}")
        if minutes > 0:
            parties.append(f"{int(minutes)} minute{'s' if minutes > 1 else ''}")
        if secondes > 0:
            parties.append(f"{int(secondes)} seconde{'s' if secondes > 1 else ''}")

        return {
            'seconds': int(seconds),
            'formatted': ' '.join(parties) if parties else '0 seconde',
            'hours': round(seconds / 3600, 2),
            'days': round(seconds / (24 * 3600), 2),
            'business_days': round(seconds / (8 * 3600), 2)
        }

    # --- Chargement depuis un chemin fichier (usage script standalone) ---

    def load_data(self) -> Optional[pd.DataFrame]:
        """Chargement depuis fichier avec détection automatique d'encodage"""
        if not os.path.exists(self.config.input_file):
            logger.error(f"File not found: {self.config.input_file}")
            return None

        encodings = [self.config.encoding, 'utf-8', 'latin1', 'cp1252']
        for encoding in encodings:
            try:
                logger.info(f"Trying encoding: {encoding}")
                df = self._read_csv_with_validation(encoding)
                if df is not None:
                    logger.info(f"Successfully loaded with encoding: {encoding}")
                    return df
            except Exception as e:
                logger.warning(f"Failed with encoding {encoding}: {str(e)}")
                continue

        logger.error("Could not load data with any encoding")
        return None

    def _read_csv_with_validation(self, encoding: str) -> Optional[pd.DataFrame]:
        """Lecture CSV avec validation ligne par ligne"""
        valid_rows = []
        error_rows = []

        with open(self.config.input_file, 'r', encoding=encoding) as f:
            reader = csv.reader(f, delimiter=self.config.delimiter,
                                quotechar=self.config.quote_char)

            headers = next(reader, None)
            if not headers:
                raise ValueError("No headers found")

            if len(headers) != self.config.expected_columns:
                logger.warning(f"Header count mismatch: {len(headers)} vs {self.config.expected_columns}")
                if len(headers) > 0:
                    self.config.column_names = headers
                    self.config.expected_columns = len(headers)

            for i, row in enumerate(reader, start=2):
                if len(row) == self.config.expected_columns:
                    valid_rows.append(row)
                else:
                    error_rows.append({
                        'line': i,
                        'content': row,
                        'error': f"Column count: {len(row)} vs {self.config.expected_columns}"
                    })
                    self.errors.append(f"Line {i}: Invalid column count")

        if not valid_rows:
            return None

        df = pd.DataFrame(valid_rows, columns=self.config.column_names)

        if error_rows:
            self._log_errors(error_rows)

        return df

    def _log_errors(self, errors: List[Dict]):
        with open(self.config.error_file, 'w', encoding='utf-8') as f:
            f.write(f"Analysis errors - {datetime.now()}\n")
            f.write("="*50 + "\n")
            for error in errors:
                f.write(json.dumps(error, ensure_ascii=False) + "\n")

    # --- Chargement depuis bytes (usage web / upload) ---

    def load_from_bytes(self, file_bytes: bytes) -> pd.DataFrame:
        """
        Point d'entrée pour l'upload web.
        Essaie plusieurs encodages, valide les colonnes, retourne un DataFrame prêt à analyser.
        """
        encodings = ['utf-8', 'latin1', 'cp1252', 'utf-8-sig']
        last_error = None

        for encoding in encodings:
            try:
                df = self._parse_bytes(file_bytes, encoding)
                self._validate_columns(df)
                logger.info(f"CSV parsed with encoding: {encoding}, rows: {len(df)}")
                return df
            except (UnicodeDecodeError, ValueError) as e:
                last_error = e
                continue

        raise ValueError(f"Impossible de lire le fichier CSV. Dernière erreur : {last_error}")

    def _parse_bytes(self, file_bytes: bytes, encoding: str) -> pd.DataFrame:
        """Parse les bytes CSV en DataFrame, en essayant les deux délimiteurs courants."""
        content = file_bytes.decode(encoding)
        first_line = content.split('\n')[0] if content else ''

        # Détection automatique du délimiteur
        delimiter = ';' if first_line.count(';') >= first_line.count(',') else ','

        df = pd.read_csv(
            io.StringIO(content),
            delimiter=delimiter,
            quotechar='"',
            dtype=str,
            keep_default_na=False,
        )
        # Nettoyer les noms de colonnes (espaces, BOM)
        df.columns = [c.strip().lstrip('\ufeff') for c in df.columns]
        return df

    def _validate_columns(self, df: pd.DataFrame):
        """Vérifie que les colonnes requises sont présentes."""
        df_cols_lower = [c.lower() for c in df.columns]
        missing = [c for c in REQUIRED_COLUMNS if c.lower() not in df_cols_lower]
        if missing:
            raise ValueError(
                f"Colonnes manquantes dans le CSV : {missing}. "
                f"Colonnes trouvées : {list(df.columns)}"
            )
        # Normaliser les noms de colonnes vers les noms attendus
        col_map = {}
        for expected in REQUIRED_COLUMNS:
            for actual in df.columns:
                if actual.lower() == expected.lower():
                    col_map[actual] = expected
        df.rename(columns=col_map, inplace=True)
