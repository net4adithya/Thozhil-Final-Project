"""
rate_limit.py – Shared rate-limiter instance for Module 3: AI Reviewer Engine.

Defined in a standalone module to avoid circular imports:
  - app.py needs to attach the limiter to app.state
  - routes.py needs to decorate route handlers with @limiter.limit()
  - Both import from here; neither imports from the other for this purpose.

The limiter uses the client IP address as the rate-limiting key.
The rate limit value is read from settings at decoration time.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Module-level singleton — one limiter instance shared across the application.
limiter = Limiter(key_func=get_remote_address)
