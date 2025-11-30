// Global variables for map and layers
var map;
var markerLayerGroup;
var polygonLayerGroup;
var markers = {};
var polygons = {};
var userLocationMarker = null;

// Initialize the map
function initializeMap() {
    // Create map centered on Kupang with closer zoom
    map = L.map('map').setView([-10.1772, 123.6070], 13);
    
    // Add OpenStreetMap tiles
    var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    });
    
    // Add Satellite layer
    var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
    });
    
    // Add both layers to map with OSM as default
    osmLayer.addTo(map);
    
    // Create layer groups
    markerLayerGroup = L.layerGroup().addTo(map);
    polygonLayerGroup = L.layerGroup().addTo(map);
    
    // Add layer control for base layers and overlays
    var baseMaps = {
        "OpenStreetMap": osmLayer,
        "Satelit": satelliteLayer
    };
    
    var overlayMaps = {
        "Perumahan (Titik)": markerLayerGroup,
        "Area Perumahan (Polygon)": polygonLayerGroup
    };
    
    L.control.layers(baseMaps, overlayMaps).addTo(map);
    
    // Add geolocation control
    var locateControl = L.control({position: 'topleft'});
    locateControl.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        div.innerHTML = '<a href="#" title="Tampilkan lokasi saya" role="button" aria-label="Tampilkan lokasi saya"><span style="font-size: 18px; padding: 0 4px;">&#8982;</span></a>';
        div.onclick = function(e) {
            e.preventDefault();
            map.locate({setView: true, maxZoom: 16});
        };
        return div;
    };
    locateControl.addTo(map);
    
    // Handle location found
    map.on('locationfound', function(e) {
        if (userLocationMarker) {
            map.removeLayer(userLocationMarker);
        }
        userLocationMarker = L.circleMarker(e.latlng, {
            color: '#136AEC',
            fillColor: '#136AEC',
            fillOpacity: 0.5,
            radius: 8
        }).addTo(map).bindPopup("Lokasi Anda").openPopup();
    });
    
    // Handle location error
    map.on('locationerror', function(e) {
        alert("Lokasi tidak dapat ditemukan: " + e.message);
    });
    
    // Load GeoJSON data
    loadPerumahanData();
    
    // Setup filter event handlers
    setupFilterHandlers();
}

// Function to calculate bounds and center of all perumahan
function centerMapOnPerumahans() {
    var bounds = [];
    
    // Add marker positions to bounds
    markerLayerGroup.eachLayer(function(layer) {
        if (layer.getLatLng) {
            bounds.push(layer.getLatLng());
        }
    });
    
    // Add polygon positions to bounds
    polygonLayerGroup.eachLayer(function(layer) {
        if (layer.getBounds) {
            bounds.push(layer.getBounds().getCenter());
        }
    });
    
    // If we have bounds, fit the map to them
    if (bounds.length > 0) {
        if (bounds.length === 1) {
            // If only one point, center on it with higher zoom
            map.setView(bounds[0], 15);
        } else {
            // If multiple points, fit bounds with padding
            var group = new L.featureGroup(bounds);
            map.fitBounds(group.getBounds(), {padding: [50, 50], maxZoom: 15});
        }
    } else {
        // Default view if no perumahans
        map.setView([-10.1772, 123.6070], 13);
    }
}

// Load perumahan data from API
function loadPerumahanData() {
    fetch('/api/perumahan.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Clear existing layers
            markerLayerGroup.clearLayers();
            polygonLayerGroup.clearLayers();
            markers = {};
            polygons = {};
            
            // Check if data has features
            if (!data.features || !Array.isArray(data.features)) {
                console.warn('Invalid GeoJSON data:', data);
                return;
            }
            
            // Process features
            data.features.forEach(function(feature) {
                if (feature.geometry && feature.geometry.type === "Point") {
                    addMarker(feature);
                } else if (feature.geometry && feature.geometry.type === "Polygon") {
                    addPolygon(feature);
                }
            });
            
            // Center map on all perumahans
            centerMapOnPerumahans();
        })
        .catch(error => {
            console.error('Error loading perumahan data:', error);
            alert('Gagal memuat data perumahan. Silakan coba lagi.');
        });
}

// Add marker to map
function addMarker(feature) {
    // Check if feature has geometry
    if (!feature.geometry || !feature.geometry.coordinates) {
        console.warn('Feature missing geometry:', feature);
        return;
    }
    
    var lat = feature.geometry.coordinates[1];
    var lng = feature.geometry.coordinates[0];
    
    // Create custom icon using Font Awesome
    var houseIcon = L.divIcon({
        className: 'house-marker',
        html: '<i class="fas fa-home" style="color: #007bff; font-size: 24px; text-shadow: 1px 1px 1px white;"></i>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
    
    // Create marker
    var marker = L.marker([lat, lng], {icon: houseIcon})
        .addTo(markerLayerGroup)
        .bindPopup(createPopupContent(feature.properties));
    
    // Store reference
    markers[feature.properties.id] = marker;
}

// Add polygon to map
function addPolygon(feature) {
    // Check if feature has geometry
    if (!feature.geometry || !feature.geometry.coordinates || !feature.geometry.coordinates[0]) {
        console.warn('Polygon feature missing geometry:', feature);
        return;
    }
    
    var coordinates = feature.geometry.coordinates[0].map(function(coord) {
        return [coord[1], coord[0]]; // Convert from [lng, lat] to [lat, lng]
    });
    
    // Create polygon with styling based on status
    var polygonColor = feature.properties.status === 'available' ? '#28a745' : '#dc3545';
    
    var polygon = L.polygon(coordinates, {
        color: polygonColor,
        fillColor: polygonColor,
        fillOpacity: 0.3,
        weight: 2
    }).addTo(polygonLayerGroup);
    
    // Add popup
    polygon.bindPopup(createPolygonPopupContent(feature.properties));
    
    // Store reference
    polygons[feature.properties.id] = polygon;
}

// Create popup content for markers
function createPopupContent(properties) {
    var facilitiesHtml = '';
    if (properties.facilities && properties.facilities.length > 0) {
        facilitiesHtml = '<ul class="facility-list">';
        properties.facilities.forEach(function(facility) {
            facilitiesHtml += '<li>' + facility + '</li>';
        });
        facilitiesHtml += '</ul>';
    }
    
    var photoHtml = '';
    if (properties.photo_url) {
        photoHtml = '<img src="' + properties.photo_url + '" class="photo-thumb" alt="' + properties.name + '">';
    }
    
    var statusBadge = properties.status === 'available' ? 
        '<span class="badge bg-success">Tersedia</span>' : 
        '<span class="badge bg-danger">Terjual</span>';
    
    return `
        <div class="info-card map-popup">
            <h6>${properties.name}</h6>
            ${photoHtml}
            <p class="price-tag">Rp ${parseInt(properties.price).toLocaleString('id-ID')}</p>
            <p>${properties.address}</p>
            ${facilitiesHtml}
            <p>Status: ${statusBadge}</p>
            <a href="/perumahan/${properties.slug}/" class="btn btn-success btn-sm" title="Detail">
                <i class="fas fa-info-circle"></i>
            </a>
        </div>
    `;
}

// Create popup content for polygons
function createPolygonPopupContent(properties) {
    var statusBadge = properties.status === 'available' ? 
        '<span class="badge bg-success">Tersedia</span>' : 
        '<span class="badge bg-danger">Terjual</span>';
    
    var detailLink = '';
    if (properties.slug) {
        detailLink = `<a href="/perumahan/${properties.slug}/" class="btn btn-success btn-sm mt-2" title="Detail"><i class="fas fa-info-circle"></i></a>`;
    }
    
    return `
        <div class="map-popup">
            <h6>${properties.name}</h6>
            <p class="price-tag">Rp ${parseInt(properties.price).toLocaleString('id-ID')}</p>
            <p>Status: ${statusBadge}</p>
            ${detailLink}
        </div>
    `;
}

// Setup filter event handlers
function setupFilterHandlers() {
    document.getElementById('applyFilter').addEventListener('click', function() {
        applyFilters();
    });
    
    document.getElementById('resetFilter').addEventListener('click', function() {
        resetFilters();
    });
}

// Apply filters to map data
function applyFilters() {
    var statusFilter = document.getElementById('statusFilter').value;
    var priceMin = document.getElementById('priceMin').value;
    var priceMax = document.getElementById('priceMax').value;
    
    // In a real implementation, we would re-fetch data with filters
    // For now, we'll just show an alert
    alert('Filter diterapkan: Status=' + statusFilter + ', Harga Min=' + priceMin + ', Harga Max=' + priceMax);
    
    // In a full implementation, you would:
    // 1. Send filter parameters to the backend
    // 2. Get filtered GeoJSON data
    // 3. Update the map with filtered data
}

// Reset filters
function resetFilters() {
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    
    // Reload all data
    loadPerumahanData();
    
    alert('Filter telah direset');
}