from django.urls import path

from . import views

app_name = 'jornadas'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('historico/', views.historico, name='historico'),
    path('nova/', views.nova_jornada, name='nova_jornada'),
    path('<int:pk>/editar/', views.editar_jornada, name='editar_jornada'),
    path('<int:pk>/excluir/', views.excluir_jornada, name='excluir_jornada'),
]
