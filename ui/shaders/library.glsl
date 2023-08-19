// Copyright(c) 2021 Björn Ottosson
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this softwareand associated documentation files(the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and /or sell copies
// of the Software, and to permit persons to whom the Software is furnished to do
// so, subject to the following conditions :
// The above copyright noticeand this permission notice shall be included in all
// copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

precision mediump float;
#define M_PI 3.1415926535897932384626433832795

float cbrt( float x )
{
    return sign(x)*pow(abs(x), 1.0 / 3.0);
}

float srgb_transfer_function(float a)
{
    return .0031308 >= a ? 12.92 * a : 1.055 * pow(a, .4166666666666667) - .055;
}

vec3 oklab_to_linear_srgb(vec3 c)
{
    float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
    float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
    float s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;

    float l = l_ * l_ * l_;
    float m = m_ * m_ * m_;
    float s = s_ * s_ * s_;

    return vec3(
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    );
}

// Finds the maximum saturation possible for a given hue that fits in sRGB
// Saturation here is defined as S = C/L
// a and b must be normalized so a^2 + b^2 == 1
float compute_max_saturation(float a, float b)
{
    // Max saturation will be when one of r, g or b goes below zero.

    // Select different coefficients depending on which component goes below zero first
    float k0, k1, k2, k3, k4, wl, wm, ws;

    if (-1.88170328 * a - 0.80936493 * b > 1.0)
    {
        // Red component
        k0 = +1.19086277; k1 = +1.76576728; k2 = +0.59662641; k3 = +0.75515197; k4 = +0.56771245;
        wl = +4.0767416621; wm = -3.3077115913; ws = +0.2309699292;
    }
    else if (1.81444104 * a - 1.19445276 * b > 1.0)
    {
        // Green component
        k0 = +0.73956515; k1 = -0.45954404; k2 = +0.08285427; k3 = +0.12541070; k4 = +0.14503204;
        wl = -1.2684380046; wm = +2.6097574011; ws = -0.3413193965;
    }
    else
    {
        // Blue component
        k0 = +1.35733652; k1 = -0.00915799; k2 = -1.15130210; k3 = -0.50559606; k4 = +0.00692167;
        wl = -0.0041960863; wm = -0.7034186147; ws = +1.7076147010;
    }

    // Approximate max saturation using a polynomial:
    float S = k0 + k1 * a + k2 * b + k3 * a * a + k4 * a * b;

    // Do one step Halley's method to get closer
    // this gives an error less than 10e6, except for some blue hues where the dS/dh is close to infinite
    // this should be sufficient for most applications, otherwise do two/three steps

    float k_l = +0.3963377774 * a + 0.2158037573 * b;
    float k_m = -0.1055613458 * a - 0.0638541728 * b;
    float k_s = -0.0894841775 * a - 1.2914855480 * b;

    {
        float l_ = 1.0 + S * k_l;
        float m_ = 1.0 + S * k_m;
        float s_ = 1.0 + S * k_s;

        float l = l_ * l_ * l_;
        float m = m_ * m_ * m_;
        float s = s_ * s_ * s_;

        float l_dS = 3.0 * k_l * l_ * l_;
        float m_dS = 3.0 * k_m * m_ * m_;
        float s_dS = 3.0 * k_s * s_ * s_;

        float l_dS2 = 6.0 * k_l * k_l * l_;
        float m_dS2 = 6.0 * k_m * k_m * m_;
        float s_dS2 = 6.0 * k_s * k_s * s_;

        float f = wl * l + wm * m + ws * s;
        float f1 = wl * l_dS + wm * m_dS + ws * s_dS;
        float f2 = wl * l_dS2 + wm * m_dS2 + ws * s_dS2;

        S = S - f * f1 / (f1 * f1 - 0.5 * f * f2);
    }

    return S;
}

// finds L_cusp and C_cusp for a given hue
// a and b must be normalized so a^2 + b^2 == 1
vec2 find_cusp(float a, float b)
{
    // First, find the maximum saturation (saturation S = C/L)
    float S_cusp = compute_max_saturation(a, b);

    // Convert to linear sRGB to find the first point where at least one of r,g or b >= 1:
    vec3 rgb_at_max = oklab_to_linear_srgb(vec3( 1, S_cusp * a, S_cusp * b ));
    float L_cusp = cbrt(1.0 / max(max(rgb_at_max.r, rgb_at_max.g), rgb_at_max.b));
    float C_cusp = L_cusp * S_cusp;

    return vec2( L_cusp , C_cusp );
}

// Finds intersection of the line defined by
// L = L0 * (1 - t) + t * L1;
// C = t * C1;
// a and b must be normalized so a^2 + b^2 == 1
float find_gamut_intersection(float a, float b, float L1, float C1, float L0, vec2 cusp)
{
    // Find the intersection for upper and lower half seprately
    float t;
    if (((L1 - L0) * cusp.y - (cusp.x - L0) * C1) <= 0.0)
    {
        // Lower half

        t = cusp.y * L0 / (C1 * cusp.x + cusp.y * (L0 - L1));
    }
    else
    {
        // Upper half

        // First intersect with triangle
        t = cusp.y * (L0 - 1.0) / (C1 * (cusp.x - 1.0) + cusp.y * (L0 - L1));

        // Then one step Halley's method
        {
            float dL = L1 - L0;
            float dC = C1;

            float k_l = +0.3963377774 * a + 0.2158037573 * b;
            float k_m = -0.1055613458 * a - 0.0638541728 * b;
            float k_s = -0.0894841775 * a - 1.2914855480 * b;

            float l_dt = dL + dC * k_l;
            float m_dt = dL + dC * k_m;
            float s_dt = dL + dC * k_s;


            // If higher accuracy is required, 2 or 3 iterations of the following block can be used:
            {
                float L = L0 * (1.0 - t) + t * L1;
                float C = t * C1;

                float l_ = L + C * k_l;
                float m_ = L + C * k_m;
                float s_ = L + C * k_s;

                float l = l_ * l_ * l_;
                float m = m_ * m_ * m_;
                float s = s_ * s_ * s_;

                float ldt = 3.0 * l_dt * l_ * l_;
                float mdt = 3.0 * m_dt * m_ * m_;
                float sdt = 3.0 * s_dt * s_ * s_;

                float ldt2 = 6.0 * l_dt * l_dt * l_;
                float mdt2 = 6.0 * m_dt * m_dt * m_;
                float sdt2 = 6.0 * s_dt * s_dt * s_;

                float r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s - 1.0;
                float r1 = 4.0767416621 * ldt - 3.3077115913 * mdt + 0.2309699292 * sdt;
                float r2 = 4.0767416621 * ldt2 - 3.3077115913 * mdt2 + 0.2309699292 * sdt2;

                float u_r = r1 / (r1 * r1 - 0.5 * r * r2);
                float t_r = -r * u_r;

                float g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s - 1.0;
                float g1 = -1.2684380046 * ldt + 2.6097574011 * mdt - 0.3413193965 * sdt;
                float g2 = -1.2684380046 * ldt2 + 2.6097574011 * mdt2 - 0.3413193965 * sdt2;

                float u_g = g1 / (g1 * g1 - 0.5 * g * g2);
                float t_g = -g * u_g;

                float b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s - 1.0;
                float b1 = -0.0041960863 * ldt - 0.7034186147 * mdt + 1.7076147010 * sdt;
                float b2 = -0.0041960863 * ldt2 - 0.7034186147 * mdt2 + 1.7076147010 * sdt2;

                float u_b = b1 / (b1 * b1 - 0.5 * b * b2);
                float t_b = -b * u_b;

                t_r = u_r >= 0.0 ? t_r : 10000.0;
                t_g = u_g >= 0.0 ? t_g : 10000.0;
                t_b = u_b >= 0.0 ? t_b : 10000.0;

                t += min(t_r, min(t_g, t_b));
            }
        }
    }

    return t;
}

float find_gamut_intersection(float a, float b, float L1, float C1, float L0)
{
    // Find the cusp of the gamut triangle
    vec2 cusp = find_cusp(a, b);

    return find_gamut_intersection(a, b, L1, C1, L0, cusp);
}

float toe_inv(float x)
{
    float k_1 = 0.206;
    float k_2 = 0.03;
    float k_3 = (1.0 + k_1) / (1.0 + k_2);
    return (x * x + k_1 * x) / (k_3 * (x + k_2));
}

vec2 to_ST(vec2 cusp)
{
    float L = cusp.x;
    float C = cusp.y;
    return vec2( C / L, C / (1.0 - L) );
}

// Returns a smooth approximation of the location of the cusp
// This polynomial was created by an optimization process
// It has been designed so that S_mid < S_max and T_mid < T_max
vec2 get_ST_mid(float a_, float b_)
{
    float S = 0.11516993 + 1.0 / (
    +7.44778970 + 4.15901240 * b_
    + a_ * (-2.19557347 + 1.75198401 * b_
    + a_ * (-2.13704948 - 10.02301043 * b_
    + a_ * (-4.24894561 + 5.38770819 * b_ + 4.69891013 * a_
    )))
    );

    float T = 0.11239642 + 1.0 / (
    +1.61320320 - 0.68124379 * b_
    + a_ * (+0.40370612 + 0.90148123 * b_
    + a_ * (-0.27087943 + 0.61223990 * b_
    + a_ * (+0.00299215 - 0.45399568 * b_ - 0.14661872 * a_
    )))
    );

    return vec2( S, T );
}

vec3 get_Cs(float L, float a_, float b_)
{
    vec2 cusp = find_cusp(a_, b_);

    float C_max = find_gamut_intersection(a_, b_, L, 1.0, L, cusp);
    vec2 ST_max = to_ST(cusp);

    // Scale factor to compensate for the curved part of gamut shape:
    float k = C_max / min((L * ST_max.x), (1.0 - L) * ST_max.y);

    float C_mid;
    {
        vec2 ST_mid = get_ST_mid(a_, b_);

        // Use a soft minimum function, instead of a sharp triangle shape to get a smooth value for chroma.
        float C_a = L * ST_mid.x;
        float C_b = (1.0 - L) * ST_mid.y;
        C_mid = 0.9 * k * sqrt(sqrt(1.0 / (1.0 / (C_a * C_a * C_a * C_a) + 1.0 / (C_b * C_b * C_b * C_b))));
    }

    float C_0;
    {
        // for C_0, the shape is independent of hue, so vec2 are constant. Values picked to roughly be the average values of vec2.
        float C_a = L * 0.4;
        float C_b = (1.0 - L) * 0.8;

        // Use a soft minimum function, instead of a sharp triangle shape to get a smooth value for chroma.
        C_0 = sqrt(1.0 / (1.0 / (C_a * C_a) + 1.0 / (C_b * C_b)));
    }

    return vec3( C_0, C_mid, C_max );
}

vec3 okhsl_to_srgb(vec3 hsl)
{
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;

    if (l == 1.0)
    {
        return vec3( 1.0, 1.0, 1.0 );
    }

    else if (l == 0.0)
    {
        return vec3( 0.0, 0.0, 0.0 );
    }

    float a_ = cos(2.0 * M_PI * h);
    float b_ = sin(2.0 * M_PI * h);
    float L = toe_inv(l);

    vec3 cs = get_Cs(L, a_, b_);
    float C_0 = cs.x;
    float C_mid = cs.y;
    float C_max = cs.z;

    float mid = 0.8;
    float mid_inv = 1.25;

    float C, t, k_0, k_1, k_2;

    if (s < mid)
    {
        t = mid_inv * s;

        k_1 = mid * C_0;
        k_2 = (1.0 - k_1 / C_mid);

        C = t * k_1 / (1.0 - k_2 * t);
    }
    else
    {
        t = (s - mid)/ (1.0 - mid);

        k_0 = C_mid;
        k_1 = (1.0 - mid) * C_mid * C_mid * mid_inv * mid_inv / C_0;
        k_2 = (1.0 - (k_1) / (C_max - C_mid));

        C = k_0 + t * k_1 / (1.0 - k_2 * t);
    }

    vec3 rgb = oklab_to_linear_srgb(vec3( L, C * a_, C * b_ ));
    return vec3(
        srgb_transfer_function(rgb.r),
        srgb_transfer_function(rgb.g),
        srgb_transfer_function(rgb.b)
    );
}

vec3 okhsv_to_srgb(vec3 hsv)
{
    float h = hsv.x;
    float s = hsv.y;
    float v = hsv.z;

    float a_ = cos(2.0 * M_PI * h);
    float b_ = sin(2.0 * M_PI * h);

    vec2 cusp = find_cusp(a_, b_);
    vec2 ST_max = to_ST(cusp);
    float S_max = ST_max.x;
    float T_max = ST_max.y;
    float S_0 = 0.5;
    float k = 1.0- S_0 / S_max;

    // first we compute L and V as if the gamut is a perfect triangle:

    // L, C when v==1:
    float L_v = 1.0   - s * S_0 / (S_0 + T_max - T_max * k * s);
    float C_v = s * T_max * S_0 / (S_0 + T_max - T_max * k * s);

    float L = v * L_v;
    float C = v * C_v;

    // then we compensate for both toe and the curved top part of the triangle:
    float L_vt = toe_inv(L_v);
    float C_vt = C_v * L_vt / L_v;

    float L_new = toe_inv(L);
    C = C * L_new / L;
    L = L_new;

    vec3 rgb_scale = oklab_to_linear_srgb(vec3( L_vt, a_ * C_vt, b_ * C_vt ));
    float scale_L = cbrt(1.0 / max(max(rgb_scale.r, rgb_scale.g), max(rgb_scale.b, 0.0)));

    L = L * scale_L;
    C = C * scale_L;

    vec3 rgb = oklab_to_linear_srgb(vec3( L, C * a_, C * b_ ));
    return vec3(
        srgb_transfer_function(rgb.r),
        srgb_transfer_function(rgb.g),
        srgb_transfer_function(rgb.b)
    );
}
