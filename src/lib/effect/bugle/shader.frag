#version 300 es
precision mediump float;
precision mediump int;

uniform sampler2D layer;
uniform vec2 resolution;
uniform float radius;
uniform float strength;
uniform vec2 center;

in vec2 texCoord;
out vec4 FragColor;

#define PI 3.1415926

void main() {
    vec2 coord = gl_FragCoord.xy;
    vec2 center = vec2(center.x, resolution.y - center.y);
    coord -= center;
    float distance = length(coord);
    float percent = distance / radius;
    coord *= mix(1.0, smoothstep(0.0, radius / distance, percent), strength * 0.75);
    coord += center;
    FragColor = texture(layer, coord / resolution);
}
