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
    if(percent <= 1.0)
        coord *= mix(1.0, pow(percent, 1.0 - strength * 0.75) * radius / distance, 1.0 - percent);
    coord += center;
    FragColor = texture(layer, coord / resolution);
}
