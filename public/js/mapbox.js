/* eslint-disable */
// DOM ELEMENT
const mapBox = document.getElementById('map');
// DELEGATION

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);

  mapboxgl.accessToken =
    'pk.eyJ1IjoiZHJ1Y2ttYXgiLCJhIjoiY2xhYmp3MW44MDE2YTNxanRjMWE4ZnI3YSJ9.pfO2z4vAN2ZKHgg9PwESYA';

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/druckmax/clablcs6w002315ls0sly3qct', // style URL
    center: [-74.5, 40], // starting position [lng, lat]
    scrollZoom: false,
    zoom: 10, // starting zoom
    maxZoom: 10,
    projection: 'globe', // display the map as a 3D globe
  });
  map.on('style.load', () => {
    map.setFog({}); // Set the default atmosphere style
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create a marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({ closeButton: false, offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend the map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
}
