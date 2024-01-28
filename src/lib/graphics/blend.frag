#version 300 es
precision highp float;
precision highp int;

uniform sampler2D srcSampler;
uniform sampler2D dstSampler;
uniform uint blendMode;
uniform uint composeMode;

in vec2 texCoord;
out vec4 FragColor;

// Compositing and Blending Level 2 https://drafts.fxtf.org/compositing/
const uint BLEND_NORMAL = 0u;
const uint BLEND_MULTIPLY = 1u;
const uint BLEND_SCREEN = 2u;
const uint BLEND_OVERLAY = 3u;
const uint BLEND_DARKEN = 4u;
const uint BLEND_LIGHTEN = 5u;
const uint BLEND_COLOR_DODGE = 6u;
const uint BLEND_COLOR_BURN = 7u;
const uint BLEND_HARD_LIGHT = 8u;
const uint BLEND_SOFT_LIGHT = 9u;
const uint BLEND_DIFFERENCE = 10u;
const uint BLEND_EXCLUSION = 11u;
const uint BLEND_HUE = 12u;
const uint BLEND_SATURATION = 13u;
const uint BLEND_COLOR = 14u;
const uint BLEND_LUMINOSITY = 15u;
// custom
const uint BLEND_XOR = 17u;

const uint COMPOSE_CLEAR = 0u;
const uint COMPOSE_COPY = 1u;
const uint COMPOSE_DESTINATION = 2u;
const uint COMPOSE_SOURCE_OVER = 3u;
const uint COMPOSE_DESTINATION_OVER = 4u;
const uint COMPOSE_SOURCE_IN = 5u;
const uint COMPOSE_DESTINATION_IN = 6u;
const uint COMPOSE_SOURCE_OUT = 7u;
const uint COMPOSE_DESTINATION_OUT = 8u;
const uint COMPOSE_SOURCE_ATOP = 9u;
const uint COMPOSE_DESTINATION_ATOP = 10u;
const uint COMPOSE_XOR = 11u;
const uint COMPOSE_LIGHTER = 12u;

vec3 multiply(vec3 src, vec3 dst) {
    return src * dst;
}

vec3 screen(vec3 src, vec3 dst) {
    return src + dst - (src * dst);
}

vec3 hardLight(vec3 src, vec3 dst) {
    vec3 m = multiply(2.f * src, dst);
    vec3 s = screen(2.f * src - 1.f, dst);
    if(src.r > 0.5f)
        m.r = s.r;
    if(src.g > 0.5f)
        m.g = s.g;
    if(src.b > 0.5f)
        m.b = s.b;
    return m;
}

float channelSoftLight(float s, float b) {
    float s2 = 2.f * s;
    if(s <= 0.5f) {
        return b - (1.f - s2) * b * (1.f - b);
    }
    float d = 0.f;
    if(b <= 0.25f)
        d = ((16.f * b - 12.f) * b + 4.f) * b;
    else
        d = sqrt(b);

    return b + (s2 - 1.f) * (d - b);
}

float channelColorDodge(float s, float d) {
    if(d == 0.f)
        return 0.f;
    if(s == 1.f)
        return 1.f;
    return min(1.f, d / (1.f - s));
}
float channelColorBurn(float s, float d) {
    if(d == 1.f)
        return 1.f;
    if(s == 0.f)
        return 0.f;
    return 1.f - min(1.f, (1.f - d) / s);
}

float lum(vec3 c) {
    return 0.3f * c.r + 0.59f * c.g + 0.11f * c.b;
}

vec3 clipColor(vec3 c) {
    float l = lum(c);
    float n = min(c.r, min(c.g, c.b));
    float x = max(c.r, max(c.g, c.b));
    if(n < 0.f)
        c = l + (((c - l) * l) / (l - n));
    if(x > 1.f)
        c = l + (((c - l) * (1.f - l)) / (x - l));
    return c;
}

vec3 setLum(vec3 c, float l) {
    float d = l - lum(c);
    return clipColor(c + d);
}

float saturation(vec3 c) {
    return max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
}

vec3 setSat(vec3 c, float s) {
    int minI = 0;
    int midI = 1;
    int maxI = 2;
    int tmp = 0;
    if(c[minI] > c[midI]) {
        tmp = minI;
        minI = midI;
        midI = tmp;
    }
    if(c[midI] > c[maxI]) {
        tmp = maxI;
        maxI = midI;
        midI = tmp;
    }
    if(c[minI] > c[midI]) {
        tmp = minI;
        minI = midI;
        midI = tmp;
    }
    if(c[maxI] > c[minI]) {
        c[midI] = (((c[midI] - c[minI]) * s) / (c[maxI] - c[minI]));
        c[maxI] = s;
    } else {
        c[midI] = c[maxI] = 0.f;
    }
    c[minI] = 0.f;
    return c;
}

vec3 blend(uint mode, vec3 src, vec3 dst) {
    switch(mode) {
        case BLEND_XOR:
            uint sr = uint(src.r * 255.f);
            uint sg = uint(src.g * 255.f);
            uint sb = uint(src.b * 255.f);
            uint dr = uint(dst.r * 255.f);
            uint dg = uint(dst.g * 255.f);
            uint db = uint(dst.b * 255.f);
            float r = float((sr ^ dr) & 255u) / 255.f;
            float g = float((sg ^ dg) & 255u) / 255.f;
            float b = float((sb ^ db) & 255u) / 255.f;
            return vec3(r, g, b);
        case BLEND_MULTIPLY:
            return multiply(src.rgb, dst.rgb);
        case BLEND_SCREEN:
            return screen(src, dst);
        case BLEND_OVERLAY:
            return hardLight(dst, src);
        case BLEND_DARKEN:
            return min(src, dst);
        case BLEND_LIGHTEN:
            return max(src, dst);
        case BLEND_COLOR_DODGE:
            return vec3(channelColorDodge(src.r, dst.r), channelColorDodge(src.g, dst.g), channelColorDodge(src.b, dst.b));
        case BLEND_COLOR_BURN:
            return vec3(channelColorBurn(src.r, dst.r), channelColorBurn(src.g, dst.g), channelColorBurn(src.b, dst.b));
        case BLEND_HARD_LIGHT:
            return hardLight(src, dst);
        case BLEND_SOFT_LIGHT:
            return vec3(channelSoftLight(src.r, dst.r), channelSoftLight(src.g, dst.g), channelSoftLight(src.b, dst.b));
        case BLEND_DIFFERENCE:
            return abs(dst - src);
        case BLEND_EXCLUSION:
            return dst + src - 2.f * dst * src;
        case BLEND_HUE:
            return setLum(setSat(src, saturation(dst)), lum(dst));
        case BLEND_SATURATION:
            return setLum(setSat(dst, saturation(src)), lum(dst));
        case BLEND_COLOR:
            return setLum(src, lum(dst));
        case BLEND_LUMINOSITY:
            return setLum(dst, lum(src));
        case BLEND_NORMAL:
            return src;
        default:
            return src;
    }
}

vec2 basicPorterDuffCoeffs(uint mode, float as, float ab) {
    switch(mode) {
        case COMPOSE_CLEAR:
            return vec2(0, 0);
        case COMPOSE_COPY:
            return vec2(1, 0);
        case COMPOSE_DESTINATION:
            return vec2(0, 1);
        case COMPOSE_SOURCE_OVER:
            return vec2(1, 1.f - as);
        case COMPOSE_DESTINATION_OVER:
            return vec2(1.f - ab, 1);
        case COMPOSE_SOURCE_IN:
            return vec2(ab, 0);
        case COMPOSE_DESTINATION_IN:
            return vec2(0, as);
        case COMPOSE_SOURCE_OUT:
            return vec2(1.f - ab, 0);
        case COMPOSE_DESTINATION_OUT:
            return vec2(0, 1.f - as);
        case COMPOSE_SOURCE_ATOP:
            return vec2(ab, 1.f - as);
        case COMPOSE_DESTINATION_ATOP:
            return vec2(1.f - ab, as);
        case COMPOSE_XOR:
            return vec2(1.f - ab, 1.f - as);
        case COMPOSE_LIGHTER:
            return vec2(1, 1);
    }
    return vec2(-1, -1);
}

vec4 compose(uint mode, vec3 cs, float as, vec3 cb, float ab) {
    vec2 fafb = basicPorterDuffCoeffs(mode, as, ab);
    float Fa = fafb.x;
    float Fb = fafb.y;
    float ao = as * Fa + ab * Fb;
    return vec4(as * Fa * cs + ab * Fb * cb, ao);
}

void main() {
    vec4 srcColor = texture(srcSampler, texCoord);
    vec4 dstColor = texture(dstSampler, texCoord);
    vec3 B = blend(blendMode, srcColor.rgb, dstColor.rgb);
    vec3 Cs = (1.f - dstColor.a) * srcColor.rgb + dstColor.a * B;
    FragColor = compose(composeMode, Cs, srcColor.a, dstColor.rgb, dstColor.a);
}