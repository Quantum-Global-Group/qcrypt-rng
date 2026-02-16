"""
QCrypt RNG - Monitoring and Analytics
Comprehensive monitoring, metrics collection, and analytics
"""

import time
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict, deque
import json
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
import statistics

from app.config import settings


@dataclass
class MetricPoint:
    """Data class for metric points"""
    timestamp: datetime
    metric_name: str
    value: float
    labels: Dict[str, str]


class MetricsCollector:
    """
    Collects and stores application metrics
    """
    
    def __init__(self):
        self.metrics_db_path = settings.usage_database_url.replace("sqlite:///", "")
        self._init_db()
        self._local_storage = threading.local()
        
        # In-memory metrics for real-time access
        self._realtime_metrics = defaultdict(list)
        self._max_points = 1000  # Max points to keep in memory
    
    def _init_db(self):
        """Initialize the metrics database"""
        with self._get_db_connection() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    metric_name TEXT NOT NULL,
                    value REAL NOT NULL,
                    labels TEXT  -- JSON string of labels
                )
            ''')
            
            # Create indexes for faster queries
            conn.execute('CREATE INDEX IF NOT EXISTS idx_metric_name ON metrics(metric_name)')
            conn.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON metrics(timestamp)')
            
            conn.commit()
    
    @contextmanager
    def _get_db_connection(self):
        """Get a thread-safe database connection"""
        conn = sqlite3.connect(self.metrics_db_path, check_same_thread=False)
        try:
            yield conn
        finally:
            conn.close()
    
    def record_metric(self, metric_name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Record a metric point"""
        # Store in database
        with self._get_db_connection() as conn:
            conn.execute(
                "INSERT INTO metrics (metric_name, value, labels) VALUES (?, ?, ?)",
                (metric_name, value, json.dumps(labels) if labels else None)
            )
            conn.commit()
        
        # Store in memory for real-time access
        metric_point = MetricPoint(
            timestamp=datetime.utcnow(),
            metric_name=metric_name,
            value=value,
            labels=labels or {}
        )
        
        self._realtime_metrics[metric_name].append(metric_point)
        
        # Trim if too many points
        if len(self._realtime_metrics[metric_name]) > self._max_points:
            self._realtime_metrics[metric_name] = self._realtime_metrics[metric_name][-self._max_points:]
    
    def get_recent_metrics(self, metric_name: str, minutes: int = 60) -> List[MetricPoint]:
        """Get recent metrics for a specific metric name"""
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
        
        # First check in-memory cache
        recent_points = [
            point for point in self._realtime_metrics[metric_name]
            if point.timestamp >= cutoff_time
        ]
        
        # If we don't have enough points in memory, query database
        if len(recent_points) < self._max_points:
            with self._get_db_connection() as conn:
                cursor = conn.execute(
                    '''
                    SELECT timestamp, metric_name, value, labels 
                    FROM metrics 
                    WHERE metric_name = ? AND timestamp >= ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                    ''',
                    (metric_name, cutoff_time.isoformat(), self._max_points)
                )
                
                db_points = []
                for row in cursor.fetchall():
                    timestamp = datetime.fromisoformat(row[0])
                    labels = json.loads(row[3]) if row[3] else {}
                    
                    db_points.append(MetricPoint(
                        timestamp=timestamp,
                        metric_name=row[1],
                        value=row[2],
                        labels=labels
                    ))
                
                # Combine and sort
                all_points = recent_points + db_points
                all_points.sort(key=lambda x: x.timestamp, reverse=True)
                
                return all_points[:self._max_points]
        
        return recent_points
    
    def get_aggregated_metrics(self, metric_name: str, window_minutes: int = 60) -> Dict[str, float]:
        """Get aggregated metrics for a specific metric name"""
        recent_points = self.get_recent_metrics(metric_name, window_minutes)
        
        if not recent_points:
            return {}
        
        values = [point.value for point in recent_points]
        
        return {
            "count": len(values),
            "sum": sum(values),
            "avg": statistics.mean(values),
            "min": min(values),
            "max": max(values),
            "median": statistics.median(values) if values else 0,
            "std_dev": statistics.stdev(values) if len(values) > 1 else 0
        }


class AnalyticsService:
    """
    Provides analytics and insights based on collected metrics
    """
    
    def __init__(self):
        self.collector = MetricsCollector()
    
    def track_api_call(self, endpoint: str, method: str, response_time: float, success: bool):
        """Track an API call"""
        # Record response time
        self.collector.record_metric(
            "api_response_time",
            response_time,
            {"endpoint": endpoint, "method": method, "success": str(success)}
        )
        
        # Record success/failure count
        status = "success" if success else "failure"
        self.collector.record_metric(
            "api_calls_total",
            1.0,
            {"endpoint": endpoint, "method": method, "status": status}
        )
    
    def track_quantum_generation(self, algorithm: str, qubits_used: int, generation_time: float, entropy_bits: int):
        """Track quantum generation metrics"""
        self.collector.record_metric(
            "quantum_generation_time",
            generation_time,
            {"algorithm": algorithm, "qubits": str(qubits_used)}
        )
        
        self.collector.record_metric(
            "entropy_bits_generated",
            entropy_bits,
            {"algorithm": algorithm}
        )
    
    def track_pqc_operation(self, operation: str, algorithm: str, execution_time: float):
        """Track post-quantum cryptography operations"""
        self.collector.record_metric(
            "pqc_operation_time",
            execution_time,
            {"operation": operation, "algorithm": algorithm}
        )
    
    def get_api_performance_summary(self, window_minutes: int = 60) -> Dict[str, Any]:
        """Get API performance summary"""
        # Get response time metrics
        response_time_metrics = self.collector.get_aggregated_metrics("api_response_time", window_minutes)
        
        # Get call volume
        with self.collector._get_db_connection() as conn:
            cursor = conn.execute(
                '''
                SELECT labels, SUM(value) as count
                FROM metrics
                WHERE metric_name = 'api_calls_total' AND timestamp >= ?
                GROUP BY labels
                ''',
                ((datetime.utcnow() - timedelta(minutes=window_minutes)).isoformat(),)
            )
            
            call_counts = {}
            for row in cursor.fetchall():
                labels = json.loads(row[0]) if row[0] else {}
                label_key = f"{labels.get('method', 'unknown')}_{labels.get('status', 'unknown')}"
                call_counts[label_key] = row[1]
        
        return {
            "period_minutes": window_minutes,
            "response_time": response_time_metrics,
            "call_volume": call_counts,
            "summary": {
                "avg_response_time_ms": response_time_metrics.get("avg", 0) * 1000,
                "total_calls": sum(call_counts.values()),
                "success_rate": call_counts.get("GET_success", 0) + call_counts.get("POST_success", 0) / max(sum(call_counts.values()), 1)
            }
        }
    
    def get_quantum_performance_summary(self, window_minutes: int = 60) -> Dict[str, Any]:
        """Get quantum generation performance summary"""
        gen_time_metrics = self.collector.get_aggregated_metrics("quantum_generation_time", window_minutes)
        entropy_metrics = self.collector.get_aggregated_metrics("entropy_bits_generated", window_minutes)
        
        return {
            "period_minutes": window_minutes,
            "generation_time": gen_time_metrics,
            "entropy_bits": entropy_metrics,
            "summary": {
                "avg_generation_time_ms": gen_time_metrics.get("avg", 0) * 1000,
                "avg_entropy_bits": entropy_metrics.get("avg", 0),
                "total_generations": gen_time_metrics.get("count", 0)
            }
        }
    
    def get_pqc_performance_summary(self, window_minutes: int = 60) -> Dict[str, Any]:
        """Get post-quantum cryptography performance summary"""
        pqc_metrics = self.collector.get_aggregated_metrics("pqc_operation_time", window_minutes)
        
        return {
            "period_minutes": window_minutes,
            "operation_time": pqc_metrics,
            "summary": {
                "avg_operation_time_ms": pqc_metrics.get("avg", 0) * 1000,
                "total_operations": pqc_metrics.get("count", 0)
            }
        }


# Global analytics service instance
analytics_service = AnalyticsService()


# Convenience functions for tracking common metrics
def track_api_call(endpoint: str, method: str, response_time: float, success: bool):
    """Convenience function to track API calls"""
    analytics_service.track_api_call(endpoint, method, response_time, success)


def track_quantum_generation(algorithm: str, qubits_used: int, generation_time: float, entropy_bits: int):
    """Convenience function to track quantum generation"""
    analytics_service.track_quantum_generation(algorithm, qubits_used, generation_time, entropy_bits)


def track_pqc_operation(operation: str, algorithm: str, execution_time: float):
    """Convenience function to track PQC operations"""
    analytics_service.track_pqc_operation(operation, algorithm, execution_time)