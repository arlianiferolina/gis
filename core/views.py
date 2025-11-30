from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import Perumahan


def home(request):
    """Render the home page"""
    return render(request, 'core/home.html')


def perumahan_list(request):
    """Render the perumahan list page with interactive map"""
    return render(request, 'core/perumahan_list.html')


def perumahan_detail(request, slug):
    """Render the perumahan detail page"""
    perumahan = get_object_or_404(Perumahan, slug=slug)
    return render(request, 'core/perumahan_detail.html', {'perumahan': perumahan})


def perumahan_geojson(request):
    """Return GeoJSON FeatureCollection of all perumahan"""
    perumahans = Perumahan.objects.all()
    
    features = []
    for perumahan in perumahans:
        # Get the point feature
        feature = perumahan.get_geojson_feature()
        features.append(feature)
        
        # If polygon exists, create a separate polygon feature
        if perumahan.polygon:
            polygon_feature = {
                'type': 'Feature',
                'properties': {
                    'id': perumahan.id,
                    'slug': perumahan.slug,
                    'name': perumahan.name,
                    'price': int(perumahan.price),
                    'status': perumahan.status,
                },
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': perumahan.polygon['coordinates']
                }
            }
            features.append(polygon_feature)
    
    geojson_data = {
        'type': 'FeatureCollection',
        'features': features
    }
    
    return JsonResponse(geojson_data)
