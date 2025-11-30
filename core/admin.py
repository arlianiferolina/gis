from django.contrib import admin
from .models import Perumahan
from .forms import PerumahanForm


@admin.register(Perumahan)
class PerumahanAdmin(admin.ModelAdmin):
    form = PerumahanForm
    list_display = ('name', 'price', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'address')
    prepopulated_fields = {'slug': ('name',)}
    change_form_template = 'admin/perumahan_change_form.html'
    
    class Media:
        css = {
            'all': (
                'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
                'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css',
            )
        }
        js = (
            'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
            'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js',
            'core/js/admin_map.js',
        )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # Add custom help text
        form.base_fields['location'].help_text = "Select location on the map below"
        form.base_fields['polygon'].help_text = "Draw polygon on the map below (optional)"
        return form
