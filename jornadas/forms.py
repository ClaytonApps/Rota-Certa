from django import forms

from .models import Jornada


class JornadaForm(forms.ModelForm):
    """Formulário otimizado para mobile (inputs nativos do navegador)."""

    class Meta:
        model = Jornada
        fields = ['data', 'hora_inicio', 'hora_fim',
                  'km_inicial', 'km_final', 'valor_bruto']
        widgets = {
            'data': forms.DateInput(
                attrs={'type': 'date', 'class': 'form-control form-control-lg',
                       'inputmode': 'numeric'}
            ),
            'hora_inicio': forms.TimeInput(
                attrs={'type': 'time', 'class': 'form-control form-control-lg'}
            ),
            'hora_fim': forms.TimeInput(
                attrs={'type': 'time', 'class': 'form-control form-control-lg'}
            ),
            'km_inicial': forms.NumberInput(
                attrs={'class': 'form-control form-control-lg',
                       'inputmode': 'decimal', 'step': '0.1', 'min': '0',
                       'placeholder': 'Ex.: 12345.0'}
            ),
            'km_final': forms.NumberInput(
                attrs={'class': 'form-control form-control-lg',
                       'inputmode': 'decimal', 'step': '0.1', 'min': '0',
                       'placeholder': 'Ex.: 12480.5'}
            ),
            'valor_bruto': forms.NumberInput(
                attrs={'class': 'form-control form-control-lg',
                       'inputmode': 'decimal', 'step': '0.01', 'min': '0',
                       'placeholder': 'Ex.: 250.00'}
            ),
        }

    def clean(self):
        cleaned = super().clean()
        km_i = cleaned.get('km_inicial')
        km_f = cleaned.get('km_final')
        if km_i is not None and km_f is not None and km_f < km_i:
            self.add_error('km_final', 'KM final não pode ser menor que KM inicial.')
        return cleaned
