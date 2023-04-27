#version 300 es
precision highp  float;
precision highp  int;

in vec3 position;
in vec2 textureCoordinate;

uniform mat4 transform;
uniform mat4 camera;

out vec2 texCoord;
void main() {
    gl_Position = camera * transform * vec4(position, 1);

    texCoord = textureCoordinate;
}