#version 300 es
precision highp float;
precision highp int;

uniform sampler2D stencilSampler;
uniform sampler2D patternSampler;
uniform float alpha;
uniform int channel;
uniform int channels;
uniform mat4 patternTransform;

in vec2 texCoord;
out vec4 FragColor;

float channelAlpha(int currentChannel, int channels, vec4 o);

void main() {
    vec4 origin = texture(stencilSampler, texCoord);
    vec4 patternCoord = patternTransform * vec4(texCoord, 0, 1);
    FragColor = texture(patternSampler, patternCoord.xy / patternCoord.w);
    FragColor.a *= channelAlpha(channel, channels, origin) * alpha;
}
