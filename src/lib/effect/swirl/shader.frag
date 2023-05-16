#version 300 es
precision mediump float;
precision mediump int;

uniform sampler2D layer;
uniform vec2 resolution;
uniform float radius;
uniform float angle;
uniform vec2 center;

in vec2 texCoord;
out vec4 FragColor;

#define PI 3.1415926

void main() {
    vec2 coord = gl_FragCoord.xy;
    vec2 center = vec2(center.x, resolution.y - center.y);
    coord -= center;
    float distance = length(coord);
    if(distance < radius) {
        float percent = (radius - distance) / radius;
        float theta = percent * percent * angle;
        float s = sin(theta);
        float c = cos(theta);
        coord = vec2(coord.x * c - coord.y * s, coord.x * s + coord.y * c);
    }
    coord += center;
    FragColor = texture(layer, coord / resolution);
}
