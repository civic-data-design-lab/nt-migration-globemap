/* global window */
import React, {useState, useEffect} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import {PolygonLayer} from '@deck.gl/layers';
import {TripsLayer} from '@deck.gl/geo-layers';
import {_GlobeView as GlobeView} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';

// Source data CSV
const DATA_URL = {
  // BUILDINGS:
    // 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  // TRIPS: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json' // eslint-disable-line
  TRIPS: 'Longtest.json', // eslint-disable-line
  TRIPS: './data/PanAmericanPathways.json', // eslint-disable-line
};


// const ambientLight = new AmbientLight({
//   color: [255, 255, 255],
//   intensity: 1.0
// });

// const pointLight = new PointLight({
//   color: [255, 255, 255],
//   intensity: 2.0,
//   position: [-74.05, 40.7, 8000]
// });

// const lightingEffect = new LightingEffect({ambientLight, pointLight});

const material = {
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70]
};

const DEFAULT_THEME = {
  buildingColor: [74, 80, 87],
  trailColor0: [215, 215, 0],
  trailColor1: [255, 255, 255],
  // trailColor1: [23, 184, 190],
  material,
  // effects: [lightingEffect]
};

const INITIAL_VIEW_STATE = {
  longitude: -92.142500,
  latitude: 	14.680503,
  zoom: 13.25,
  pitch: 15,
  bearing: 0
};


// const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';

// const landCover = [
//   [
//     [-74.0, 40.7],
//     [-74.02, 40.7],
//     [-74.02, 40.72],
//     [-74.0, 40.72]
//   ]
// ];

export default function App({
  // buildings = DATA_URL.BUILDINGS,
  trips = DATA_URL.TRIPS,
  trailLength = 25,
  initialViewState = INITIAL_VIEW_STATE,
  // mapStyle = MAP_STYLE,
  theme = DEFAULT_THEME,
  loopLength = 30542, // unit corresponds to the timestamp in source data
  animationSpeed = 1
}) {
  const [time, setTime] = useState(0);
  const [animation] = useState({});
  // console.log(time)

  const animate = () => {
    setTime(t => (t + animationSpeed) % loopLength);
    animation.id = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    animation.id = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animation.id);
  }, [animation]);

  const layers = [
    // This is only needed when using shadow effects
    // new PolygonLayer({
    //   id: 'ground',
    //   data: landCover,
    //   getPolygon: f => f,
    //   stroked: false,
    //   getFillColor: [0, 0, 0, 0]
    // }),

    new TripsLayer({
      id: 'trips',
      data: trips,
      getPath: d => d.path,
      getTimestamps: d => d.timestamps,
      getColor: d => (d.vendor === 0 ? theme.trailColor0 : theme.trailColor1),
      opacity: 0.3,
      widthMinPixels:3,
      widthMaxPixels:3,
      // widthMaxPixels:100,
      capRounded: true,
      jointRounded: true,
      trailLength,
      currentTime: time,
      billboard: true,
      shadowEnabled: false
    }),

    // new PolygonLayer({
    //   id: 'buildings',
    //   data: buildings,
    //   extruded: true,
    //   wireframe: false,
    //   opacity: 0.5,
    //   getPolygon: f => f.polygon,
    //   getElevation: f => f.height,
    //   getFillColor: theme.buildingColor,
    //   material: theme.material
    // }),

    // new BitmapLayer({
    //   id: 'BitmapLayer',
    //   image: './basemaps/World Tileset Flattened.jpg',
    //   bounds: [[-180, -90], [-180, 90], [180, 90], [180, -90]],
    // }),

    new BitmapLayer({
      id: 'saBitmap',
      image: './basemaps/SATileset.jpg',
      bounds: [[-125, -58], [-125, 37], [-30, 37], [-30, -58]],
    }),

    // new BitmapLayer({
    //   id: 'darienBitmap',
    //   image: './basemaps/DarienCombined.jpg',
    //   bounds: [[-77.664696,8.078343], [-77.664696,8.789628], [-76.383324,8.789628], [-76.383324,8.078343]],
    // }),
  

    // new BitmapLayer({
    //   id: 'panamaBitmap',
    //   image: './basemaps/PANAMACOMBINED.jpg',
    //   bounds: [[	-84.071066, 	6.204412], [-84.071066,10.942168], [-75.646334,10.942168], [-75.646334,6.204412]],
    // }),

    new BitmapLayer({
      id: 'GuatMexBitmap1',
      image: './basemaps/guatMex1.jpg',
      bounds: [[-92.168185,14.663715], [-92.168185, 14.692483], [-92.142292, 14.692483], [-92.142292, 14.663715]],
    }),

    new BitmapLayer({
      id: 'GuatMexBitmap2',
      image: './basemaps/guatMex2.jpg',
      bounds: [[	-92.142885,14.663715], [	-92.142885, 14.692483], [-92.116985, 14.692483], [-92.116985, 14.663715]],
    }),


 
  ];

  return (
    <DeckGL
      layers={layers}
      effects={theme.effects}
      views={new GlobeView()}
      initialViewState={initialViewState}
      controller={true}

    >
      {/* <StaticMap reuseMaps mapStyle={mapStyle} preventStyleDiffing={true} /> */}
    </DeckGL>
  );
}

export function renderToDOM(container) {
  render(<App />, container);
}
