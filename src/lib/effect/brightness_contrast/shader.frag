#version 300 es
precision mediump float;
precision mediump int;

uniform sampler2D layer;
uniform float brightness;
uniform float contrast;

in vec2 texCoord;
out vec4 FragColor;

#define PI 3.1415926

void main() {
    vec4 color = texture(layer, texCoord);
    color.rgb += brightness - 0.5;
    if(contrast > 0.0)
        color.rgb /= (1.0 - contrast);
    else
        color.rgb *= (1.0 + contrast);
    color.rgb += 0.5;

    FragColor = color;
}
