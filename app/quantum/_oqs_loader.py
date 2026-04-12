"""
Shared liboqs import guard.

Centralises the slow `import oqs` so every PQC module in this package
re-uses the same result instead of each triggering the 5-second
auto-install countdown independently.
"""

from __future__ import annotations

_oqs_module = None
_liboqs_available: bool | None = None


def load_oqs():
    """Return (oqs_module_or_None, is_available)."""
    global _oqs_module, _liboqs_available
    if _liboqs_available is not None:
        return _oqs_module, _liboqs_available
    try:
        import oqs as _oqs  # noqa: F811
        _oqs_module = _oqs
        _liboqs_available = True
    except (ImportError, RuntimeError, SystemExit, OSError):
        _oqs_module = None
        _liboqs_available = False
    return _oqs_module, _liboqs_available
