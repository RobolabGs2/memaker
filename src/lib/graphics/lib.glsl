float channelAlpha(int currentChannel, int channels, vec4 o);

float fillAlpha(vec4 o) {
    return o.g * o.a;
}

float strokeFullAlpha(vec4 o) {
    float a = (1. - fillAlpha(o));
    if(a == 0.0)
        return o.a * o.r;
    return o.a * o.r / a;
}

float strokeSimpleAlpha(vec4 o) {
    return o.r * o.a;
}

#define STENCIL_CHANNEL_STROKE 1
#define STENCIL_CHANNEL_FILL 2

float channelAlpha(int currentChannel, int channels, vec4 o) {
    if(currentChannel == STENCIL_CHANNEL_FILL)
        return fillAlpha(o);
    if((channels & STENCIL_CHANNEL_FILL) != 0)
        return strokeFullAlpha(o);
    return strokeSimpleAlpha(o);
}

void main();