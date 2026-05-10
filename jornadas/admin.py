from django.contrib import admin

from .models import Jornada


@admin.register(Jornada)
class JornadaAdmin(admin.ModelAdmin):
    list_display = (
        'data',
        'hora_inicio',
        'hora_fim',
        'total_km',
        'total_horas',
        'valor_bruto',
        'preco_por_km',
        'preco_por_hora',
    )
    list_filter = ('data',)
    date_hierarchy = 'data'
    readonly_fields = ('total_km', 'total_horas', 'preco_por_km',
                       'preco_por_hora', 'criado_em', 'atualizado_em')
    fieldsets = (
        ('Jornada', {
            'fields': ('data', ('hora_inicio', 'hora_fim'),
                       ('km_inicial', 'km_final'), 'valor_bruto'),
        }),
        ('Métricas calculadas', {
            'fields': ('total_km', 'total_horas',
                       'preco_por_km', 'preco_por_hora'),
        }),
        ('Auditoria', {
            'classes': ('collapse',),
            'fields': ('criado_em', 'atualizado_em'),
        }),
    )
