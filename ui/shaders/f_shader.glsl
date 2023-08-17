precision mediump float;
uniform vec2 resolution;
uniform bool dark;
uniform float mode;
uniform float hue_rad;
uniform float chroma_scale;
uniform bool showP3;


void main()
{
    vec2 uv = gl_FragCoord.xy / resolution;

    float l = uv.y;
    float h = hue_rad;
    float c = uv.x / chroma_scale;

    vec3 bg_color = oklch2srgb(vec3(dark ? .70 : .95, .009, h));

    // fn inRange return 1.0 if float in range
    if (inRange(mode, 0.0, 2.0) == 1.0) {
        vec3 oklch = vec3(l, c, h);
        vec3 oklabRGB = oklch2srgb(oklch);
        vec3 col = oklabRGB;

        if (showP3) {
            col = oklch2p3(oklch);

            bool isInRgb = isInBounds(oklabRGB);
            if (!isInRgb) {
                float maxChroma = sRGBMaxChroma(oklch);
                if (abs(c - maxChroma) < 0.002) {
                    col = vec3(1, 1, 1);
                    // col = pow(col,vec3(1./1.2)); increase gamma pixel out sRGB
                }
            }
        } else {
            col = pow(col,vec3(1./2.4)); // sRGB gamma correction
        }

        bool inBounds = isInBounds(col);
        if (inBounds)
            gl_FragColor = vec4(col, 1.0);
        else gl_FragColor = vec4(pow(bg_color,vec3(1./1.4)), 1.0);
    } else {
        // clamp radian to [0,1]
        vec3 hsl = vec3(clampRadian(h), uv.x, uv.y);
        vec3 hsvRGB = okhsv_to_srgb(hsl);
        vec3 hslRGB = okhsl_to_srgb(hsl);
        if (mode == 2.0) {
            gl_FragColor = vec4(hslRGB, 1.0);
        } else {
            gl_FragColor = vec4(hsvRGB, 1.0);
        }
    }
}
