import { updateCoordinates, renderPopUpContent, mapStyle, showMap } from './map.js'
import { playVideo, hideVideo, showVideo, stopVideo, videoCoord } from './video.js'
import { markers, mapOffset } from './markers.js'
import { customLayer } from './dome.js'

mapboxgl.accessToken = 'pk.eyJ1IjoibWFub25mZXZhbCIsImEiOiJjanZjdXFzeGExbTFkM3lwODV3MWRqZ2VwIn0.-JNe-7KSzOG_2Pr0g0MgEw';

let popups = [];
let bounds = [
  [4.717755, 52.278175], // Southwest coordinates
  [5.075060, 52.431021]  // Northeast coordinates
];
const map = new mapboxgl.Map({
  container: 'map',
  minZoom: 13,
  maxZoom: 19,
  zoom: 15,
  center: [4.892891, 52.370088],
  bearing: 0,
  pitch: 0,
  maxBounds: bounds,
  style: mapStyle
});

const THREE = window.THREE;
let STATUS = 'down';

/* MAP */
$('.mapboxgl-canvas').css('cursor', 'crosshair');

const addVideoToMap = (properties) => {
  let { name, url_short_video, lat_bottom, lat_top, lon_right, lon_left } = properties;
  map.addSource(name, {
    "type": "video",
    "urls": [url_short_video],
    "coordinates": [
      [lon_left, lat_top], // Top left corner
      [lon_right, lat_top], // Top right corner
      [lon_right, lat_bottom], // Bottom right corner
      [lon_left, lat_bottom], // Bottom left corner
    ]
  });

  map.addLayer({
    "id": name,
    "type": "raster",
    "source": name,
    "paint": {}
  });
}

const pauseVideos = () => {
  markers.features.forEach((feature) => {
    let name = feature.properties.name;
    map.getSource(name).getVideo().pause();
  });
}

const playVideos = () => {
  markers.features.forEach((feature) => {
    let name = feature.properties.name;
    map.getSource(name).getVideo().play();
  });
}

const addMarkerToMap = (feature) => {
  let el = document.createElement('div');
  el.className = 'marker';

  // make a marker for each feature and add to the map
  new mapboxgl.Marker(el)
    .setLngLat(feature.geometry.coordinates)
    .addTo(map);

  el.addEventListener('click', () => {
    pauseVideos();
    showVideo();
    playVideo(feature.properties.url_long_video);
  });

  el.addEventListener('touchstart', () => {
    pauseVideos();
    showVideo();
    playVideo(feature.properties.url_long_video);
  });
}

const addMarkerPopupToMap = (feature) => {
  let popup = new mapboxgl.Popup({
    "closeButton": false,
    "closeOnClick": false,
    "offset": -200,
  });

  let coordinates = feature.geometry.coordinates.slice();
  let { lux, nqm, conditions } = feature.properties;

  popup.setLngLat(coordinates)
    .setHTML(renderPopUpContent(lux, nqm, conditions, coordinates[0], coordinates[1]))
    .addTo(map);

  popups.push(popup);
}


/* Events */
map.on('load', function () {
  // MARKERS
  map.addSource("markers", {
    "type": "geojson",
    "data": markers
  });

  markers.features.forEach((feature) => {
    addMarkerToMap(feature);
    addMarkerPopupToMap(feature);
    addVideoToMap(feature.properties);
  });
});

// map.on('zoom', function () {
//   for (let i = 0; i < popups.length; i++) {
//     popups[i].options.offset = mapOffset(map.getZoom());
//   }
// });

map.on('drag', () => {
  let { lng, lat } = map.getCenter();
  updateCoordinates(lat, lng);
});

$('#btn-start').on('click', (e) => {
  showMap();
  playVideos();
});

$('#close-video').on('click', (e) => {
  stopVideo();
  hideVideo();
  playVideos();
});

map.on('style.load', function () {
  map.addLayer(customLayer);
});

map.on('pitchend', () => {
  if (STATUS === 'down') return;
  rotateCamera();
});

map.on('zoom', () => {
  if (map.getZoom() < 15) {
    $('.mapboxgl-popup').addClass('hidden');
  } else {
    $('.mapboxgl-popup').removeClass('hidden');
  }
});

// degrees the map rotates when the left or right arrow is clicked
var deltaDegrees = 1;

function easing(t) {
  return t * (2 - t);
}

function rotateCamera() {
  map.easeTo({
    bearing: map.getBearing() - deltaDegrees,
    easing: easing,
    pitch: 80
  });

  // Request the next frame of the animation.
  if (STATUS == 'up') { requestAnimationFrame(rotateCamera) }
  else {
    map.easeTo({
      bearing: map.getBearing(),
      easing: easing,
      pitch: 80
    });

    map.easeTo({
      center: [4.892891, 52.370088],
      zoom: 15,
      pitch: 0,
      bearing: 0,
      speed: 5,
      curve: 10,
      easing: easing
    });
  }
}

$('#lookup').on('click', function () {
  pauseVideos();
  $('#lookdown').removeClass('hidden');
  $('#lookup').addClass('hidden');

  STATUS = 'up';

  map.easeTo({
    center: [4.892891, 52.370088],
    zoom: 13,
    pitch: 80,
    bearing: 0,
    speed: 5,
    curve: 10,
    easing: easing
  });

  $('#audio-player')[0].play();
});

$('#lookdown').on('click', function () {
  $('#lookup').removeClass('hidden');
  $('#lookdown').addClass('hidden');

  STATUS = 'down';

  $('#audio-player')[0].pause();
  playVideos();
});