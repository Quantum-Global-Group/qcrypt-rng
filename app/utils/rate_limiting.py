"""
QCrypt RNG - Rate Limiting and Usage Tracking
Enterprise-grade rate limiting and usage analytics
"""

import time
import asyncio
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
import hashlib
import sqlite3
from contextlib import contextmanager
import threading

from app.config import settings


class UsageTracker:
    """
    Tracks API usage for enterprise customers
    Supports tier-based rate limiting and usage analytics
    """
    
    def __init__(self):
        self.usage_db_path = settings.usage_database_url.replace("sqlite:///", "")
        self._init_db()
        self._local_storage = threading.local()
    
    def _init_db(self):
        """Initialize the usage tracking database"""
        with self._get_db_connection() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS usage_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    api_key TEXT,
                    endpoint TEXT,
                    method TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    response_time REAL,
                    bytes_processed INTEGER,
                    success BOOLEAN
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS rate_limits (
                    api_key TEXT PRIMARY KEY,
                    tier TEXT DEFAULT 'free',
                    requests_count INTEGER DEFAULT 0,
                    bytes_count INTEGER DEFAULT 0,
                    reset_time DATETIME
                )
            ''')
            
            conn.commit()
    
    @contextmanager
    def _get_db_connection(self):
        """Get a thread-safe database connection"""
        conn = sqlite3.connect(self.usage_db_path, check_same_thread=False)
        try:
            yield conn
        finally:
            conn.close()
    
    def record_usage(
        self, 
        api_key: str, 
        endpoint: str, 
        method: str, 
        response_time: float, 
        bytes_processed: int, 
        success: bool = True
    ):
        """Record API usage for analytics and billing"""
        with self._get_db_connection() as conn:
            conn.execute(
                "INSERT INTO usage_logs (api_key, endpoint, method, response_time, bytes_processed, success) VALUES (?, ?, ?, ?, ?, ?)",
                (api_key, endpoint, method, response_time, bytes_processed, success)
            )
            conn.commit()
    
    def check_rate_limit(self, api_key: str, endpoint: str) -> Tuple[bool, int, int]:
        """
        Check if the request exceeds rate limits
        
        Returns:
            (is_allowed: bool, remaining_requests: int, reset_time_seconds: int)
        """
        tier_limits = settings.get_tier_limits(self._get_tier(api_key))
        
        # Get current usage
        current_requests, current_bytes, reset_time = self._get_current_usage(api_key)
        
        # Calculate remaining limits
        remaining_requests = tier_limits["max_requests"] - current_requests
        remaining_bytes = tier_limits["max_bytes"] - current_bytes
        
        # Check if limits are exceeded
        is_allowed = remaining_requests > 0 and remaining_bytes >= 1024  # Require at least 1KB capacity
        
        # Calculate reset time in seconds
        if reset_time:
            reset_in_seconds = max(0, int((reset_time - datetime.utcnow()).total_seconds()))
        else:
            reset_in_seconds = settings.rate_limit_period
        
        return is_allowed, remaining_requests, reset_in_seconds
    
    def _get_tier(self, api_key: str) -> str:
        """Get the user's tier based on API key (simplified - in real system would query DB)"""
        # In a real system, this would look up the tier in a user database
        # For now, we'll use a simple hash-based approach for demo purposes
        if not api_key:
            return "free"
        
        # Hash the API key to determine a pseudo-tier for demo purposes
        key_hash = hashlib.md5(api_key.encode()).hexdigest()
        
        if key_hash.startswith(('0', '1', '2')):
            return "enterprise"
        elif key_hash.startswith(('3', '4', '5', '6')):
            return "pro"
        else:
            return "free"
    
    def _get_current_usage(self, api_key: str) -> Tuple[int, int, Optional[datetime]]:
        """Get current usage for an API key"""
        with self._get_db_connection() as conn:
            cursor = conn.execute(
                "SELECT requests_count, bytes_count, reset_time FROM rate_limits WHERE api_key = ?",
                (api_key,)
            )
            row = cursor.fetchone()
            
            if row:
                requests_count, bytes_count, reset_time_str = row
                reset_time = datetime.fromisoformat(reset_time_str) if reset_time_str else None
                return requests_count, bytes_count, reset_time
            else:
                # Create new record
                reset_time = datetime.utcnow() + timedelta(seconds=settings.rate_limit_period)
                conn.execute(
                    "INSERT INTO rate_limits (api_key, reset_time) VALUES (?, ?)",
                    (api_key, reset_time.isoformat())
                )
                conn.commit()
                return 0, 0, reset_time
    
    def increment_usage(self, api_key: str, bytes_processed: int = 0):
        """Increment usage counters for an API key"""
        with self._get_db_connection() as conn:
            # Get current values
            current_requests, current_bytes, reset_time = self._get_current_usage(api_key)
            
            # Update counters
            new_requests = current_requests + 1
            new_bytes = current_bytes + bytes_processed
            
            # Handle reset time
            now = datetime.utcnow()
            if not reset_time or now >= reset_time:
                reset_time = now + timedelta(seconds=settings.rate_limit_period)
                new_requests = 1  # Reset counter to 1 for this request
                new_bytes = bytes_processed
            
            conn.execute('''
                UPDATE rate_limits 
                SET requests_count = ?, bytes_count = ?, reset_time = ?
                WHERE api_key = ?
            ''', (new_requests, new_bytes, reset_time.isoformat(), api_key))
            
            conn.commit()


class RateLimiter:
    """
    Rate limiting middleware for API endpoints
    """
    
    def __init__(self):
        self.tracker = UsageTracker()
    
    async def check_limit(self, api_key: str, endpoint: str) -> Tuple[bool, int, int]:
        """
        Async wrapper for rate limit checking
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, 
            self.tracker.check_rate_limit, 
            api_key, 
            endpoint
        )
    
    async def record_usage(
        self, 
        api_key: str, 
        endpoint: str, 
        method: str, 
        response_time: float, 
        bytes_processed: int, 
        success: bool = True
    ):
        """
        Async wrapper for recording usage
        """
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            self.tracker.record_usage,
            api_key,
            endpoint,
            method,
            response_time,
            bytes_processed,
            success
        )
    
    async def increment_usage(self, api_key: str, bytes_processed: int = 0):
        """
        Async wrapper for incrementing usage
        """
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            self.tracker.increment_usage,
            api_key,
            bytes_processed
        )


# Global rate limiter instance
rate_limiter = RateLimiter()