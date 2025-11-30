from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.home, name='home'),
    path('perumahan/', views.perumahan_list, name='perumahan_list'),
    path('perumahan/<slug:slug>/', views.perumahan_detail, name='perumahan_detail'),
    path('api/perumahan.geojson', views.perumahan_geojson, name='perumahan_geojson'),
]