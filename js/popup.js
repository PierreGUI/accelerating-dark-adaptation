import { show, hide } from "./utils.js";
import { map } from "./map.js";
import { markers, getMarkersWithVideo } from "./markers.js";

const setDefaultValue = value => (value.length > 0 ? value : "~");

const renderPopupLocation = (lieu, latitude, longitude) => `<div><div class='popup-quartier'><h2>${lieu}</h2></div><div class='popup-location'><p>${longitude}&nbsp;&nbsp;${latitude}</p></div></div>`;

const renderPopupLabels = () =>
  "<div class='popup-left'><p class='popup-lux hidden'>Lux</p><p class='popup-nqm hidden'>Sky quality</p></div>";

const renderPopupValues = (lux, nqm) =>
  `<div class='popup-right'><p class='popup-lux hidden'>${setDefaultValue(lux)}</p>
  <p class='popup-nqm hidden'>${setDefaultValue(nqm)}</p></div>`;

const renderPopupDescription = (description) => `<div class='popup-description'><p>${description}</p></div>`;

const renderPopUpContent = ({
  id,
  lieu = "",
  lux = "",
  nqm = "",
  latitude = 0,
  longitude = 0,
  description = ""
}) => {
  latitude = latitude.toFixed(5);
  longitude = longitude.toFixed(5);

  return (
    `<div class='popup-wrapper' data-id='${id}'>` +
    renderPopupLocation(lieu, latitude, longitude) +
    renderPopupDescription(description) +
    "<div class='popup-data'>" +
    renderPopupLabels() +
    renderPopupValues(lux, nqm) +
    "</div></div>"
  );
};

const showExtendedPopups = () => {
  show('.popup-description');
}

const showShortPopups = () => {
  hide('.popup-description');
}

const showMarkerPopups = () => {
  hide('.popup-description');
}

const initPopups = () => {
  map.addLayer({
    "id": "markers",
    "type": "circle",
    "source": {
      "type": "geojson",
      "data": markers
    },
    'paint': {
      'circle-radius': 1,
      'circle-color': "#000"
    }
  });

  let features = getMarkersWithVideo()
  features.forEach(feature => addMarkerPopupToMap(feature));
  hide('.mapboxgl-popup');
  updatePopupContent();
}

const addMarkerPopupToMap = (feature) => {
  let popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    anchor: 'bottom',
    maxWidth: '240px'
  });

  let coordinates = feature.geometry.coordinates.slice();

  popup
    .setLngLat(coordinates)
    .addTo(map)
    .setHTML(renderPopUpContent({
      ...feature.properties,
      latitude: coordinates[1],
      longitude: coordinates[0]
    }));
};

const updatePopupContent = () => {
  const zoom = map.getZoom()
  const pitch = map.getPitch();

  if (pitch > 60 || zoom <= 12) {
    showMarkerPopups();
  } else {
    if (zoom >= 15) {
      showExtendedPopups();
    } else {
      showShortPopups();
    }
  }
}

export { initPopups, updatePopupContent }