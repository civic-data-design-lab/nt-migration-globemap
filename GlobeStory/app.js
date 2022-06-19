/* global window */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { render } from 'react-dom';
import { StaticMap } from 'react-map-gl';
import { AmbientLight, PointLight, LightingEffect, Layer } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import { PolygonLayer, TextLayer, PathLayer, GeoJsonLayer, IconLayer, BitmapLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { _GlobeView as GlobeView } from '@deck.gl/core';
// import {BitmapLayer} from '@deck.gl/layers';
import { FlyToInterpolator, LinearInterpolator, ScatterplotLayer } from 'deck.gl';
import AnimatedArcLayer from './animated-arc-layer';
import { sliceData, getDate } from './slice-data';
import { load } from '@loaders.gl/core';
import { CSVLoader } from '@loaders.gl/csv';
import RangeInput from './range-input';
import { PathStyleExtension } from '@deck.gl/extensions';

// chapters
const chapterData = require('./mapChapters.json');
var AFK = true
var afkTimer = 0
// set the AFK timeout
const idleLimit = 30000;
var startMapIndex = false
var _reset = false
var arrowInit = false
var arrowTimer = 0
var autoTransBool = false
var autoTransTimer = 0
var ramp = false
var rampVal = 0;
var opacityTransitionSpeed = 10
var fadeTransDuration = 1500;

// Source data CSV
const DATA_URL = {
  // BUILDINGS:
  // 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  TRIPS: './data/PANAM-ULTIMATE.json', // eslint-disable-line
  PATH_COST: './data/PANAM-NEW.json',
  HIGHWAY: './data/Highway.json',
  SPRITE: "./svg/spriteSheet.png",
  SPRITE_MAP: "./svg/sprite.json"
};

const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, mask: true }
};

const ICON_MAPPING2 = require('./svg/sprite.json')
// const ICON_MAPPING2 = require('./svg/sprite.json')
// console.log(ICON_MAPPING2).frames[0]

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

const lightingEffect = new LightingEffect({ ambientLight, pointLight });

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

// FUNCTIONS
// function to enable local JS
function toggleArrows(jsonSource, index, bool) {

  const dArr = document.getElementById('darienArrows')
  const pArr = document.getElementById('panamaArrows')
  const gArr = document.getElementById('guatmexArrows')
  const place = ['darien', 'panama', 'guatmex']

  const elements = [dArr, pArr, gArr]

  const select = jsonSource[index]
  const timer = select.duration
  const zooms = [select.TripsDarien, select.TripsPanama, select.TripsGuatMex]

  for (let i = 0; i < zooms.length; i++) {
    const shape = elements[i].getElementsByClassName(place[i])

    if (zooms[i] != 1) {
      for (let v = 0; v < shape.length; v++) {
        // console.log(shape)
        shape[v].style.opacity = 0
      }

      if (bool == true) {
        setTimeout(() => {
          elements[i].style.display = 'none'
        }, 0);
      }


    } else {
      for (let v = 0; v < shape.length; v++) {
        shape[v].style.opacity = 1

      }

      if (bool == true) {
        setTimeout(() => {
          if (index == 0) {
            elements[i].style.pointerEvents = 'none'
          }
          else {
            elements[i].style.pointerEvents = 'auto'
          }
          return elements[i].style.display = 'inherit'

        }, 0);

      }


    }
  }

}


export default function App({
  // buildings = DATA_URL.BUILDINGS,
  trips = DATA_URL.TRIPS,
  trailLength = 50,
  trailLengthZoom = 100,
  // initialViewState = INITIAL_VIEW_STATE,
  // mapStyle = MAP_STYLE,
  theme = DEFAULT_THEME,
  loopLength = 21000, // unit corresponds to the timestamp in source data
  animationSpeed = 1.5,
  data,
}) {
  
  const [opacityHook, setOpacityHook] = useState(0);


  if (ramp == true){
    // rampVal++
    // setTimeout(() => {
    //   setOpacityHook(rampVal/(100*opacityTransitionSpeed))
    //   console.log(rampVal/(100*opacityTransitionSpeed))
    //   if(rampVal/(100*opacityTransitionSpeed) >= 1){
    //     ramp = false
    //   }
    // }, 250);

  
  }

 
  // if(ramp == true){

  //   if(rampVal<=1){
  //     rampVal++
  //     const newO = rampVal/100
  //     console.log(new0)
  //     setOpacityHook(newO)
  //   }
  //   else{
  //     ramp = false
  //   }

  // }

  // get start state
  if (startMapIndex == false) {
    for (let i = 0; i < chapterData.length; i++) {
      if (chapterData[i].name != 'NaN' && startMapIndex == false) {
        startMapIndex = i
      }

    }
  }

  const [isPlaying, setIsPlaying] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const groups = useMemo(() => sliceData(data), [data]);
  const endTime = useMemo(() => {
    return groups.reduce((max, group) => Math.max(max, group.endTime), 0);
  }, [groups]);

  const timeRange = [currentTime, currentTime + TIME_WINDOW];

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
      transitionEasing: t => (0.76 * t, 0 * t, 0.24 * t, 1 * t),
    })

  }, []);

  if (AFK == false) {
    afkTimer++
    if (afkTimer > idleLimit) {
      setTimeout(timeoutReset, 0)
      AFK = true
    }
  }

  // text type function
  function typeWriter(speed, source, sourceLen, target, base) {
    if (base < sourceLen) {
      target.innerHTML += source.charAt(base);
      base++;
      setTimeout(typeWriter, speed, speed, source, sourceLen, target, base);
    }
  }

  if (arrowInit == true) {
    arrowTimer++
    if (arrowTimer > 100) {
      arrowInit = false
      arrowTimer = 0
      toggleArrows(chapterData, counter, true)

    }
  }

  if (autoTransBool != 0) {
    autoTransTimer++

    if (autoTransTimer > chapterData[counter].autoTransition) {
      counter + autoTransBool
      autoTransBool = 0
      { nextChapter() }
    }
  }

  var autoTriggerFire;




  // NAVIGATION FORWARD
  var nextChapter = useCallback(() => {
    var transferCounter = counter //used to hold initial counter variable before flipping from i=0 > -1
    AFK = false
    afkTimer = 0
    counter++

    ramp = true


    // enable arc animation
    if (counter == 2) {
      setIsPlaying(true)
    }

    if(counter <= 3){
      document.getElementsByClassName('halo')[0].style.display=''
    }



    if(counter > 3){
      document.getElementsByClassName('halo')[0].style.display='none'
    }


    // reset arc animation
    if (counter >= chapterData.length) {
      // RESET STORY AFTER COMPLETING NARRATIVE
      setIsPlaying(false)
      _reset = true

      setInitialViewState({
        latitude: chapterData[startMapIndex].latitude,
        longitude: chapterData[startMapIndex].longitude,
        zoom: chapterData[startMapIndex].zoom,
        transitionDuration: chapterData[startMapIndex].duration,
        transitionInterpolator: transition,
        transitionEasing: t => (0.76 * t, 0 * t, 0.24 * t, 1 * t),
      })
      counter = 0

    }

    // CHANGE CAMERA VIEW THROUGH STORY
    if (chapterData[counter].name != 'NaN') {
      setInitialViewState({
        latitude: chapterData[counter].latitude,
        longitude: chapterData[counter].longitude,
        zoom: chapterData[counter].zoom,
        transitionDuration: chapterData[counter].duration,
        transitionInterpolator: transition,
        transitionEasing: t => (0.76 * t, 0 * t, 0.24 * t, 1 * t),
      })
    }

    //toggle Arrows
    arrowInit = true;
    toggleArrows(chapterData, counter, false);

    //toggle narrativeChapters
    const header = document.getElementById('narrativeText')
    const _flare = document.getElementById('flare')
    const sText = document.getElementById('subText')
    const dText = document.getElementById('description')
    const narImg = document.getElementById('narrativeImg')
    narImg.style.backgroundImage = 'url(' + chapterData[counter].imageUrl + ')'


    if (chapterData[counter].header == "") {
      _flare.innerHTML = ""
    }
    else {
      _flare.innerHTML = "|"
    }

    var typeSpeed = 100;
    header.innerHTML = ""
    sText.innerHTML = ""
    var headText = chapterData[counter].header
    var headTextLen = chapterData[counter].header.length
    var h2Text = chapterData[counter].subText
    var h2TextLen = chapterData[counter].subText.length

    typeWriter(typeSpeed, headText, headTextLen, header, -1)
    typeWriter(typeSpeed, h2Text, h2TextLen, sText, -1)

    dText.innerHTML = chapterData[counter].desc

    if (autoTriggerFire != null) {
      clearTimeout(autoTriggerFire)
    }

    if (chapterData[counter].autoTransition != "") {
      autoTriggerFire = setTimeout(() => { nextChapter() }, chapterData[counter].duration + chapterData[counter].autoTransition)
    }

    // ACTIVATE SVG OVERLAY
    var svgNarrative = document.getElementsByClassName("narrativeBox")

    if (chapterData[counter].svgOverlay > 0) {
      let searchIndex = chapterData[counter].svgOverlay
      var selectBox = svgNarrative[searchIndex-1]
      
      selectBox.style.display = "inherit"
      setTimeout(() => { selectBox.style.opacity = 1    
      }, chapterData[counter].duration);
     
    }

    // SVG TOGGLE
    if (chapterData[counter].svgOverlay == "") {
      let searchIndex = chapterData[transferCounter].svgOverlay

      if(svgNarrative[searchIndex-1]!=null){ //subtract 1 to consider index starts at 0 while list starts at 1
        var selectBox = svgNarrative[searchIndex-1]
        selectBox.style.opacity = 0   
  
        setTimeout(() => {
          selectBox.style.display = "none"
        }, 1000);        
      }
        
    }

  }

    , []);


  // NAVIGATION FORWARD
  var prevChapter = useCallback(() => {
    var transferCounter = counter //used to hold initial counter variable before flipping from i=0 > -1
    AFK = false
    afkTimer = 0
    counter--;

    // disable arc animation
    if (counter < 2) {
      setIsPlaying(false)
      _reset = true
    }


    // flip counters
    if (counter < 0) {
      counter = chapterData.length - 1
    }

    // CHANGE CAMERA VIEW THROUGH STORY
    if (chapterData[counter].name != 'NaN') {
      setInitialViewState({
        latitude: chapterData[counter].latitude,
        longitude: chapterData[counter].longitude,
        zoom: chapterData[counter].zoom,
        transitionDuration: chapterData[counter].duration,
        transitionInterpolator: transition,
        transitionEasing: t => (0.76 * t, 0 * t, 0.24 * t, 1 * t),
      })
    }

    arrowInit = true
    toggleArrows(chapterData, counter, false)

    //toggle narrativeChapters
    const header = document.getElementById('narrativeText')
    const _flare = document.getElementById('flare')
    const sText = document.getElementById('subText')
    const dText = document.getElementById('description')
    const narImg = document.getElementById('narrativeImg')
    narImg.style.backgroundImage = 'url(' + chapterData[counter].imageUrl + ')'


    if (chapterData[counter].header == "") {
      _flare.innerHTML = ""
    }
    else {
      _flare.innerHTML = "|"
    }

    var typeSpeed = 100;
    header.innerHTML = ""
    sText.innerHTML = ""
    var headText = chapterData[counter].header
    var headTextLen = chapterData[counter].header.length
    var h2Text = chapterData[counter].subText
    var h2TextLen = chapterData[counter].subText.length

    typeWriter(typeSpeed, headText, headTextLen, header, -1)
    typeWriter(typeSpeed, h2Text, h2TextLen, sText, -1)

    dText.innerHTML = chapterData[counter].desc


    if (autoTriggerFire != null) {
      clearTimeout(autoTriggerFire)
    }

    if (chapterData[counter].autoTransition != "") {
      autoTriggerFire = setTimeout(() => { prevChapter() }, chapterData[counter].duration + chapterData[counter].autoTransition)
    }

    
    // ACTIVATE SVG OVERLAY
    var svgNarrative = document.getElementsByClassName("narrativeBox")

    if (chapterData[counter].svgOverlay > 0) {
      let searchIndex = chapterData[counter].svgOverlay
      var selectBox = svgNarrative[searchIndex-1]
      
      selectBox.style.display = "inherit"
      setTimeout(() => { selectBox.style.opacity = 1    
      }, chapterData[counter].duration);
     
    }

    // SVG TOGGLE
    if (chapterData[counter].svgOverlay == "") {
      let searchIndex = chapterData[transferCounter].svgOverlay

      if(svgNarrative[searchIndex+1]!=null){
        var selectBox = svgNarrative[searchIndex-1]
        selectBox.style.opacity = 0   
  
        setTimeout(() => {
          selectBox.style.display = "none"
        }, 1000);        
      }
        
    }



  }, []);


  const layers = [

    new BitmapLayer({
      id: 'BitmapLayer',
      image: './basemaps/CAD/WorldTilesetBlack.jpg',
      bounds: [[-180, -90, -35000], [-180, 90, -35000], [180, 90, -35000], [180, -90, -35000]],
      // visible: chapterData[counter].worldTile,
      opacity: chapterData[counter].worldTile,
      transitions:{
      opacity: {
        duration: 2000,
        enter: value => [value[0], value[1], value[2], 0] // fade in
        },
      }
      // opacity: opacityHook
    }),

    new BitmapLayer({
      id: 'saBitmap',
      image: './basemaps/CAD/SATilesetBlack.jpg',
      bounds: [[-125.704377, -58.123691], [-125.704377, 37.286326], [-30.290414, 37.286326], [-30.290414, -58.123691]],
      // visible: chapterData[counter].SaTile,
      opacity: chapterData[counter].SaTile,
      transitions:{
        opacity: {
          duration: 2000,
          enter: value => [value[0], value[1], value[2], 0] // fade in
          },
        }
    }),

    new BitmapLayer({
      id: 'panamaBitmap',
      image: './basemaps/BASEMAP-PANAMA - Copy.jpg',
      bounds: [[-84.071066, 6.204412], [-84.071066, 10.942168], [-75.646334, 10.942168], [-75.646334, 6.204412]],
      // visible: chapterData[counter].PanamaImg,
      opacity: chapterData[counter].PanamaImg,
      parameters: {
        depthTest: false
      },
      transitions:{
        opacity: {
          duration: fadeTransDuration,
          enter: value => [value[0], value[1], value[2], 0] // fade in
          },
        }
    }),

    new BitmapLayer({
      id: 'darienBitmap',
      image: './basemaps/BASEMAP-DARIEN - Copy.jpg',
      bounds: [[-77.664696, 8.078343], [-77.664696, 8.789628], [-76.383324, 8.789628], [-76.383324, 8.078343]],
      // visible: chapterData[counter].DarienImg,
      opacity: chapterData[counter].DarienImg,
      parameters: {
        depthTest: false
      },
      transitions:{
        opacity: {
          duration: fadeTransDuration,
          enter: value => [value[0], value[1], value[2], 0] // fade in
          },
        }
    }),

    new BitmapLayer({
      id: 'GuatMexBitmap',
      image: './basemaps/BASEMAP-GUATMAP - COPY.jpg',
      bounds: [[-92.168185, 14.663715], [-92.168185, 14.692483], [-92.116985, 14.692483], [-92.116985, 14.663715]],
      // visible: chapterData[counter].GuatMexImg,
      opacity: chapterData[counter].GuatMexImg,
      parameters: {
        depthTest: false
      },
      transitions:{
        opacity: {
          duration: fadeTransDuration,
          enter: value => [value[0], value[1], value[2], 0] // fade in
          },
        }
    }),

    new PathLayer({
      id: 'accumulatedCost',
      data: DATA_URL.PATH_COST,
      widthScale: 2,
      widthMinPixels: 2,
      getPath: d => d.path,
      getColor: [255, 255, 255, 255],
      getDashArray: [4, 5],
      dashJustified: false,
      extensions: [new PathStyleExtension({ highPrecisionDash: true })],
      // visible: chapterData[counter].PanamPath,
      opacity: chapterData[counter].PanamPath,
      transitions:{
        opacity: {
          duration: fadeTransDuration,
          enter: value => [value[0], value[1], value[2], 0] // fade in
          },
        }

    }),

    new PathLayer({
      id: 'Highway',
      data: DATA_URL.HIGHWAY,
      widthScale: 3,
      widthMinPixels: 2,
      getPath: d => d.path,
      getColor: [155, 155, 155, 255],
      // getDashArray: [4, 5],
      // dashJustified: false,
      // extensions: [new PathStyleExtension({highPrecisionDash: true})],
      // visible: chapterData[counter].Highway,
      opacity: chapterData[counter].Highway,
      transitions:{
        opacity: {
          duration: fadeTransDuration,
          enter: value => [value[0], value[1], value[2], 0] // fade in
          },
        }

    }),

    new TripsLayer({
      id: 'trips',
      data: trips,
      getPath: d => d.path,
      getTimestamps: d => d.timestamps,
      getColor: d => (d.vendor === 0 ? theme.trailColor0 : theme.trailColor1),
      opacity: 1,
      widthMinPixels: 5,
      // widthMaxPixels:3,
      capRounded: true,
      jointRounded: true,
      trailLength,
      currentTime: time,
      shadowEnabled: false,
      fadeTrail: true,
      // visible: chapterData[counter].Trips,
      opacity: chapterData[counter].Trips,
      parameters: {
        depthTest: false
      },
      transitions:{
        opacity: {
          duration: fadeTransDuration,
          enter: value => [value[0], value[1], value[2], 0] // fade in
          },
        }

    }),


    // new IconLayer({
    //   id: 'icon-layer2',
    //   data: DATA_URL.SPRITE_MAP,
    //   pickable: true,
    //   // iconAtlas and iconMapping are required
    //   // getIcon: return a string
    //   iconAtlas: DATA_URL.SPRITE,
    //   iconMapping: ICON_MAPPING2,
    //   getIcon: d => d.frames.frame,
    //   mask: false,
    //   sizeScale: 15,
    //   getPosition: d => d.frames.coords,
    //   getSize: 500,
    //   // getColor: d => [Math.sqrt(d.exits), 140, 0]
    // }),
    
// new IconLayer({
//     id: 'icon-layer',
//     data,
//     pickable: true,
//     // iconAtlas and iconMapping are required
//     // getIcon: return a string
//     iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
//     iconMapping: ICON_MAPPING,
//     getIcon: d => 'marker',

//     sizeScale: 15,
//     getPosition: d => d.coordinates,
//     getSize: d => 5,
//     getColor: d => [Math.sqrt(d.exits), 140, 0]
//   }),

  new TextLayer({
    id: 'text-country',
    data: './data/layers/arrF.json',
    fontFamily: 'SpeziaWide',
    pickable: false,
    getPosition: d => [d.lon1, d.lat1],
    getText: d => d.Nationality.toUpperCase(),
    getSize: 12,
    getColor: [180, 235, 190],
    getAngle: 180, 
    getPixelOffset: [-5,-1],
    fontWeight: 'bold',
    getTextAnchor: 'end',
    getAlignmentBaseline: 'bottom',
    billboard: false,
    // visible: chapterData[counter].Countries,
    opacity: chapterData[counter].Countries,
    transitions:{
      opacity: {
        duration: fadeTransDuration,
        enter: value => [value[0], value[1], value[2], 0] // fade in
        },
      }

  }),
// 
//   new TextLayer({
//     id: 'text-layer-cost',
//     data: './data/layers/labels_cost_final.json',
//     fontFamily: 'SpeziaWide',
//     pickable: false,
//     getPosition: d => [d.x, d.y],
//     getText: d => d.Accum_cost,
//     getSize: 10,
//     sizeMinPixels: 10,
//     sizeMaxPixels: 10,
//     getColor: [180, 235, 190],
// //     getAngle: 180, 
//     getPixelOffset: [-5,-1],
//     fontWeight: 'bold',
//     getTextAnchor: 'end',
//     getAlignmentBaseline: 'bottom',
//     billboard: true,
//     visible: chapterData[counter].PanamPath,
//     parameters: {
//       depthTest: false
//     }
// 
//   }),
  
//     new TextLayer({
//     id: 'text-layer-label',
//     data: './data/layers/labels_cost_final.json',
//     fontFamily: 'SpeziaWide',
//     pickable: false,
//     getPosition: d => [d.x, d.y],
//     getText: d => d.final_lab,
//     getSize: 10,
//     sizeMinPixels: 10,
//     sizeMaxPixels: 10,
//     getColor: [180, 235, 190],
// //     getAngle: 180, 
//     getPixelOffset: [-5,-10],
//     fontWeight: 'bold',
//     getTextAnchor: 'end',
//     getAlignmentBaseline: 'bottom',
//     billboard: true,
//     visible: chapterData[counter].PanamPath,
//     parameters: {
//       depthTest: false
//     }

//     }),

    new TextLayer({
      id: 'text-layer-cost',
      data: './data/layers/labels_cost_final.json',
      fontFamily: 'SpeziaWide',
      pickable: false,
      getPosition: d => [d.x, d.y],
      getText: d => d.Accum_cost,
      getSize: 10,
      getColor: [180, 235, 190],
      //     getAngle: 180, 
      getPixelOffset: [-5, -1],
      fontWeight: 'bold',
      getTextAnchor: 'end',
      getAlignmentBaseline: 'bottom',
      billboard: true,
      sizeMaxPixels: 1,
      // visible: chapterData[counter].PanamPath,
      opacity: chapterData[counter].PanamPath,
      parameters: {
        depthTest: false
      },
      transitions:{
        opacity: {
          duration: fadeTransDuration,
          enter: value => [value[0], value[1], value[2], 0] // fade in
          },
        }

    }),

    new TextLayer({
      id: 'text-layer-label',
      data: './data/layers/labels_cost_final.json',
      fontFamily: 'SpeziaWide',
      pickable: false,
      getPosition: d => [d.x, d.y],
      getText: d => d.final_lab,
      getSize: 10,
      getColor: [180, 235, 190],
      //     getAngle: 180, 
      getPixelOffset: [-5, -10],
      fontWeight: 'bold',
      getTextAnchor: 'end',
      getAlignmentBaseline: 'bottom',
      billboard: true,
      sizeMaxPixels: 1,
      // visible: chapterData[counter].PanamPath,
      opacity: chapterData[counter].PanamPath,
      parameters: {
        depthTest: false
      },
      transitions:{
        opacity: {
          duration: fadeTransDuration,
          enter: value => [value[0], value[1], value[2], 0] // fade in
          },
      }

    }),
  ]

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
        getWidth: 2,
        timeRange,
        getTargetColor: [215, 215, 0, [25]],
        getSourceColor: [215, 215, 0, [25]],
        // visible: chapterData[counter].AnimatedArcs,
        opacity: chapterData[counter].AnimatedArcs,
        // transitions:{
        //   opacity: {
        //     duration: fadeTransDuration,
        //     enter: value => [value[0], value[1], value[2], 0] // fade in
        //     },
        // }
      }),
  
  )

  return (
    <div>
      <div className='halo back'>
      </div>
      <DeckGL
        layers={[layers, dataLayers]}
        // layers={[layers]}
        effects={theme.effects}
        views={new GlobeView()}
        initialViewState={initialViewState}
        controller={true}
      >
        {endTime && (
          <RangeInput
            activate={true}
            min={0}
            max={endTime}
            value={currentTime}
            animationSpeed={TIME_WINDOW * 0.2}
            //           formatLabel={formatLabel}
            onChange={setCurrentTime}
            isPlaying={isPlaying}
            reset={_reset}

          />)}
        {/* <StaticMap reuseMaps mapStyle={mapStyle} preventStyleDiffing={true} /> */}
      </DeckGL>
      {/* <div className="halo front" style={width=20 +'vh'}></div> */}
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
      const flights = await load(url, CSVLoader, { csv: { skipEmptyLines: true } });
      data.push({ flights, date });
      render(<App data={data} />, container);
    }
  }


  loadData([
    '2020-01-14'
  ]);
}