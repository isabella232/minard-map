import mapboxgl from 'mapbox-gl';
import campaign from '../data/campaign';
import lineChunk from '@turf/line-chunk';
console.log('campaign', campaign);

mapboxgl.accessToken = 'pk.eyJ1IjoicnlhbmhhbWxleSIsImEiOiJjaWszbmluaG8wMDAzdTBrc2Q3Ymk3b3l1In0.BxdMyaYKg_0-LwANjPybNA';

const map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
    center: campaign.features[0].geometry.coordinates[0], // starting position [lng, lat]
    zoom: 9 // starting zoom
});

const chunkedFeatures = [];

for (let x = 0; x < campaign.features.length; x++) {
    const feature = campaign.features[x];
    const result = lineChunk(feature.geometry, 15, {units: 'miles'});
    chunkedFeatures.push(result.features);
}

campaign.features = chunkedFeatures.flat();

map.on('load', () => {
    const geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": []
            }
        }]
    };

    var speedFactor = 30; // number of frames per longitude degree
    var animation; // to store and cancel the animation
    var startTime = 0;
    var progress = 0; // progress = timestamp - startTime
    var resetTime = false; // indicator of whether time reset is needed for the animation
    var i = 0;

    map.addLayer({
        'id': 'line-animation',
        'type': 'line',
        'source': {
            'type': 'geojson',
            'data': geojson
        },
        'layout': {
            'line-cap': 'round',
            'line-join': 'round'
        },
        'paint': {
            'line-color': '#000000',
            'line-width': 5,
            'line-opacity': 0.8
        }
    });

    startTime = performance.now();

    animateLine();

    // animated in a circle as a sine wave along the map.
    function animateLine(timestamp) {
        if (resetTime) {
            // resume previous progress
            startTime = performance.now() - progress;
            resetTime = false;
        } else {
            progress = timestamp - startTime;
        }

        if (i < campaign.features.length) {
            // append new coordinates to the lineString
            geojson.features[0].geometry.coordinates.push(getCoordinatesFromFeature(campaign.features[i]));
            i++;
            // then update the map
            map.getSource('line-animation').setData(geojson);
        }
        // Request the next frame of the animation.
        animation = requestAnimationFrame(animateLine);
    }
});

function getCoordinatesFromFeature(feature) {
    return feature.geometry.coordinates[0];
};
