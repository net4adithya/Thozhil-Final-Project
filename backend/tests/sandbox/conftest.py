# tests/sandbox/conftest.py
"""
Shared fixtures for sandbox tests.

Tests that require a live Docker daemon are marked with @pytest.mark.docker.
Tests that require a live Redis instance are marked with @pytest.mark.redis.
Both sets are skipped automatically when the respective service is unavailable.
"""

import os
import sys
import pytest

# Add python_backend to path so we can import app.*
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "python_backend"))


def pytest_configure(config):
    config.addinivalue_line("markers", "docker: requires live Docker daemon")
    config.addinivalue_line("markers", "redis: requires live Redis instance")


def _docker_available() -> bool:
    try:
        import docker
        client = docker.from_env()
        client.ping()
        client.close()
        return True
    except Exception:
        return False


def _redis_available() -> bool:
    try:
        import redis as redis_lib
        r = redis_lib.from_url("redis://localhost:6379/0", socket_connect_timeout=2)
        r.ping()
        r.close()
        return True
    except Exception:
        return False


DOCKER_AVAILABLE = _docker_available()
REDIS_AVAILABLE = _redis_available()

skip_no_docker = pytest.mark.skipif(
    not DOCKER_AVAILABLE,
    reason="Docker daemon not available",
)
skip_no_redis = pytest.mark.skipif(
    not REDIS_AVAILABLE,
    reason="Redis not available at localhost:6379",
)
