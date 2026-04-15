"""
Configuration centralisée pour l'analyse Mantis.
Adapté pour usage web : input_file/output_file optionnels.
"""

import json
from dataclasses import dataclass, field
from typing import List


@dataclass
class AnalysisConfig:
    """Configuration centralisée pour l'analyse"""
    input_file: str = ""
    output_file: str = ""
    error_file: str = "errors.log"
    encoding: str = "utf-8"
    delimiter: str = ";"
    quote_char: str = '"'
    timezone_offset: int = 0
    expected_columns: int = 8
    column_names: List[str] = field(default_factory=lambda: [
        'id', 'user_id', 'bug_id', 'field_name',
        'old_value', 'new_value', 'type', 'date_modified'
    ])
    detect_anomalies: bool = True
    calculate_metrics: bool = True
    generate_insights: bool = True

    @classmethod
    def from_json(cls, filepath: str) -> 'AnalysisConfig':
        with open(filepath, 'r') as f:
            return cls(**json.load(f))

    def to_json(self, filepath: str):
        with open(filepath, 'w') as f:
            json.dump(self.__dict__, f, indent=4, default=str)
