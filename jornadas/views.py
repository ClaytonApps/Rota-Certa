from datetime import timedelta

from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from .forms import JornadaForm
from .models import Jornada
from .utils import resumo_dashboard

PERIODOS = {
    'hoje': 'Hoje',
    'semana': 'Últimos 7 dias',
    'mes': 'Últimos 30 dias',
    'tudo': 'Tudo',
}


def _filtrar_periodo(qs, periodo: str):
    hoje = timezone.localdate()
    if periodo == 'hoje':
        return qs.filter(data=hoje)
    if periodo == 'semana':
        return qs.filter(data__gte=hoje - timedelta(days=6))
    if periodo == 'mes':
        return qs.filter(data__gte=hoje - timedelta(days=29))
    return qs


def dashboard(request):
    periodo = request.GET.get('periodo', 'mes')
    if periodo not in PERIODOS:
        periodo = 'mes'

    jornadas = _filtrar_periodo(Jornada.objects.all(), periodo)
    resumo = resumo_dashboard(jornadas)
    ultimas = jornadas[:5]
    return render(request, 'jornadas/dashboard.html', {
        'resumo': resumo,
        'ultimas': ultimas,
        'periodo_atual': periodo,
        'periodos': PERIODOS,
    })


def historico(request):
    jornadas = Jornada.objects.all()
    return render(request, 'jornadas/historico.html', {'jornadas': jornadas})


def nova_jornada(request):
    if request.method == 'POST':
        form = JornadaForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Jornada registrada com sucesso!')
            return redirect('jornadas:dashboard')
    else:
        form = JornadaForm()
    return render(request, 'jornadas/nova_jornada.html', {'form': form})


def editar_jornada(request, pk: int):
    jornada = get_object_or_404(Jornada, pk=pk)
    if request.method == 'POST':
        form = JornadaForm(request.POST, instance=jornada)
        if form.is_valid():
            form.save()
            messages.success(request, 'Jornada atualizada.')
            return redirect('jornadas:historico')
    else:
        form = JornadaForm(instance=jornada)
    return render(request, 'jornadas/nova_jornada.html', {
        'form': form,
        'jornada': jornada,
        'editando': True,
    })


def excluir_jornada(request, pk: int):
    jornada = get_object_or_404(Jornada, pk=pk)
    if request.method == 'POST':
        jornada.delete()
        messages.success(request, 'Jornada excluída.')
        return redirect('jornadas:historico')
    return render(request, 'jornadas/excluir_jornada.html', {'jornada': jornada})
