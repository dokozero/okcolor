precision mediump float;
uniform vec2 resolution;
uniform bool isDarkModeEnabled;
uniform float chromaScale;
uniform bool isSpaceP3;
uniform int colorModel;
uniform float hueRad;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  // If colorModel is oklchCss or oklch (see "ColorModelList" types.ts for the list).
  if (colorModel == 0 || colorModel == 1) {
    float l = uv.y;
    float c = uv.x / chromaScale;
    float h = hueRad;

    vec3 oklch = vec3(l, c, h);
    vec3 col = oklchToRgb(oklch, isSpaceP3);

    if (isInBounds(col)) {
      gl_FragColor = vec4(col, 1.0);
    } else {
      vec3 bg_color = oklchToRgb(vec3(isDarkModeEnabled ? .43 : .95, .004, h), false);
      gl_FragColor = vec4(bg_color, 1.0);
    }
  }
  // Else if colorModel is okhsv ok okhsl. 
  else {
    // clamp radian to [0,1]
    float h = clampRadian(hueRad);
    float s = uv.x;
    float vl = uv.y;

    vec3 hsvl = vec3(h, s, vl);

    if (colorModel == 2) {
      vec3 hslRgbSrgb = okhsl_to_srgb(hsvl);
      gl_FragColor = vec4(hslRgbSrgb, 1.0);
    } else {
      vec3 hsvRgbSrgb = okhsv_to_srgb(hsvl);
      gl_FragColor = vec4(hsvRgbSrgb, 1.0);
    }
  }
}
