"""
Database utility functions for connection management with retry logic.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

import asyncpg

logger = logging.getLogger(__name__)

# Default retry configuration for database operations
DEFAULT_MAX_RETRIES = 3
DEFAULT_BASE_DELAY = 0.5  # seconds
DEFAULT_MAX_DELAY = 5.0  # seconds

# Exceptions that indicate transient connection issues worth retrying
RETRYABLE_EXCEPTIONS = (
    asyncpg.exceptions.InterfaceError,
    asyncpg.exceptions.ConnectionDoesNotExistError,
    asyncpg.exceptions.TooManyConnectionsError,
    asyncpg.exceptions.DeadlockDetectedError,
    OSError,
    ConnectionError,
    asyncio.TimeoutError,
)


async def retry_with_backoff(
    func,
    max_retries: int = DEFAULT_MAX_RETRIES,
    base_delay: float = DEFAULT_BASE_DELAY,
    max_delay: float = DEFAULT_MAX_DELAY,
    retryable_exceptions: tuple = RETRYABLE_EXCEPTIONS,
):
    """
    Execute an async function with exponential backoff retry.

    Args:
        func: Async function to execute
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay between retries (seconds)
        max_delay: Maximum delay between retries (seconds)
        retryable_exceptions: Tuple of exception types to retry on

    Returns:
        Result of the function

    Raises:
        The last exception if all retries fail
    """
    last_exception = None
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except retryable_exceptions as e:
            last_exception = e
            if attempt < max_retries:
                delay = min(base_delay * (2**attempt), max_delay)
                if isinstance(e, asyncpg.exceptions.DeadlockDetectedError):
                    logger.warning(
                        f"Deadlock detected during parallel document processing — this is expected and will resolve automatically "
                        f"(attempt {attempt + 1}/{max_retries + 1}, retrying in {delay:.1f}s)"
                    )
                else:
                    logger.warning(
                        f"Database operation failed (attempt {attempt + 1}/{max_retries + 1}): {e}. "
                        f"Retrying in {delay:.1f}s..."
                    )
                await asyncio.sleep(delay)
            else:
                logger.error(f"Database operation failed after {max_retries + 1} attempts: {e}")
    raise last_exception


@asynccontextmanager
async def acquire_with_retry(pool: asyncpg.Pool, max_retries: int = DEFAULT_MAX_RETRIES):
    """
    Async context manager to acquire a connection with retry logic.

    Usage:
        async with acquire_with_retry(pool) as conn:
            await conn.execute(...)

    Args:
        pool: The asyncpg connection pool
        max_retries: Maximum number of retry attempts

    Yields:
        An asyncpg connection
    """
    import time

    start = time.time()

    async def acquire():
        return await pool.acquire()

    conn = await retry_with_backoff(acquire, max_retries=max_retries)
    acquire_time = time.time() - start

    # Log slow connection acquisitions (indicates pool contention)
    if acquire_time > 0.05:  # 50ms threshold
        pool_size = pool.get_size()
        pool_free = pool.get_idle_size()
        logger.warning(f"[DB POOL] Slow acquire: {acquire_time:.3f}s | size={pool_size}, idle={pool_free}")

    try:
        yield conn
    finally:
        await pool.release(conn)
