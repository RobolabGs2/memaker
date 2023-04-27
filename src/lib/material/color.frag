#version 300 es
precision highp float;
precision highp int;

uniform sampler2D stencilSampler;
uniform vec3 color;
uniform float alpha;
uniform int channel;
uniform int channels;

in vec2 texCoord;
out vec4 FragColor;

float channelAlpha(int currentChannel, int channels, vec4 o);

void main() {
    vec2 tcoords = texCoord;
    vec4 origin = texture(stencilSampler, tcoords);
    float originAlpha = channelAlpha(channel, channels, origin);
    FragColor = vec4(color, originAlpha * alpha);
}
