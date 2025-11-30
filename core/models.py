from django.db import models
from django.utils.text import slugify


class Perumahan(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    photo = models.ImageField(upload_to='perumahan_photos/')
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=0)
    address = models.CharField(max_length=400)
    location = models.JSONField()  # simpan {"lat": ..., "lng": ...}
    polygon = models.JSONField(null=True, blank=True)  # simpan GeoJSON polygon coordinates (list)
    facilities = models.JSONField(null=True, blank=True)  # list of strings
    status = models.CharField(max_length=20, choices=(('available', 'Available'), ('sold', 'Sold')), default='available')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    def get_geojson_feature(self):
        """Return a GeoJSON feature representation of this Perumahan"""
        # Base feature properties
        feature = {
            'type': 'Feature',
            'properties': {
                'id': self.id,
                'slug': self.slug,
                'name': self.name,
                'price': int(self.price),
                'address': self.address,
                'photo_url': self.photo.url if self.photo else '',
                'facilities': self.facilities or [],
                'status': self.status,
                'created_at': self.created_at.isoformat(),
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [self.location['lng'], self.location['lat']]  # GeoJSON uses [lng, lat]
            }
        }
        
        # If polygon exists, we can either include it as a separate feature or modify the geometry
        # For now, we'll stick with the point feature and let the frontend decide how to handle polygons
        return feature
