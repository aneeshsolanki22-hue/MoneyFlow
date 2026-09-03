/**
 * liquid-glass.glsl — Apple-style liquid glass refraction.
 * Edge-band displacement via the node's SDF, chromatic rim fringe via
 * per-channel backdrop sampling. Mirrors deepika-builds/liquid-glass.js.
 *
 * @schema shader 1.0
 */
/** @resolution */
uniform vec2 u_resolution;

/** @backdrop */
uniform sampler2D u_backdrop;

/** @sdf */
uniform sampler2D u_sdf;

/**
 * @label Refraction Strength
 * @default 40.0
 * @range 0.0, 120.0
 */
uniform float u_strength;

/**
 * @label Chromatic Aberration
 * @default 8.0
 * @range 0.0, 30.0
 */
uniform float u_chroma;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec4 sdf = texture2D(u_sdf, uv);
  float dist = sdf.r;
  vec2 grad = sdf.gb * 2.0 - 1.0;

  float rim = 1.0 - smoothstep(0.0, 24.0, dist);
  vec2 disp = grad * u_strength * rim / u_resolution;

  vec3 color;
  color.r = texture2D(u_backdrop, uv + disp * (1.0 + u_chroma * 0.015)).r;
  color.g = texture2D(u_backdrop, uv + disp).g;
  color.b = texture2D(u_backdrop, uv + disp * (1.0 - u_chroma * 0.015)).b;

  float spec = pow(clamp(1.0 - abs(uv.y - 0.25) / 0.25, 0.0, 1.0), 8.0) * rim;
  color += spec * 0.12;

  gl_FragColor = vec4(color, 1.0);
}
