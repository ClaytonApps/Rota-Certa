"""
Stub de integração com o Firebase.

A inicialização real só acontece quando `FIREBASE_ENABLED=True` em settings,
e os métodos de sincronização ficam como `NotImplementedError` para serem
preenchidos quando o backend Firestore for plugado.

Uso futuro sugerido:
    from jornadas.firebase import sync_jornada
    sync_jornada(instance)  # após Jornada.save()
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from django.conf import settings

if TYPE_CHECKING:
    from .models import Jornada

logger = logging.getLogger(__name__)

_app = None


def _ensure_initialized():
    """Inicializa o Firebase Admin SDK uma única vez (lazy)."""
    global _app
    if not settings.FIREBASE_ENABLED:
        return None
    if _app is not None:
        return _app
    try:
        import firebase_admin
        from firebase_admin import credentials

        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        _app = firebase_admin.initialize_app(cred)
        logger.info('Firebase inicializado.')
        return _app
    except Exception as exc:  # pragma: no cover - apenas em produção
        logger.warning('Falha ao inicializar Firebase: %s', exc)
        return None


def sync_jornada(jornada: 'Jornada') -> None:
    """Persiste uma jornada no Firestore. Implementar quando habilitar."""
    if not settings.FIREBASE_ENABLED:
        return
    _ensure_initialized()
    raise NotImplementedError(
        'Implementar sync com Firestore (coleção "jornadas").'
    )


def delete_jornada(jornada_id: int) -> None:
    if not settings.FIREBASE_ENABLED:
        return
    _ensure_initialized()
    raise NotImplementedError('Implementar remoção remota.')
