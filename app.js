/* global window */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { render } from "react-dom";
import { AmbientLight, PointLight, LightingEffect } from "@deck.gl/core";
import DeckGL from "@deck.gl/react";
import {
  PolygonLayer,
  TextLayer,
  PathLayer,
  GeoJsonLayer,
  IconLayer,
  BitmapLayer,
} from "@deck.gl/layers";
import { TripsLayer } from "@deck.gl/geo-layers";
import { _GlobeView as GlobeView } from "@deck.gl/core";
// import {BitmapLayer} from '@deck.gl/layers';
import {
  FlyToInterpolator,
  LinearInterpolator,
  ScatterplotLayer,
  Tesselator,
} from "deck.gl";
import AnimatedArcLayer from "./scripts/animated-arc-layer";
import { sliceData } from "./scripts/slice-data";
import { load } from "@loaders.gl/core";
import { CSVLoader } from "@loaders.gl/csv";
import RangeInput from "./scripts/range-input";
import { PathStyleExtension } from "@deck.gl/extensions";

// Source data CSV
const DATA_URL = {
  // BUILDINGS:
  // 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  TRIPS: "./pages/data/PANAM-ULTIMATE.json", // eslint-disable-line
  PATH_COST: "./pages/data/PANAM-NEW.json",
  HIGHWAY: "./pages/data/Highway.json",
  SPRITE: "./pages/svg/spriteSheet.png",
  SPRITE_MAP: "./pages/svg/sprite.json",
};

// GLOBAL VARIABLES  //

// chapters
const chapterData = require("./pages/mapChapters.json");
let counter = 0;
let startMapIndex = false;

// controls
let globalButtonTimeout = false; //hide button after clicking
let autoTriggerFire; //automate steps between layers
let startIndicator;
let startPhrase = '"TOUCH TO START"';
// let progressPhrase = '"BACK"     —    "NEXT"'

// AFK Variables
let AFK = false;
let wasAFK = false;
const idleLimit = 180000;
let afkTimeout;

// Animation Control
let animArcIndex = false;
let _reset = false; //reset animated arc layer

// animated arrows layer
let arrowInit = false;
let arrowTimer = 0;

// Deck GL layer fade-ins
let fadeTransDuration = 1500;

//DECK GL Props
const DATA_GLOBE = "./pages/data";
const transition = new FlyToInterpolator();
const TIME_WINDOW = 50; // 15 minutes
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0,
});
const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000],
});
const lightingEffect = new LightingEffect({ ambientLight, pointLight });
const material = {
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70],
};
const DEFAULT_THEME = {
  buildingColor: [74, 80, 87],
  trailColor0: [215, 215, 0],
  trailColor1: [255, 255, 255],
  material,
  effects: [lightingEffect],
  // effects: [postProcessEffect]
};

// FUNCTIONS
// function to enable local JS
function toggleArrows(jsonSource, index, bool) {
  const dArr = document.getElementById("darienArrows");
  const pArr = document.getElementById("panamaArrows");
  const gArr = document.getElementById("guatmexArrows");
  const place = ["darien", "panama", "guatmex"];

  const elements = [dArr, pArr, gArr];

  const select = jsonSource[index];
  const timer = select.duration;
  const zooms = [select.TripsDarien, select.TripsPanama, select.TripsGuatMex];

  for (let i = 0; i < zooms.length; i++) {
    const shape = elements[i].getElementsByClassName(place[i]);

    if (zooms[i] != 1) {
      for (let v = 0; v < shape.length; v++) {
        shape[v].style.opacity = 0;
      }

      if (bool == true) {
        setTimeout(() => {
          elements[i].style.display = "none";
        }, 0);
      }
    } else {
      for (let v = 0; v < shape.length; v++) {
        shape[v].style.opacity = 1;
      }

      if (bool == true) {
        setTimeout(() => {
          if (index == 0) {
            elements[i].style.pointerEvents = "none";
          } else {
            elements[i].style.pointerEvents = "auto";
          }
          return (elements[i].style.display = "inherit");
        }, 0);
      }
    }
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

export default function App({
  trips = DATA_URL.TRIPS,
  trailLength = 50,
  theme = DEFAULT_THEME,
  loopLength = 21000, // unit corresponds to the timestamp in source data
  animationSpeed = 1.5,
  data,
}) {
  // console log data on load
  useEffect(() => {
    console.log("DATA: ", data);
  }, [counter]);

  // write data to a json file

  // Get Start Index for Initial View State (Depreciated)
  if (startMapIndex == false) {
    for (let i = 0; i < chapterData.length; i++) {
      if (chapterData[i].name != "NaN" && startMapIndex == false) {
        startMapIndex = i;
      }
    }
  }

  // Get Start Index for Animated Arc Layers
  if (animArcIndex == false) {
    for (let i = 0; i < chapterData.length; i++) {
      if (chapterData[i].AnimatedArcs == 1 && animArcIndex == false) {
        animArcIndex = i;
      }
    }
  }

  // React Hooks
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const groups = useMemo(() => sliceData(data), [data]);
  const endTime = useMemo(() => {
    return groups.reduce((max, group) => Math.max(max, group.endTime), 0);
  }, [groups]);
  const timeRange = [currentTime, currentTime + TIME_WINDOW];

  // Set original camera location
  const [initialViewState, setInitialViewState] = useState({
    latitude: chapterData[startMapIndex].latitude,
    longitude: chapterData[startMapIndex].longitude,
    zoom: chapterData[startMapIndex].zoom,
  });

  const [time, setTime] = useState(0);
  const [animation] = useState({});
  const animate = () => {
    setTime((t) => (t + animationSpeed) % loopLength);
    animation.id = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    animation.id = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animation.id);
  }, [animation]);

  // Toggle Arrows
  if (arrowInit == true) {
    arrowTimer++;
    if (arrowTimer > 100) {
      arrowInit = false;
      arrowTimer = 0;
      toggleArrows(chapterData, counter, true);
    }
  }

  // NAVIGATION CONTROLLER
  let goForward = function userAdvance() {
    if (AFK) {
      AFK = false;
      wasAFK = counter;
      counter = chapterData.length;
      globalButtonTimeout = false;
    }
    nextChapter();
  };

  let goBackward = function userRetreat() {
    globalButtonTimeout = false;
    prevChapter();
  };
  let nextChapter = useCallback(() => {
    //check to see if animations are already running
    if (!globalButtonTimeout) {
      globalButtonTimeout = true;

      let transferCounter = counter; //used to hold initial counter variable before flipping from i=0 > -1
      counter++; //iterate through chapters

      // reset arc animation
      if (counter >= chapterData.length) {
        // RESET STORY AFTER COMPLETING NARRATIVE
        setIsPlaying(false);
        _reset = true;
        counter = 0;
      }

      //hide buttons on click
      let navBtns = document.getElementsByClassName("btn");
      for (let btn = 0; btn < navBtns.length; btn++) {
        navBtns[btn].style.opacity = 0;
        navBtns[btn].style.pointerEvents = "none";
      }

      setTimeout(() => {
        if (!AFK) {
          let navBtns = document.getElementsByClassName("btn");
          for (let btn = 0; btn < navBtns.length; btn++) {
            if (chapterData[counter].autoTransition == "") {
              navBtns[btn].style.opacity = 1;
              navBtns[btn].style.pointerEvents = "";
            }
          }
        }
      }, chapterData[counter].duration);

      //Disable Button Appearance
      if (AFK == false) {
        let infoNav = document.getElementById("info");
        const navContainer = document.getElementById("btnContainer");

        infoNav.style.opacity = 0;
        infoNav.style.pointerEvents = "none";
        // navContainer.style.gridTemplateColumns = 'auto auto'
      }

      if (AFK == true) {
        let infoNav = document.getElementById("info");
        const navContainer = document.getElementById("btnContainer");
        infoNav.style.opacity = 1;
        infoNav.style.pointerEvents = "";
      }

      // check if idle
      if (AFK == false) {
        if (afkTimeout != null) {
          clearTimeout(afkTimeout);
        }

        //restart idle timer
        afkTimeout = setTimeout(() => {
          AFK = true;
          nextChapter();
        }, idleLimit);
      }

      if (AFK == true) {
        setTimeout(() => {
          if (counter == chapterData.length - 1) {
            counter = 0;
          }
          nextChapter();
        }, chapterData[counter].duration + chapterData[counter].IdleDuration);
      }

      if (counter < animArcIndex) {
        setIsPlaying(false);
        _reset = true;
      }

      //index to start animated arcs
      if (counter == animArcIndex) {
        //Enable arc animation
        setIsPlaying(true);
      }

      if (counter <= 3) {
        //Enable Halo
        document.getElementsByClassName("halo")[0].style.display = "";
      }

      if (counter > 3) {
        //Disable Halo
        document.getElementsByClassName("halo")[0].style.display = "none";
      }

      // CHANGE CAMERA VIEW THROUGH STORY
      if (chapterData[counter].name != "NaN") {
        // console.log(counter + "IVState")
        setInitialViewState({
          latitude: chapterData[counter].latitude,
          longitude: chapterData[counter].longitude,
          zoom: chapterData[counter].zoom,
          transitionDuration: chapterData[counter].duration,
          transitionInterpolator: transition,
          transitionEasing: (t) => (0.76 * t, 0 * t, 0.24 * t, 1 * t),
        });
      }

      //Toggle Arrows
      arrowInit = true;
      toggleArrows(chapterData, counter, false);

      //Toggle narrativeChapters
      if (counter != null) {
        //Added this if statement for code collapsing
        const header = document.getElementById("narrativeText");
        const _flare = document.getElementById("flare");
        const sText = document.getElementById("subText");
        const dText = document.getElementById("description");

        if (chapterData[counter].header == "") {
          _flare.innerHTML = "";
        } else {
          _flare.innerHTML = "|";
        }

        var typeSpeed = 100;
        header.innerHTML = "";
        sText.innerHTML = "";
        var headText = chapterData[counter].header;
        var headTextLen = chapterData[counter].header.length;
        var h2Text = chapterData[counter].subText;
        var h2TextLen = chapterData[counter].subText.length;

        typeWriter(typeSpeed, headText, headTextLen, header, -1);
        typeWriter(typeSpeed, h2Text, h2TextLen, sText, -1);

        dText.innerHTML = chapterData[counter].desc;
      }

      //Toggle narrative images
      const narImg = document.getElementById("narrativeImg");
      narImg.style.backgroundImage =
        "url(" + chapterData[counter].imageUrl + ")";

      // cancel any automatic transitions if the user clicks before the animation executes (Partially depreciated)
      if (autoTriggerFire != null) {
        clearTimeout(autoTriggerFire);
      }

      // Set automatic transition but only when not afk
      if (chapterData[counter].autoTransition != "" && !AFK) {
        autoTriggerFire = setTimeout(() => {
          nextChapter();
        }, chapterData[counter].duration + chapterData[counter].autoTransition);
      }

      // ACTIVATE SVG OVERLAY
      var svgNarrative = document.getElementsByClassName("narrativeBox");
      if (chapterData[counter].svgOverlay > 0) {
        let searchIndex = chapterData[counter].svgOverlay;
        var selectBox = svgNarrative[searchIndex - 1];

        selectBox.style.display = "inherit";
        setTimeout(() => {
          selectBox.style.opacity = 1;
        }, chapterData[counter].duration);
      }

      // SVG OVERLAY OFF
      if (chapterData[counter].svgOverlay == null) {
        let indexWrap = transferCounter;
        if (wasAFK != false) {
          indexWrap = wasAFK;
        }

        let searchIndex = chapterData[indexWrap].svgOverlay;

        if (svgNarrative[searchIndex - 1] != null) {
          //subtract 1 to consider index starts at 0 while list starts at 1
          var selectBox = svgNarrative[searchIndex - 1];
          selectBox.style.opacity = 0;

          setTimeout(() => {
            selectBox.style.display = "none";
          }, 1000);
        }
      }

      //Toggle through narrative text
      const narSvgText = document.getElementsByClassName("narrativeTextBox");
      for (let item = 0; item < narSvgText.length; item++) {
        let index = narSvgText[item].id;

        narSvgText[item].style.opacity = 0;
        narSvgText[item].style.display = "inherit";
        if (counter == index) {
          setTimeout(() => {
            narSvgText[item].style.opacity = 1;
          }, 500);
        } else {
          narSvgText[item].style.opacity = 0;

          setTimeout(() => {
            narSvgText[item].style.display = "none";
          }, 500);
        }
      }

      globalButtonTimeout = false;
      wasAFK = false;
    }
  }, []);

  // NAVIGATION FORWARD
  let prevChapter = useCallback(() => {
    //check to see if animations are already running
    if (!globalButtonTimeout) {
      globalButtonTimeout = true;

      let transferCounter = counter; //used to hold initial counter variable before flipping from i=0 > -1
      counter--;

      // flip counters
      if (counter < 0) {
        counter = chapterData.length - 1;
      }

      //hide buttons on click
      let navBtns = document.getElementsByClassName("btn");
      for (let btn = 0; btn < navBtns.length; btn++) {
        navBtns[btn].style.opacity = 0;
        navBtns[btn].style.pointerEvents = "none";
      }

      setTimeout(() => {
        if (!AFK) {
          let navBtns = document.getElementsByClassName("btn");

          for (let btn = 0; btn < navBtns.length; btn++) {
            if (chapterData[counter].autoTransition == "") {
              navBtns[btn].style.opacity = 1;
              navBtns[btn].style.pointerEvents = "";
            }
          }
        }
      }, chapterData[counter].duration);

      // Reset Arc animation
      if (counter <= animArcIndex - 1) {
        setIsPlaying(false);
        _reset = true;
      }

      if (AFK == true) {
        let infoNav = document.getElementById("info");
        // const navContainer = document.getElementById('btnContainer')
        infoNav.style.opacity = 1;
      }

      // check if idle
      if (AFK == false) {
        if (afkTimeout != null) {
          clearTimeout(afkTimeout);
        }

        //restart idle timer
        afkTimeout = setTimeout(() => {
          AFK = true;
          nextChapter();
        }, idleLimit);
      }

      if (AFK == true) {
        setTimeout(() => {
          if (counter == chapterData.length - 1) {
            counter = 0;
          }

          nextChapter();
        }, chapterData[counter].duration + chapterData[counter].IdleDuration);
      }

      //index to start animated arcs
      if (counter == animArcIndex) {
        //Enable arc animation
        setIsPlaying(true);
      }

      if (counter <= 3) {
        //Enable Halo
        document.getElementsByClassName("halo")[0].style.display = "";
      }

      if (counter > 3) {
        //Disable Halo
        document.getElementsByClassName("halo")[0].style.display = "none";
      }

      // CHANGE CAMERA VIEW THROUGH STORY
      if (chapterData[counter].name != "NaN") {
        setInitialViewState({
          latitude: chapterData[counter].latitude,
          longitude: chapterData[counter].longitude,
          zoom: chapterData[counter].zoom,
          transitionDuration: chapterData[transferCounter].duration,
          transitionInterpolator: transition,
          transitionEasing: (t) => (0.76 * t, 0 * t, 0.24 * t, 1 * t),
        });
      }

      //Toggle Arrows
      arrowInit = true;
      toggleArrows(chapterData, counter, false);

      //toggle narrativeChapters
      if (counter != null) {
        const header = document.getElementById("narrativeText");
        const _flare = document.getElementById("flare");
        const sText = document.getElementById("subText");
        const dText = document.getElementById("description");

        if (chapterData[counter].header == "") {
          _flare.innerHTML = "";
        } else {
          _flare.innerHTML = "|";
        }

        var typeSpeed = 50;
        header.innerHTML = "";
        sText.innerHTML = "";
        var headText = chapterData[counter].header;
        var headTextLen = chapterData[counter].header.length;
        var h2Text = chapterData[counter].subText;
        var h2TextLen = chapterData[counter].subText.length;

        typeWriter(typeSpeed, headText, headTextLen, header, -1);
        typeWriter(typeSpeed, h2Text, h2TextLen, sText, -1);

        dText.innerHTML = chapterData[counter].desc;
      }

      // Toggle narrative images
      const narImg = document.getElementById("narrativeImg");
      narImg.style.backgroundImage =
        "url(" + chapterData[counter].imageUrl + ")";

      // cancel any automatic transitions if the user clicks before the animation executes (Partially depreciated)
      if (autoTriggerFire != null) {
        clearTimeout(autoTriggerFire);
      }

      // Set automatic transition but only when not afk
      if (chapterData[counter].autoTransition != "" && !AFK) {
        autoTriggerFire = setTimeout(() => {
          prevChapter();
        }, chapterData[counter].duration + chapterData[counter].autoTransition);
      }

      // ACTIVATE SVG OVERLAY
      const svgNarrative = document.getElementsByClassName("narrativeBox");
      if (chapterData[counter].svgOverlay > 0) {
        let searchIndex = chapterData[counter].svgOverlay;
        var selectBox = svgNarrative[searchIndex - 1];

        selectBox.style.display = "inherit";
        setTimeout(() => {
          selectBox.style.opacity = 1;
        }, chapterData[transferCounter].duration);
      }

      // SVG OVERLAY OFF
      if (chapterData[transferCounter].svgOverlay != null) {
        let searchIndex = chapterData[transferCounter].svgOverlay;

        if (svgNarrative[searchIndex - 1] != null) {
          let selectBox = svgNarrative[searchIndex - 1];
          selectBox.style.opacity = 0;

          setTimeout(() => {
            selectBox.style.display = "none";
          }, 1000);
        }
      }

      //Toggle through narrative text
      const narSvgText = document.getElementsByClassName("narrativeTextBox");
      for (let item = 0; item < narSvgText.length; item++) {
        let index = narSvgText[item].id;

        narSvgText[item].style.opacity = 0;
        narSvgText[item].style.display = "inherit";
        if (counter == index) {
          setTimeout(() => {
            narSvgText[item].style.opacity = 1;
          }, 500);
        } else {
          narSvgText[item].style.opacity = 0;

          setTimeout(() => {
            narSvgText[item].style.display = "none";
          }, 500);
        }
      }

      globalButtonTimeout = false;
    }
  }, []);

  const layers = [
    new BitmapLayer({
      id: "BitmapLayer",
      image: "./pages/basemaps/CAD/WorldTilesetBlack.jpg",
      bounds: [
        [-180, -90, -35000],
        [-180, 90, -35000],
        [180, 90, -35000],
        [180, -90, -35000],
      ],
      opacity: chapterData[counter].worldTile,
      transitions: {
        opacity: {
          duration: 2500,
          enter: (value) => [value[0], value[1], value[2], 0], // fade in
        },
      },
    }),

    new BitmapLayer({
      id: "saBitmap",
      image: "./pages/basemaps/CAD/SATilesetBlack.jpg",
      bounds: [
        [-125.704377, -58.123691],
        [-125.704377, 37.286326],
        [-30.290414, 37.286326],
        [-30.290414, -58.123691],
      ],
      opacity: chapterData[counter].SaTile,
      transitions: {
        opacity: {
          duration: 2000,
          enter: (value) => [value[0], value[1], value[2], 0], // fade in
        },
      },
    }),

    new BitmapLayer({
      id: "panamaBitmap",
      image: "./pages/basemaps/BASEMAP-PANAMA - Copy.jpg",
      bounds: [
        [-84.071066, 6.204412],
        [-84.071066, 10.942168],
        [-75.646334, 10.942168],
        [-75.646334, 6.204412],
      ],
      opacity: chapterData[counter].PanamaImg,
      parameters: {
        depthTest: false,
      },
      transitions: {
        opacity: {
          duration: fadeTransDuration,
          enter: (value) => [value[0], value[1], value[2], 0], // fade in
        },
      },
    }),

    new BitmapLayer({
      id: "darienBitmap",
      image: "./pages/basemaps/BASEMAP-DARIEN - Copy.jpg",
      bounds: [
        [-77.664696, 8.078343],
        [-77.664696, 8.789628],
        [-76.383324, 8.789628],
        [-76.383324, 8.078343],
      ],
      opacity: chapterData[counter].DarienImg,
      parameters: {
        depthTest: false,
      },
      transitions: {
        opacity: {
          duration: fadeTransDuration,
          enter: (value) => [value[0], value[1], value[2], 0], // fade in
        },
      },
    }),

    new BitmapLayer({
      id: "GuatMexBitmap",
      image: "./pages/basemaps/BASEMAP-GUATMAP - COPY.jpg",
      bounds: [
        [-92.168185, 14.663715],
        [-92.168185, 14.692483],
        [-92.116985, 14.692483],
        [-92.116985, 14.663715],
      ],
      opacity: chapterData[counter].GuatMexImg,
      parameters: {
        depthTest: false,
      },
      transitions: {
        opacity: {
          duration: fadeTransDuration,
          enter: (value) => [value[0], value[1], value[2], 0], // fade in
        },
      },
    }),

    new PathLayer({
      id: "accumulatedCost",
      data: DATA_URL.PATH_COST,
      widthScale: 2,
      widthMinPixels: 2,
      getPath: (d) => d.path,
      getColor: [255, 255, 255, 255],
      getDashArray: [4, 5],
      dashJustified: false,
      extensions: [new PathStyleExtension({ highPrecisionDash: true })],
      // visible: chapterData[counter].PanamPath,
      opacity: chapterData[counter].PanamPath,
      transitions: {
        opacity: {
          duration: fadeTransDuration,
          enter: (value) => [value[0], value[1], value[2], 0], // fade in
        },
      },
    }),

    new PathLayer({
      id: "Highway",
      data: DATA_URL.HIGHWAY,
      widthScale: 3,
      widthMinPixels: 2,
      getPath: (d) => d.path,
      getColor: [155, 155, 155, 255],
      // getDashArray: [4, 5],
      // dashJustified: false,
      // extensions: [new PathStyleExtension({highPrecisionDash: true})],
      // visible: chapterData[counter].Highway,
      opacity: chapterData[counter].Highway,
      transitions: {
        opacity: {
          duration: fadeTransDuration,
          enter: (value) => [value[0], value[1], value[2], 0], // fade in
        },
      },
    }),

    new TextLayer({
      id: "text-country",
      data: "./pages/data/layers/arrF.json",
      fontFamily: "SpeziaWide",
      pickable: false,
      getPosition: (d) => [d.lon1, d.lat1],
      getText: (d) => d.Nationality.toUpperCase(),
      getSize: 11,
      getColor: [180, 235, 190],
      getAngle: 180,
      getPixelOffset: [-5, -1],
      fontWeight: "bold",
      getTextAnchor: "end",
      getAlignmentBaseline: "bottom",
      billboard: false,
      // visible: chapterData[counter].Countries,
      opacity: chapterData[counter].Countries,
      transitions: {
        opacity: {
          duration: fadeTransDuration,
          enter: (value) => [value[0], value[1], value[2], 0], // fade in
        },
      },
    }),

    new TextLayer({
      id: "text-layer-cost",
      data: "./pages/data/layers/labels_cost_final.json",
      fontFamily: "SpeziaWide",
      pickable: false,
      getPosition: (d) => [d.x, d.y],
      getText: (d) => d.Accum_cost,
      getSize: 15,
      // sizeMinPixels: 10,
      // sizeMaxPixels: 10,
      getColor: [255, 255, 255],
      getPixelOffset: [-5, -1],
      // getPixelOffset: [d => (-300+d.x),-1],
      fontWeight: "bold",
      getTextAnchor: "end",
      getAlignmentBaseline: "bottom",
      billboard: true,
      // opacity: chapterData[counter].CostPath,
      parameters: {
        depthTest: false,
      },
      opacity: chapterData[counter].CostPath,
      transitions: {
        opacity: {
          duration: fadeTransDuration,
          enter: (value) => [value[0], value[1], value[2], 0], // fade in
        },
      },
    }),

    new TripsLayer({
      id: "trips",
      data: trips,
      getPath: (d) => d.path,
      getTimestamps: (d) => d.timestamps,
      getColor: (d) => (d.vendor === 0 ? theme.trailColor0 : theme.trailColor1),
      opacity: 1,
      widthMinPixels: 8,
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
        depthTest: false,
      },
      transitions: {
        opacity: {
          duration: fadeTransDuration,
          enter: (value) => [value[0], value[1], value[2], 0], // fade in
        },
      },
    }),
  ];

  const dataLayers = groups.map(
    (group, index) =>
      new AnimatedArcLayer({
        id: `flights-${index}`,
        data: group.flights,
        getSourcePosition: (d) => [d.lon2, d.lat2],
        getTargetPosition: (d) => [d.lon1, d.lat1],
        getSourceTimestamp: (d) => d.time1,
        getTargetTimestamp: (d) => d.time2,
        getTilt: (d) => d.tilt,
        getHeight: (d) => d.randHeight,
        getWidth: 1,
        timeRange,
        getTargetColor: [215, 215, 0, [25]],
        getSourceColor: [215, 215, 0, [25]],
        opacity: chapterData[counter].AnimatedArcs,
      })
  );

  return (
    <div>
      <div className="halo back"></div>
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
            animationSpeed={TIME_WINDOW * 0.5}
            //           formatLabel={formatLabel}
            onChange={setCurrentTime}
            isPlaying={isPlaying}
            reset={_reset}
          />
        )}
      </DeckGL>
      <div id="narrativeImg"></div>
      <div id="narrativeContainer">
        <span id="narrativeText">DISTANCE UNKNOWN</span>
        <span id="flare">|</span>
        <div id="subText">
          RISKS AND OPPORTUNITIES OF MIGRATION IN THE AMERICAS
        </div>
        <div id="description"></div>
      </div>
      <div className="btnContainer" id="btnContainer">
        <div className="nav btn" onClick={goBackward}>
          ◀ BACK
        </div>
        <div className="nav info flash" id="info" onClick={goForward}>
          "TOUCH TO START"
        </div>
        <div className="nav btn" onClick={goForward}>
          NEXT ▶
        </div>
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
      const flights = await load(url, CSVLoader, {
        csv: { skipEmptyLines: true },
      });
      data.push({ flights, date });
      render(<App data={data} />, container);
    }
  }

  loadData(["2020-01-14"]);
}
