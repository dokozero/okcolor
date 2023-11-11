precision mediump float;

float clampRadian(float radian) {
  return mod(radian, 2.0 * M_PI) / (2.0 * M_PI);
}

float inRange(float val, float min, float max) {
  return step(min, val) - step(max, val);
}

bool isInBounds(in vec3 v) {
  return all(greaterThanEqual(v, vec3(0.0))) && all(lessThanEqual(v, vec3(1.0)));
}

vec3 mul3(in mat3 m, in vec3 v) {
  return vec3(
    dot(v,m[0]),
    dot(v,m[1]),
    dot(v,m[2])
  );
}

// TODO - delte after tests
// Now we use same steps as P3 (oklchToRgbSrgb) as it seems that with some machine we have a rendering bug.
// vec3 oklab2srgb(in vec3 lab) {
//   mat3 m1 = mat3(
//     1.0000000000,+0.3963377774,+0.2158037573,
//     1.0000000000,-0.1055613458,-0.0638541728,
//     1.0000000000,-0.0894841775,-1.2914855480
//   );

//   vec3 lms = mul3(m1, lab);

//   lms = lms * lms * lms;

//   mat3 m2 = mat3(
//     +4.0767416621,-3.3077115913,+0.2309699292,
//     -1.2684380046,+2.6097574011,-0.3413193965,
//     -0.0041960863,-0.7034186147,+1.7076147010
//   );
//   return mul3(m2, lms);
// }

// vec3 oklch2srgb(in vec3 lch)
// {
//   vec3 lab = lchToLab(lch);
//   return oklab2srgb(lab);
// }

vec3 lchToLab(in vec3 lch) {
  return vec3(
    lch.x,
    lch.y*cos(lch.z),
    lch.y*sin(lch.z)
  );
}

// Conversation matrices used from culori.js
vec3 labToLrgb(in vec3 lab) {
  mat3 labToLms = mat3(
    0.99999999845051981432, 0.39633779217376785678, 0.21580375806075880339,
    1.0000000088817607767, -0.1055613423236563494, -0.063854174771705903402,
    1.0000000546724109177, -0.089484182094965759684, -1.2914855378640917399
  );

  vec3 lms = pow(mul3(labToLms, lab), vec3(3.0));

  mat3 lmsToLrgb = mat3(
    4.076741661347994, -3.307711590408193, 0.230969928729428,
    -1.2684380040921763, 2.6097574006633715, -0.3413193963102197,
    -0.004196086541837188, -0.7034186144594493, 1.7076147009309444
  );

  return mul3(lmsToLrgb, lms);
}

vec3 lrgbToXyz(in vec3 rgb) {
  mat3 m1 = mat3(
    0.4123907992659593, 0.357584339383878, 0.1804807884018343,
    0.2126390058715102, 0.715168678767756, 0.0721923153607337,
    0.0193308187155918, 0.119194779794626, 0.9505321522496607
  );

  return mul3(m1, rgb);
}

vec3 xyzToLrgbP3(in vec3 xyz) {
  mat3 m1 = mat3(
    2.4934969119414263, -0.9313836179191242, -0.402710784450717,
    -0.8294889695615749, 1.7626640603183465, 0.0236246858419436,
    0.0358458302437845, -0.0761723892680418, 0.9568845240076871
  );

  return mul3(m1, xyz);
}

vec3 xyzToLrgbSrgb(in vec3 xyz) {
  mat3 m1 = mat3(
    3.2409699419045226, -1.537383177570094, -0.4986107602930034,
    -0.9692436362808796, 1.8759675015077204, 0.0415550574071756,
    0.0556300796969936, -0.2039769588889765, 1.0569715142428784
  );

  return mul3(m1, xyz);
}

vec3 lrgbToRgb(in vec3 rgb) {
  float absR = abs(rgb.r);
  float absG = abs(rgb.g);
  float absB = abs(rgb.b);

  float processedR;
  float processedG;
  float processedB;

  if (absR > 0.0031308) {
    // If issues in the rendering, we can try this (for the 3 processedX variables):
    // processedR = sign(rgb.r) * (1.055 * exp(log(absR) * (1.0 / 2.4)) - 0.055);
    processedR = sign(rgb.r) * (1.055 * pow(absR, 1.0 / 2.4) - 0.055);
  } else {
    processedR = rgb.r * 12.92;
  }

  if (absG > 0.0031308) {
    processedG = sign(rgb.g) * (1.055 * pow(absG, 1.0 / 2.4) - 0.055);
  } else {
    processedG = rgb.g * 12.92;
  }

  if (absB > 0.0031308) {
    processedB = sign(rgb.b) * (1.055 * pow(absB, 1.0 / 2.4) - 0.055);
  } else {
    processedB = rgb.b * 12.92;
  }

  return vec3(processedR, processedG, processedB);
}

vec3 oklchToRgb(in vec3 lch, in bool isSpaceP3) {
  vec3 lab = lchToLab(lch);
  vec3 lrgb = labToLrgb(lab);
  vec3 xyz = lrgbToXyz(lrgb);

  vec3 lrgbInSpace;
  if (isSpaceP3) {
    lrgbInSpace = xyzToLrgbP3(xyz);
  } else {
    lrgbInSpace = xyzToLrgbSrgb(xyz);
  }
  return lrgbToRgb(lrgbInSpace);
}
