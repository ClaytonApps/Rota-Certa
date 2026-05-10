"""
Signals que mantêm o Firebase em sincronia com o banco local.

Enquanto `FIREBASE_ENABLED=False`, as funções do stub retornam imediatamente,
então o overhead é zero. Quando habilitado, qualquer save/delete em Jornada
dispara a sincronização remota.
"""
import logging

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from . import firebase
from .models import Jornada

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Jornada)
def jornada_salva(sender, instance: Jornada, **kwargs):
    try:
        firebase.sync_jornada(instance)
    except NotImplementedError:
        # Stub ainda não implementado — não quebra o save local.
        pass
    except Exception as exc:  # pragma: no cover
        logger.error('Erro ao sincronizar jornada %s no Firebase: %s', instance.pk, exc)


@receiver(post_delete, sender=Jornada)
def jornada_excluida(sender, instance: Jornada, **kwargs):
    try:
        firebase.delete_jornada(instance.pk)
    except NotImplementedError:
        pass
    except Exception as exc:  # pragma: no cover
        logger.error('Erro ao remover jornada %s do Firebase: %s', instance.pk, exc)
