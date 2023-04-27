#version 300 es
precision highp  float;
precision highp  int;

uniform sampler2D stencilSampler;
uniform float alpha;
uniform int channel;

in vec2 texCoord;
out vec4 FragColor;

float channelAlpha(int channel, vec4 o);

void main() {
    vec4 origin = texture(stencilSampler, texCoord);
    FragColor = vec4(texCoord, 0, channelAlpha(channel, origin) * alpha);
}
