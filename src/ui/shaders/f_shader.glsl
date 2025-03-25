precision mediump float;
uniform vec2 resolution;
uniform float chromaScale;
uniform bool isSpaceP3;
uniform int colorModel;
uniform int oklchRenderMode;
uniform float hueRad;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  // If colorModel is oklch (see "ColorModelList" types.ts for the list).
  if (colorModel == 0) {
    if (oklchRenderMode == 0) {
      float l = uv.y;
      float absoluteChroma = uv.x / chromaScale;
      float h = hueRad;

      vec3 oklch = vec3(l, absoluteChroma, h);
      vec3 oklchRgb = oklchToRgb(oklch, isSpaceP3);

      if (isInBounds(oklchRgb)) {
        gl_FragColor = vec4(oklchRgb, 1.0);
      } else {
        // We use a transparency color for the pixels outsides of gamut, for the bg color, we use CSS on the canvas, see renderColorPickerCanvas() in ColorPicker.
        gl_FragColor = vec4(0.0);
      }
    } else if (oklchRenderMode == 1) {
      float h = clampRadian(hueRad);
      float relativeChroma = uv.x;
      float l = uv.y;

      vec3 oklch = vec3(h, relativeChroma, l);

      vec3 hslRgbSrgb = okhsl_to_srgb(oklch, true);
      gl_FragColor = vec4(hslRgbSrgb, 1.0);
    }
  }
  // Else if colorModel is okhsv ok okhsl. 
  else {
    // clamp radian to [0,1]
    float h = clampRadian(hueRad);
    float s = uv.x;
    float vl = uv.y;

    vec3 hsvl = vec3(h, s, vl);

    if (colorModel == 1) {
      vec3 hslRgbSrgb = okhsl_to_srgb(hsvl, false);
      gl_FragColor = vec4(hslRgbSrgb, 1.0);
    } else if (colorModel == 2) {
      vec3 hsvRgbSrgb = okhsv_to_srgb(hsvl);
      gl_FragColor = vec4(hsvRgbSrgb, 1.0);
    }
  }
}
