/* global window */
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import {PolygonLayer, TextLayer, PathLayer,GeoJsonLayer} from '@deck.gl/layers';
import {TripsLayer} from '@deck.gl/geo-layers';
import {_GlobeView as GlobeView} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import {FlyToInterpolator, LinearInterpolator} from 'deck.gl';
import AnimatedArcLayer from './animated-arc-layer';
import {sliceData, getDate} from './slice-data';
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
import RangeInput from './range-input';
import {PathStyleExtension} from '@deck.gl/extensions';
import {TileLayer} from '@deck.gl/geo-layers';

// chapters
const chapterData = require('./mapChapters.json');
const tempData = require('./data/tmpLayers/accumulatedCost.json');
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
  PATH_COST: './data/FULLPATH.json',
};

const DATA_GLOBE = './data';

var counter = 0;
const transition = new FlyToInterpolator()
const TIME_WINDOW = 50; // 15 minutes
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
  loopLength = 120000, // unit corresponds to the timestamp in source data
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

const [currentTime, setCurrentTime] = useState(0);
  const groups = useMemo(() => sliceData(data), [data]);
  const endTime = useMemo(() => {
    return groups.reduce((max, group) => Math.max(max, group.endTime), 0);
  }, [groups]);

  const timeRange = [currentTime, currentTime + TIME_WINDOW];
  const [glContext, setGLContext] = useState();
  const formatLabel = useCallback(t => getDate(data, t).toUTCString(), [data]);
  



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
      // RESET STORY AFTER COMPLETING NARRATIVE
      setInitialViewState({
        latitude: chapterData[startMapIndex].latitude,
        longitude: chapterData[startMapIndex].longitude,
        zoom: chapterData[startMapIndex].zoom,
        transitionDuration: chapterData[startMapIndex].duration,
        transitionInterpolator: transition,
        transitionEasing: t => (0.76*t, 0*t, 0.24*t, 1*t),
      })

      counter = 0
    }
    
  
    // CHANGE CAMERA VIEW THROUGH STORY
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
    const _flare = document.getElementById('flare')
    const sText = document.getElementById('subText')
    const dText = document.getElementById('description')
    const narImg = document.getElementById('narrativeImg')
    narImg.style.backgroundImage = 'url(' + chapterData[counter].imageUrl + ')'
    

    if(chapterData[counter].header==""){
      _flare.innerHTML = ""
    }
    else{
      _flare.innerHTML = "|"
    }


    // var txt = chapterData[counter].header;
    var hlen=0
    var slen=0
    var typeSpeed =150;
    header.innerHTML = ""
    sText.innerHTML = ""

    typeWriter()
    function typeWriter() {
    if (hlen < chapterData[counter].header.length) {
      header.innerHTML += chapterData[counter].header.charAt(hlen);
      hlen++;
    setTimeout(typeWriter, typeSpeed);
    }

    if (slen < chapterData[counter].subText.length) {
      sText.innerHTML += chapterData[counter].subText.charAt(slen);
      slen++;
    setTimeout(typeWriter, typeSpeed);
    }
    }


    dText.innerHTML = chapterData[counter].desc

    console.log(counter)

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

    
    //toggle narrativeChapters
    const header = document.getElementById('narrativeText')
    const sText = document.getElementById('subText')
    const dText = document.getElementById('description')
    const narImg = document.getElementById('narrativeImg')
    narImg.style.backgroundImage = 'url(' + chapterData[counter].imageUrl + ')'
    header.innerHTML = chapterData[counter].header
    sText.innerHTML = chapterData[counter].subText
    dText.innerHTML = chapterData[counter].desc

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

    // new TileLayer({
    //   data: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/512/1/1/0@2x?access_token=pk.eyJ1IjoibWl0Y2l2aWNkYXRhIiwiYSI6ImNpbDQ0aGR0djN3MGl1bWtzaDZrajdzb28ifQ.quOF41LsLB5FdjnGLwbrrg&zoomwheel=true&fresh=true#3.92/5.14/-69.46',
    //   minZoom: 0,
    //   maxZoom: 19,
    //   tileSize: 1080,
  
    //   renderSubLayers: props => {
    //     const {
    //       bbox: {west, south, east, north}
    //     } = props.tile;
  
    //     return new BitmapLayer(props, {
    //       data: null,
    //       image: props.data,
    //       bounds: [west, south, east, north]
    //     });
    //   }
    // }),

    // new GeoJsonLayer({
    //   id: 'earth-land',
    //   data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson',
    //   // Styles
    //   stroked: true,
    //   filled: true,
    //   // opacity: 1,
    //   getStrokeColor: [255,255,255],
    //   getLineWidth:5,
    //   getFillColor: [0,0,0],
    //   parameters:{
    //     cull:true
    //   }
    // }),

    new BitmapLayer({
      id: 'BitmapLayer',
      image: './basemaps/CAD/WorldTilesetBlack.jpg',
      bounds: [[-180, -90,-35000], [-180, 90,-35000], [180, 90,-35000], [180, -90,-35000]],
      visible: chapterData[counter].worldTile,
      // opacity: opacityRamp
    }),

    new BitmapLayer({
      id: 'saBitmap',
      image: './basemaps/CAD/SATilesetBlack.jpg',
      bounds: [[-125.704377, -58.123691], [-125.704377, 	37.286326], [	-30.290414, 	37.286326], [	-30.290414, -58.123691]],
      visible: chapterData[counter].SaTile,
    }),

    new BitmapLayer({
      id: 'panamaBitmap',
      image: './basemaps/CAD/03a.jpeg',
      bounds: [[	-84.071066,6.204412], [-84.071066,10.942168], [-75.646334,10.942168], [-75.646334,6.204412]],
      visible: chapterData[counter].PanamaImg,
      parameters: {
        depthTest: false
      }
    }),

    new BitmapLayer({
      id: 'darienBitmap',
      image: './basemaps/CAD/01a.jpeg',
      bounds: [[-77.664696,8.078343], [-77.664696,8.789628], [-76.383324,8.789628], [-76.383324,8.078343]],
      visible: chapterData[counter].DarienImg,
      parameters: {
        depthTest: false
      }
    }),
  
    new BitmapLayer({
      id: 'GuatMexBitmap1',
      image: './basemaps/CAD/02a.jpeg',
      bounds: [[-92.168185,14.663715], [-92.168185, 14.692483], [-92.116985, 14.692483], [-92.116985, 14.663715]],
      visible: chapterData[counter].GuatMexImg,
      parameters: {
        depthTest: false
      }
    }),

    new PathLayer({
      id: 'accumulatedCost',
      data: DATA_URL.PATH_COST,
      widthScale: 3,
      widthMinPixels: 2,
      getPath: d => d.path,
      getColor: [255,255,255,255],
      getDashArray: [4, 5],
      dashJustified: false,
      extensions: [new PathStyleExtension({highPrecisionDash: true})],
  
    }),

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
      visible: chapterData[counter].trips,
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
      visible: chapterData[counter].TripsDarien,
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
      visible: chapterData[counter].TripsDarien,
      parameters: {
        depthTest: false
      }
    }),
    
new TextLayer({
    id: 'text-layer',
    data: './data/layers/nat.json',
    fontFamily: 'Arial',
    pickable: false,
    getPosition: d => [d.lon1, d.lat1],
    getText: d => d.Nationality,
    getSize: 10,
    getColor: [255, 255, 255],
    getAngle: 0, 
    getPixelOffset: [-5,-1],
    fontWeight: 'bold',
    getTextAnchor: 'end',
    getAlignmentBaseline: 'bottom',
    visible: chapterData[counter].Countries

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
        getHeight: .2,
        getWidth: 1,   
        timeRange,
        getSourceColor: [255, 255, 0],
        getTargetColor: [255, 255, 255],
        visible: chapterData[counter].AnimatedArcs
      })
  );

  return (
    <div>
    <DeckGL
      layers={[layers,dataLayers]}
      // layers={[layers]}
      effects={theme.effects}
      views={new GlobeView()}
      initialViewState={initialViewState}
      controller={true}
    >
    {endTime && (
      <RangeInput
          activate={true}
          min={50}
          max={endTime}
          value={currentTime}
          animationSpeed={TIME_WINDOW * 0.2}
//           formatLabel={formatLabel}
          onChange={setCurrentTime}
          
        />)}
      {/* <StaticMap reuseMaps mapStyle={mapStyle} preventStyleDiffing={true} /> */}
    </DeckGL>
      <div id='narrativeImg'></div>
      <div id='narrativeContainer'>
        <span id='narrativeText' >DISTANCE UNKNOWN</span><span id='flare'>|</span>
        <div id="subText" >RISKS AND OPPORTUNITIES OF MIGRATION IN THE AMERICAS</div>
        <div id="description"></div>
      </div>
      <div className="btnContainer" id='btnContainer'>
        <div className='btn' onClick={prevChapter}>◀</div>
        <div className='btn' onClick={nextChapter}>▶</div>
        
      </div>
    </div>
  );
}

export function renderToDOM(container) {
  render(<App />, container);


  async function loadData(dates) {
    const data = [];
    for (const date of dates) {
      const url = `${DATA_GLOBE}/${date}.csv`;
      const flights = await load(url, CSVLoader, {csv: {skipEmptyLines: true}});
      data.push({flights, date});
      render(<App data={data} />, container);
    }
  }
  

  loadData([
    '2020-01-14'
  ]);}