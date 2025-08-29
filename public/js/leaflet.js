import L from 'leaflet';

// Виправлення іконок Leaflet
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: new URL(
//     'leaflet/dist/images/marker-icon-2x.png',
//     import.meta.url,
//   ).href,
//   iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
//   shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url)
//     .href,
// });

export const displayMap = (locations) => {
  const map = L.map('map', {
    center: [51.505, -0.09],
    zoom: 13,
    zoomControl: false,
    dragging: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    crossOrigin: '',
  }).addTo(map);

  const points = [];
  locations.forEach((loc) => {
    points.push([loc.coordinates[1], loc.coordinates[0]]);
    L.marker([loc.coordinates[1], loc.coordinates[0]])
      .addTo(map)
      .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
        autoClose: false,
      })
      .openPopup();
  });

  const bounds = L.latLngBounds(points).pad(0.5);
  map.fitBounds(bounds);

  map.scrollWheelZoom.disable();

  map.doubleClickZoom.disable();
};
