from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

from . import utils


class Jornada(models.Model):
    """Uma jornada de trabalho de um motorista."""

    data = models.DateField('Data')
    km_inicial = models.DecimalField(
        'KM inicial', max_digits=10, decimal_places=1,
        validators=[MinValueValidator(Decimal('0'))],
    )
    km_final = models.DecimalField(
        'KM final', max_digits=10, decimal_places=1,
        validators=[MinValueValidator(Decimal('0'))],
    )
    hora_inicio = models.TimeField('Hora de início')
    hora_fim = models.TimeField('Hora de término')
    valor_bruto = models.DecimalField(
        'Valor bruto (R$)', max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
    )

    # Campos calculados (persistidos para acelerar listagens e relatórios)
    total_km = models.DecimalField(
        'Total km', max_digits=10, decimal_places=2, default=0, editable=False,
    )
    total_horas = models.DecimalField(
        'Total horas', max_digits=6, decimal_places=2, default=0, editable=False,
    )
    preco_por_km = models.DecimalField(
        'R$/km', max_digits=10, decimal_places=2, default=0, editable=False,
    )
    preco_por_hora = models.DecimalField(
        'R$/hora', max_digits=10, decimal_places=2, default=0, editable=False,
    )

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-data', '-hora_inicio']
        verbose_name = 'Jornada'
        verbose_name_plural = 'Jornadas'

    def __str__(self) -> str:
        return f'Jornada de {self.data:%d/%m/%Y} — R$ {self.valor_bruto}'

    def save(self, *args, **kwargs):
        # Recalcula campos derivados antes de gravar.
        self.total_km = utils.calcular_total_km(self.km_inicial, self.km_final)
        self.total_horas = utils.calcular_total_horas(self.hora_inicio, self.hora_fim)
        self.preco_por_km = utils.calcular_preco_por_km(self.valor_bruto, self.total_km)
        self.preco_por_hora = utils.calcular_preco_por_hora(self.valor_bruto, self.total_horas)
        super().save(*args, **kwargs)

    @property
    def total_horas_formatado(self) -> str:
        return utils.formatar_horas_decimais(self.total_horas)
