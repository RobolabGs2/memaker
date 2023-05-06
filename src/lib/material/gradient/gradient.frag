#version 300 es
precision mediump float;
precision mediump int;

uniform sampler2D stencilSampler;
uniform vec3 colors[4];
uniform float alpha;
uniform int channel;
uniform int channels;

in vec2 texCoord;
out vec4 FragColor;

float channelAlpha(int currentChannel, int channels, vec4 o);

void main() {
    vec4 origin = texture(stencilSampler, texCoord);
    vec3 color = (1.0 - texCoord.x) * colors[0];
    color += (texCoord.x) * colors[1];
    color += (1.0 - texCoord.y) * colors[2];
    color += (texCoord.y) * colors[3];
    FragColor = vec4(color, channelAlpha(channel, channels, origin) * alpha);
}
