#version 300 es
precision mediump float;
precision mediump int;

uniform sampler2D layer;
uniform vec2 resolution;
uniform float radius;

in vec2 texCoord;
out vec4 FragColor;

void main() {
    vec2 center = round(texCoord * resolution / radius);
    vec2 coords = center * vec2(radius) / resolution;
    vec4 origin = texture(layer, coords);
    FragColor = origin;
}
