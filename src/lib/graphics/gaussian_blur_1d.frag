#version 300 es
precision highp float;
precision highp int;

uniform sampler2D sourceSampler;
uniform vec3 color;
uniform float alpha;
uniform float blur;
uniform vec2 resolution;
uniform bool dim;

in vec2 texCoord;
out vec4 FragColor;

#define PI 3.1415926

float blurAlpha() {
    if(blur <= 0.1f) {
        vec4 origin = texture(sourceSampler, texCoord);
        return origin.a;
    }
    float sum = 0.0f;
    float r = blur * 0.5f;
    float scaleX = 1.f / resolution.x;
    float scaleY = 1.f / resolution.y;
    float from = -2.0f * r;
    float to = 2.0f * r;
    float C1 = 2.f * r * r;
    float C2 = sqrt(C1 * PI);
    float channel = float(dim);
    for(float delta = from; delta <= to; delta++) {
        float x = (1.f - channel) * delta;
        float y = channel * delta;
        vec2 shift = vec2(x * scaleX, y * scaleY);
        vec4 origin = texture(sourceSampler, texCoord + shift);
        float g = exp(-(x * x + y * y) / C1) / C2;
        sum += origin.a * g;
    }
    return sum;
}

void main() {
    float srcA = blurAlpha();
    if(alpha > 0.f) {
        srcA = min(1.0f, srcA / max(0.0001f, 1.f - alpha));
    } else {
        srcA *= 1.f + alpha;
    }
    FragColor = vec4(color, srcA);
}