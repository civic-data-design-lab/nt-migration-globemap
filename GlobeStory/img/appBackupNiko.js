/* global window */
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import {PolygonLayer} from '@deck.gl/layers';
import {TripsLayer} from '@deck.gl/geo-layers';
import {_GlobeView as GlobeView} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import {FlyToInterpolator} from 'deck.gl';
import AnimatedArcLayer from './animated-arc-layer';
import {sliceData, getDate} from './GlobeA/slice-data';

// chapters
const chapterData = require('./mapChapters.json'); 
var AFK = true
var afkTimer = 0
// set the AFK timeout
const idleLimit = 10000; 
var startMapIndex = false 

// Source data CSV
const DATA_URL = {
  // BUILDINGS:
    // 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  TRIPS: './data/PANAMV3.json', // eslint-disable-line
  TRIPS_DARIEN: './data/DarienDupPathways.json',
  TRIPS_GUATMEX: './data/guatMexStreets.json',
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
  trailLength = 35,
  trailLengthZoom = 100,
  // initialViewState = INITIAL_VIEW_STATE,
  // mapStyle = MAP_STYLE,
  theme = DEFAULT_THEME,
  loopLength = 1200000, // unit corresponds to the timestamp in source data
  animationSpeed = 1,
  data
}) {

  // get start state

  if (startMapIndex == false){
    for (let i = 0; i < chapterData.length; i++) {
      if(chapterData[i].name != 'NaN' && startMapIndex == false){
        startMapIndex = i
      }
      
    }
  }


  const groups = useMemo(() => sliceData(data), [data]);


  const [initialViewState, setInitialViewState] = useState({
    latitude: chapterData[startMapIndex].latitude,
    longitude: chapterData[startMapIndex].longitude,
    zoom: chapterData[startMapIndex].zoom,
    
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



  // AFK Timeout
  var timeoutReset = useCallback(() => {
    // console.log('bang')
    counter = 0;

    setInitialViewState({
      latitude: chapterData[startMapIndex].latitude,
      longitude: chapterData[startMapIndex].longitude,
      zoom: chapterData[startMapIndex].zoom,
      transitionDuration: chapterData[startMapIndex].duration,
      transitionInterpolator: transition,
      transitionEasing: t => (0.76*t, 0*t, 0.24*t, 1*t),
    })
    
    }, []);


  if(AFK == false){
    afkTimer++
    if(afkTimer > idleLimit){
      setTimeout(timeoutReset,0)
      AFK = true
    }
  }

  // NAVIGATION FORWARD
  var nextChapter = useCallback(() => {

    // GOOGLE HOW TO GET PENDING TIMEOUTS
    AFK=false
    afkTimer = 0
    counter++;
  
    if(counter >= chapterData.length){
      counter = 0
    }
  
    if(chapterData[counter].name != 'NaN'){
      setInitialViewState({
        latitude: chapterData[counter].latitude,
        longitude: chapterData[counter].longitude,
        zoom: chapterData[counter].zoom,
        transitionDuration: chapterData[counter].duration,
        transitionInterpolator: transition,
        transitionEasing: t => (0.76*t, 0*t, 0.24*t, 1*t),
      })
    }

    //toggle narrativeChapters
    const header = document.getElementById('narrativeText')
    const sText = document.getElementById('subText')
    const dText = document.getElementById('description')
    const narImg = document.getElementById('narrativeImg')
    
    // toggle narrative and images
    
    // default condition
    // if (counter == 0){
    //   nar.style.display = 'inherit'
    //   narImg.style.backgroundImage = ''
    // }
    // else {
    //   nar.style.display


    // }


    narImg.style.backgroundImage = 'url(' + chapterData[counter].imageUrl + ')'
    header.innerHTML = chapterData[counter].header
    sText.innerHTML = chapterData[counter].subText
    dText.innerHTML = chapterData[counter].desc




    }, []);
  

  // NAVIGATION BACKWARD
  var prevChapter = useCallback(() => {

    AFK=false
    afkTimer = 0

    if(counter > 0){
      counter--
    }

    setInitialViewState({
      latitude: chapterData[counter].latitude,
      longitude: chapterData[counter].longitude,
      zoom: chapterData[counter].zoom,
      transitionDuration: chapterData[counter].duration,
      transitionInterpolator: transition,
      transitionEasing: t => (0.76*t, 0*t, 0.24*t, 1*t),
    })
  }, []);
    

   // NAVIGATION JUMP
   var jumpToChapter = useCallback(() => {
    AFK=false
    afkTimer = 0

    counter = 1;
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
      image: './basemaps/CAD/WorldTilesetBlack.jpg',
      bounds: [[-180, -90,-35000], [-180, 90,-35000], [180, 90,-35000], [180, -90,-35000]],
    }),

    new BitmapLayer({
      id: 'saBitmap',
      image: './basemaps/CAD/SATilesetBlack.jpg',
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
      // hover: true,
      // clickable: true,
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

  const dataLayers = groups.map(
    (group, index) =>
    
      new AnimatedArcLayer({
      
        id: `flights-${index}`,
        data: group.flights,
        getSourcePosition: d => [d.lon2, d.lat2, d.alt1],
        getTargetPosition: d => [d.lon1, d.lat1, d.alt2],
        getSourceTimestamp: d => d.time1,
        getTargetTimestamp: d => d.time2,
        getTilt: d => d.tilt,
        getHeight: .1,
        getWidth: .95,   
        timeRange,
        getSourceColor: [255, 255, 0],
        getTargetColor: [255, 255, 255]
      })
  );

  return (
    <div>
    <DeckGL
      layers={[layers,dataLayers]}
      // datalay = {dataLayers}
      effects={theme.effects}
      views={new GlobeView()}
      initialViewState={initialViewState}
      // setInitialViewState = {initialViewState}
      controller={true}
    >
      {/* <StaticMap reuseMaps mapStyle={mapStyle} preventStyleDiffing={true} /> */}
    </DeckGL>

      {/* change this to mapchapter Json Header and subheader and text */}
      <div id='narrativeContainer'>
        <div id='narrativeText'>DISTANCE UNKNOWN</div>
        <div id="subText">RISKS AND OPPORTUNITIES OF MIGRATION IN THE AMERICAS</div>
        <div id="description"></div>
      </div>
      <div id='narrativeImg'></div>
      <div className="btnContainer" id='btnContainer'>
        <div className='btn' onClick={prevChapter}>◀</div>
        {/* <div className='btn progress' onClick={jumpToChapter}>■</div> */}
        <div className='btn' onClick={nextChapter}>▶</div>
      </div>
    </div>
  );
}

export function renderToDOM(container) {
  render(<App />, container);
}

// const parent = document.getElementById('btnContainer')
// console.log(parent)

// export {counter}
// module.exports = {counter}

// document.getElementsByClassName('btnContainer')[0]

// // create progress buttons:
// const btnCont = document.getElementsByClassName('btnContainer')
// console.log(btnCont)
// // console.log(chapterData.length)

// for (let i = 0; i < btnCont.length; i++) {
//   console.log(chapterData.length)
//   // const element = btnCont[i];
  
// }

// // for (let i = 0; i < chapterData.length; i++) {
// //   // cont = btnCont[0]
// //   console.log(btnCont)
// //   btnCont[0].appendChild(
// //     square = document.createElement('div')
// //   )
  
// // }

// let myPromise = new Promise(function(myResolve, myReject) {
//   // "Producing Code" (May take some time)
  
  
//     myResolve(); // when successful
//     myReject();  // when error
//   });
  
//   // "Consuming Code" (Must wait for a fulfilled Promise)
//   myPromise.then(
//     function(value) { /* code if successful */ },
//     function(error) { /* code if some error */ }
//   );
