// This file is loaded in the admin template and provides the map functionality
// for selecting location points and drawing polygons

// The actual implementation is in the admin template itself since it needs
// to interact directly with Django admin form fields

console.log('Admin map JavaScript loaded');

// We can add utility functions here if needed
function validateJsonField(fieldId) {
    var field = document.getElementById(fieldId);
    if (field && field.value) {
        try {
            JSON.parse(field.value);
            return true;
        } catch (e) {
            console.error('Invalid JSON in field ' + fieldId + ':', e);
            return false;
        }
    }
    return true; // Empty field is valid
}

// Form submission validation
document.addEventListener('DOMContentLoaded', function() {
    var form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            // Validate JSON fields before submission
            var locationValid = validateJsonField('id_location');
            var polygonValid = validateJsonField('id_polygon');
            
            if (!locationValid || !polygonValid) {
                e.preventDefault();
                alert('Data lokasi atau polygon tidak valid. Silakan periksa kembali.');
                return false;
            }
        });
    }
});