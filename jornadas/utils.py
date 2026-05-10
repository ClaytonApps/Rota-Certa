"""
Lógica matemática auxiliar do LucroMetro.

Centraliza conversões de tempo e cálculos de rentabilidade para que os models,
views e a futura camada de sincronização (Firebase) compartilhem uma única
fonte da verdade.
"""
from __future__ import annotations

from datetime import datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable

# Quantizador padrão para valores monetários e métricas (2 casas decimais).
_TWO_PLACES = Decimal('0.01')


def _q(value: Decimal | float | int) -> Decimal:
    """Quantiza um valor para 2 casas decimais (ROUND_HALF_UP)."""
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    return value.quantize(_TWO_PLACES, rounding=ROUND_HALF_UP)


def calcular_total_km(km_inicial: float | int, km_final: float | int) -> Decimal:
    """Distância percorrida na jornada (km)."""
    delta = Decimal(str(km_final)) - Decimal(str(km_inicial))
    if delta < 0:
        delta = Decimal('0')
    return _q(delta)


def calcular_total_horas(hora_inicio: time, hora_fim: time) -> Decimal:
    """
    Diferença em horas (decimais) entre dois `datetime.time`.

    Se `hora_fim` for menor que `hora_inicio`, considera que a jornada cruzou
    a meia-noite (caso comum para motoristas no turno noturno).
    """
    if hora_inicio is None or hora_fim is None:
        return Decimal('0.00')

    base = datetime(2000, 1, 1)
    inicio = datetime.combine(base.date(), hora_inicio)
    fim = datetime.combine(base.date(), hora_fim)
    if fim <= inicio:
        fim += timedelta(days=1)

    segundos = (fim - inicio).total_seconds()
    horas = Decimal(str(segundos)) / Decimal('3600')
    return _q(horas)


def calcular_preco_por_km(valor_bruto: Decimal | float, total_km: Decimal | float) -> Decimal:
    """R$/km — retorna 0 quando não há quilometragem."""
    total_km = Decimal(str(total_km))
    if total_km <= 0:
        return Decimal('0.00')
    return _q(Decimal(str(valor_bruto)) / total_km)


def calcular_preco_por_hora(valor_bruto: Decimal | float, total_horas: Decimal | float) -> Decimal:
    """R$/hora — retorna 0 quando não há tempo registrado."""
    total_horas = Decimal(str(total_horas))
    if total_horas <= 0:
        return Decimal('0.00')
    return _q(Decimal(str(valor_bruto)) / total_horas)


def formatar_horas_decimais(horas: Decimal | float) -> str:
    """Converte horas decimais (ex.: 7.5) em string legível (ex.: '7h 30min')."""
    horas = Decimal(str(horas))
    h = int(horas)
    m = int((horas - h) * 60)
    return f"{h}h {m:02d}min"


def resumo_dashboard(jornadas: Iterable) -> dict:
    """
    Agrega uma coleção de jornadas em métricas para a dashboard.

    Retorna um dicionário com totais e médias ponderadas (não simples média
    das médias, para refletir o ganho real do motorista).
    """
    total_bruto = Decimal('0')
    total_km = Decimal('0')
    total_horas = Decimal('0')
    qtd = 0

    for j in jornadas:
        total_bruto += Decimal(str(j.valor_bruto or 0))
        total_km += Decimal(str(j.total_km or 0))
        total_horas += Decimal(str(j.total_horas or 0))
        qtd += 1

    media_km = calcular_preco_por_km(total_bruto, total_km)
    media_hora = calcular_preco_por_hora(total_bruto, total_horas)

    return {
        'total_jornadas': qtd,
        'total_bruto': _q(total_bruto),
        'total_km': _q(total_km),
        'total_horas': _q(total_horas),
        'media_por_km': media_km,
        'media_por_hora': media_hora,
    }
