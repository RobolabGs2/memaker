#version 300 es
precision mediump float;
precision mediump int;

uniform sampler2D layer;
in vec2 texCoord;
out vec4 FragColor;

#define PI 3.1415926

void main() {
    vec4 color = texture(layer, texCoord);
    float value = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
    FragColor = vec4(value, value, value, color.a);
}
