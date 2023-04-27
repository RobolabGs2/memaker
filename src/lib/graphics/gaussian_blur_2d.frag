#version 300 es
precision highp float;
precision highp int;

uniform sampler2D stencilSampler;
uniform vec3 color;
uniform float alpha;
uniform float blur;
uniform vec2 resolution;

in vec2 texCoord;
out vec4 FragColor;

#define PI 3.1415926

void main() {
    if(blur <= 0.) {
        vec4 origin = texture(stencilSampler, texCoord);
        FragColor = vec4(color, alpha * origin.a);
        return;
    }

    float sum = 0.0;
    float r = blur * 0.5;
    float scaleX = 1. / resolution.x;
    float scaleY = 1. / resolution.y;
    float from = -2.0 * r;
    float to = 2.0 * r;
    float C1 = 2. * r * r;
    float C2 = C1 * PI;
    for(float x = from; x <= to; x++) {
        for(float y = from; y <= to; y++) {
            vec2 shift = vec2(x * scaleX, y * scaleY);
            vec4 origin = texture(stencilSampler, texCoord + shift);
            float g = exp(-(x * x + y * y) / C1) / C2;
            sum += origin.a * g;
        }
    }
    FragColor = vec4(color, alpha * sum);
}