#version 300 es
precision highp  float;
precision highp  int;

vec2[6] v;
vec2[6] t;

out vec2 texCoord;
void main() {
    v[0] = vec2(-1, -1);
    v[1] = vec2(1, -1);
    v[2] = vec2(1, 1);
    v[3] = vec2(1, 1);
    v[4] = vec2(-1, 1);
    v[5] = vec2(-1, -1);
    int i = gl_VertexID;
    gl_Position = vec4(v[i], 0, 1);
    t[0] = vec2(0, 0);
    t[1] = vec2(1, 0);
    t[2] = vec2(1, 1);
    t[3] = vec2(1, 1);
    t[4] = vec2(0, 1);
    t[5] = vec2(0, 0);
    texCoord = vec2(t[i].x, t[i].y);
}