/* global window */
import React, {useState, useEffect, useCallback} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import {PolygonLayer} from '@deck.gl/layers';
import {TripsLayer} from '@deck.gl/geo-layers';
import {_GlobeView as GlobeView} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import {FlyToInterpolator} from 'deck.gl';

// chapters
const chapterData = require('./mapChapters.json'); 

// Source data CSV
const DATA_URL = {
  // BUILDINGS:
    // 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  // TRIPS: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json' // eslint-disable-line
  // TRIPS: './data/PANAMSINGLE.json', // eslint-disable-line
  TRIPS: './data/PANAMV3.json', // eslint-disable-line
  // TRIPS: './data/debug.json', // eslint-disable-line
  TRIPS_DARIEN: './data/DarienDupPathways.json',
  TRIPS_GUATMEX: './data/guatMexStreets.json',
  MAP_CHAPTERS: './mapChapters.json'
};

var counter = 0;
const transition = new FlyToInterpolator()


const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000]
});

const lightingEffect = new LightingEffect({ambientLight, pointLight});

const material = {
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70]
};

// const postProcessEffect = new PostProcessEffect(brightnessContrast, {
//   brightness: 1.0,
//   contrast: 1.0
// });

const DEFAULT_THEME = {
  buildingColor: [74, 80, 87],
  trailColor0: [215, 215, 0],
  trailColor1: [255, 255, 255],
  // trailColor1: [23, 184, 190],
  material,
  effects: [lightingEffect]
  // effects: [postProcessEffect]
};

// const INITIAL_VIEW_STATE = {
//   longitude: -92.142500,
//   latitude: 	14.680503,
//   zoom: 13.25,
// };

// GUAT MEX VIEW STATE:
// longitude: -92.142500,
// latitude: 	14.680503,
// zoom: 13.25,


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
  // chapters = DATA_URL.MAP_CHAPTERS,
  trailLength = 35,
  trailLengthZoom = 100,
  // initialViewState = INITIAL_VIEW_STATE,
  // mapStyle = MAP_STYLE,
  theme = DEFAULT_THEME,
  loopLength = 1200000, // unit corresponds to the timestamp in source data
  animationSpeed = 1
}) {


  const [initialViewState, setInitialViewState] = useState({
    latitude: chapterData[0].latitude,
    longitude: chapterData[0].longitude,
    zoom: chapterData[0].zoom,
    
  });

  const [time, setTime] = useState(0);
  const [animation] = useState({});

  const animate = () => {
    setTime(t => (t + animationSpeed) % loopLength);
    animation.id = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    animation.id = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animation.id);
  }, [animation]);

  // set the AFK timeout
  const idleLimit = 15000; 

  var timeoutReset = useCallback(() => {
    counter = 0;
    setInitialViewState({
      latitude: -10,
      longitude: -66,
      zoom: 1.5,
      pitch: 0,
      bearing: 0,
      transitionDuration: 5000,
      transitionInterpolator: transition
    })
  }, []);

  var prevChapter = useCallback(() => {

    // myStopFunction()
    // const myTimeout = setTimeout(timeoutReset, idleLimit);

    counter--;
    setInitialViewState({
      latitude: chapterData[counter].latitude,
      longitude: chapterData[counter].longitude,
      zoom: chapterData[counter].zoom,
      transitionDuration: chapterData[counter].duration,
      transitionInterpolator: transition
    })
  }, []);

  // var myTimeout = setTimeout(timeoutReset, idleLimit);
  var nextChapter = useCallback(() => {

    // clearTimeout(myTimeout)
    
    //Reset
    // if (counter == 4){
    //   setInitialViewState({
    //     latitude: -10.,
    //     longitude: -66.,
    //     zoom: 1.5,
    //     transitionInterpolator: transition
    //   })
    // }

    counter++;

    if(counter >= chapterData.length){
      counter = 0
    }

    setInitialViewState({
        latitude: chapterData[counter].latitude,
        longitude: chapterData[counter].longitude,
        zoom: chapterData[counter].zoom,
        transitionDuration: chapterData[counter].duration,
        transitionInterpolator: transition
    })
  
  }, []);

  const layers = [
    // This is only needed when using shadow effects
    // new PolygonLayer({
    //   id: 'ground',
    //   data: landCover,
    //   getPolygon: f => f,
    //   stroked: false,
    //   getFillColor: [0, 0, 0, 0]
    // }),

    new BitmapLayer({
      id: 'BitmapLayer',
      image: './basemaps/WorldTilesetBlack.jpg',
      bounds: [[-180, -90,-35000], [-180, 90,-35000], [180, 90,-35000], [180, -90,-35000]],
    }),

    new BitmapLayer({
      id: 'saBitmap',
      image: './basemaps/SATilesetBlack.jpg',
      bounds: [[-125.704377, -58.123691], [-125.704377, 	37.286326], [	-30.290414, 	37.286326], [	-30.290414, -58.123691]],
    }),

    new BitmapLayer({
      id: 'panamaBitmap',
      image: './basemaps/CAD/03a.jpeg',
      bounds: [[	-84.071066,6.204412], [-84.071066,10.942168], [-75.646334,10.942168], [-75.646334,6.204412]],
      parameters: {
        depthTest: false
      }
    }),

    new BitmapLayer({
      id: 'darienBitmap',
      image: './basemaps/CAD/01a.jpeg',
      bounds: [[-77.664696,8.078343], [-77.664696,8.789628], [-76.383324,8.789628], [-76.383324,8.078343]],
      parameters: {
        depthTest: false
      }
    }),
  
    new BitmapLayer({
      id: 'GuatMexBitmap1',
      image: './basemaps/CAD/02a.jpeg',
      bounds: [[-92.168185,14.663715], [-92.168185, 14.692483], [-92.116985, 14.692483], [-92.116985, 14.663715]],
      parameters: {
        depthTest: false
      }
    }),

    // new BitmapLayer({
    //   id: 'GuatMexBitmap2',
    //   image: './basemaps/guatMex2.jpg',
    //   bounds: [[	-92.142885,14.663715], [	-92.142885, 14.692483], [-92.116985, 14.692483], [-92.116985, 14.663715]],
    //   parameters: {
    //     depthTest: false
    //   }
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
      capRounded: true,
      jointRounded: true,
      trailLength,
      currentTime: time,
      shadowEnabled: false,
      fadeTrail: true,
      parameters: {
        depthTest: false
      }
    }),

    new TripsLayer({
      id: 'trips-darien',
      data: DATA_URL.TRIPS_DARIEN,
      getPath: d => d.path,
      getTimestamps: d => d.timestamps,
      getColor: d => (d.vendor === 0 ? theme.trailColor0 : theme.trailColor1),
      opacity: 0.3,
      widthMinPixels:5,
      trailLengthZoom,
      currentTime: time,
      shadowEnabled: false,
      parameters: {
        depthTest: false
      }
    }),

    new TripsLayer({
      id: 'trips-guatMex',
      data: DATA_URL.TRIPS_GUATMEX,
      getPath: d => d.path,
      getTimestamps: d => d.timestamps,
      getColor: d => (d.vendor === 0 ? theme.trailColor0 : theme.trailColor1),
      opacity: 0.3,
      widthMinPixels:5,
      trailLengthZoom,
      currentTime: time,
      shadowEnabled: false,
      parameters: {
        depthTest: false
      }
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
 
  ];

  return (
    <div>
    <DeckGL
      layers={layers}
      effects={theme.effects}
      views={new GlobeView()}
      initialViewState={initialViewState}
      // setInitialViewState = {initialViewState}
      controller={true}
    >
      {/* <StaticMap reuseMaps mapStyle={mapStyle} preventStyleDiffing={true} /> */}
    </DeckGL>
      <div className='btnContainer'>
        <div className='btn' onClick={prevChapter}>◀</div>
        <div className='btn' onClick={nextChapter}>▶</div>
      </div>
    </div>
  );
}

export function renderToDOM(container) {
  render(<App />, container);
}
