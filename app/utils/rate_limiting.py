"""
QCrypt RNG - Rate Limiting and Usage Tracking
Enterprise-grade rate limiting and usage analytics
"""

import time
import asyncio
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import hashlib
import sqlite3
from contextlib import contextmanager
import threading

from app.config import settings

logger = logging.getLogger(__name__)

VALID_TIERS = ("free", "pro", "enterprise")


class UsageTracker:
    """
    Tracks API usage for enterprise customers.
    Supports tier-based rate limiting, usage analytics, and key lifecycle.
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
                    reset_time DATETIME,
                    customer_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    revoked_at DATETIME
                )
            ''')

            # Idempotent migration: add columns that may not exist yet.
            for col, typedef in [
                ("customer_id", "TEXT"),
                ("created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"),
                ("revoked_at", "DATETIME"),
            ]:
                try:
                    conn.execute(f"ALTER TABLE rate_limits ADD COLUMN {col} {typedef}")
                except sqlite3.OperationalError:
                    pass  # column already exists
            
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
        """Look up the stored tier for *api_key* from the rate_limits table."""
        if not api_key:
            return "free"

        with self._get_db_connection() as conn:
            cursor = conn.execute(
                "SELECT tier FROM rate_limits WHERE api_key = ? AND revoked_at IS NULL",
                (api_key,),
            )
            row = cursor.fetchone()
            if row and row[0] in VALID_TIERS:
                return row[0]
        return "free"

    # ------------------------------------------------------------------
    # Key lifecycle helpers (used by billing webhooks & admin scripts)
    # ------------------------------------------------------------------

    def register_key(self, api_key: str, tier: str = "free", customer_id: Optional[str] = None) -> None:
        """Insert or update a key with its authoritative tier."""
        if tier not in VALID_TIERS:
            raise ValueError(f"tier must be one of {VALID_TIERS}")
        with self._get_db_connection() as conn:
            conn.execute(
                """INSERT INTO rate_limits (api_key, tier, customer_id)
                   VALUES (?, ?, ?)
                   ON CONFLICT(api_key) DO UPDATE SET tier = excluded.tier,
                       customer_id = COALESCE(excluded.customer_id, rate_limits.customer_id),
                       revoked_at = NULL""",
                (api_key, tier, customer_id),
            )
            conn.commit()
        logger.info("Registered key %s… as tier=%s", api_key[:8], tier)

    def set_tier(self, api_key: str, tier: str) -> None:
        """Update the tier for an existing key (e.g. after a Stripe subscription change)."""
        if tier not in VALID_TIERS:
            raise ValueError(f"tier must be one of {VALID_TIERS}")
        with self._get_db_connection() as conn:
            conn.execute(
                "UPDATE rate_limits SET tier = ? WHERE api_key = ?",
                (tier, api_key),
            )
            conn.commit()
        logger.info("Updated key %s… to tier=%s", api_key[:8], tier)

    def revoke_key(self, api_key: str) -> None:
        """Soft-revoke a key so it no longer resolves to a valid tier."""
        with self._get_db_connection() as conn:
            conn.execute(
                "UPDATE rate_limits SET revoked_at = ? WHERE api_key = ?",
                (datetime.utcnow().isoformat(), api_key),
            )
            conn.commit()
        logger.info("Revoked key %s…", api_key[:8])

    def list_keys(self, include_revoked: bool = False) -> List[Dict]:
        """Return all registered keys (sans the raw key itself) for admin views."""
        with self._get_db_connection() as conn:
            query = "SELECT api_key, tier, customer_id, created_at, revoked_at FROM rate_limits"
            if not include_revoked:
                query += " WHERE revoked_at IS NULL"
            cursor = conn.execute(query)
            return [
                {
                    "api_key_prefix": row[0][:8] + "…" if row[0] else "",
                    "tier": row[1],
                    "customer_id": row[2],
                    "created_at": row[3],
                    "revoked_at": row[4],
                }
                for row in cursor.fetchall()
            ]

    def get_key_by_customer(self, customer_id: str) -> Optional[str]:
        """Retrieve the active api_key for a Stripe customer_id."""
        with self._get_db_connection() as conn:
            cursor = conn.execute(
                "SELECT api_key FROM rate_limits WHERE customer_id = ? AND revoked_at IS NULL LIMIT 1",
                (customer_id,),
            )
            row = cursor.fetchone()
            return row[0] if row else None

    # ------------------------------------------------------------------

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
                reset_time = datetime.utcnow() + timedelta(seconds=settings.rate_limit_period)
                conn.execute(
                    "INSERT INTO rate_limits (api_key, tier, reset_time) VALUES (?, 'free', ?)",
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