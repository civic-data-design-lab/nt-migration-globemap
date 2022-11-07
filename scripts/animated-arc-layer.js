import { ArcLayer } from "@deck.gl/layers";

export default class AnimatedArcLayer extends ArcLayer {
  getShaders() {
    const shaders = super.getShaders();
    shaders.inject = {
      "vs:#decl": `\
uniform vec2 timeRange;
attribute float instanceTargetTimestamp;
attribute float instanceSourceTimestamp;
varying float vTimestamp;
`,
      "vs:#main-end": `\
vTimestamp = mix(instanceTargetTimestamp, instanceSourceTimestamp, segmentRatio);
`,
      "fs:#decl": `\
uniform vec2 timeRange;
varying float vTimestamp;
`,
      "fs:#main-start": `\
if ( vTimestamp > timeRange.y) {
  discard;
}
`,
      "fs:DECKGL_FILTER_COLOR": `\
color.a *= (vTimestamp - timeRange.y) / (timeRange.x - timeRange.y);
`,
    };
    return shaders;
  }

  initializeState() {
    super.initializeState();
    this.getAttributeManager().addInstanced({
      instanceSourceTimestamp: {
        size: 1,
        accessor: "getSourceTimestamp",
      },
      instanceTargetTimestamp: {
        size: 1,
        accessor: "getTargetTimestamp",
      },
    });
  }

  draw(params) {
    params.uniforms = Object.assign({}, params.uniforms, {
      timeRange: this.props.timeRange,
    });
    super.draw(params);
  }
}

AnimatedArcLayer.layerName = "AnimatedArcLayer";
AnimatedArcLayer.defaultProps = {
  getSourceTimestamp: { type: "accessor", value: 0 },
  getTargetTimestamp: { type: "accessor", value: 1 },
  timeRange: { type: "array", compare: true, value: [0, 1] },
  // getTilt: d => d.tilt
};
