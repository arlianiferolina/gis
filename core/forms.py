from django import forms
from .models import Perumahan


class PerumahanForm(forms.ModelForm):
    class Meta:
        model = Perumahan
        fields = '__all__'
        widgets = {
            'location': forms.HiddenInput(),
            'polygon': forms.HiddenInput(),
            'facilities': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make location and polygon fields not required in the form
        # They will be filled by JavaScript in the admin template
        self.fields['location'].required = False
        self.fields['polygon'].required = False
        # Set facilities field help text
        self.fields['facilities'].help_text = "Enter facilities as a JSON array, e.g., [\"School\", \"Hospital\", \"Park\"]"