#version 300 es
precision mediump float;
precision mediump int;

uniform sampler2D layer;
uniform vec2 resolution;
uniform float radius;
uniform float minAlpha;
uniform float maxAlpha;

in vec2 texCoord;
out vec4 FragColor;

#define PI 3.1415926

float rand(vec2 co, float step) {
    return fract(cos(dot(co * step, vec2(15.2851, 18.435))) * 74687.84583);
}

void main() {
    // texCoord 0..1
    float sx = (rand(texCoord, 1.));
    float sy = (rand(texCoord, 2.));
    vec2 shift = vec2(sx, sy) * 2. - vec2(1);
    shift *= vec2(radius / resolution);
    vec4 origin = texture(layer, texCoord);
    origin += texture(layer, texCoord + shift);
    origin /= 2.;
    float rnd = rand(texCoord, 3.);
    FragColor = vec4(origin.rgb, origin.a * clamp(rnd, minAlpha, maxAlpha));
}
