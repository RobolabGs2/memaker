#version 300 es
precision highp float;
precision highp int;

uniform sampler2D textureSampler;

in vec2 texCoord;
out vec4 FragColor;

void main() {
    FragColor = texture(textureSampler, vec2(texCoord.x, texCoord.y));
}