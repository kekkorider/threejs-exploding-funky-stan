varying vec2 vPosition;
varying float vDistortionPosition;
varying float vDistortionThickness;

uniform float uTime;

// REF: https://www.shadertoy.com/view/XljGzV
vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 position = vPosition + 1.0;
  float alpha = 1.0 - abs((vPosition.y + vDistortionPosition) * 2.0);

  vec3 color1 = vec3(1.0); // Default color
  vec3 color2 = vec3(1.0); // Crazy color

	// Define the value of each channel
	color2.r = hsv2rgb(vec3(
		position.x + uTime, 0.5, position.y
	)).r;

	color2.g = hsv2rgb(vec3(
		position.x + uTime*0.8, 0.4, position.y
	)).g;

	color2.b = hsv2rgb(vec3(
		position.y + uTime*3.0, 0.5, position.y
	)).b;

	// Crazy color is only visible around the `vDistortionPosition` point
	color2 *= alpha;

  vec3 color = mix(color1, color2, alpha);

  gl_FragColor = vec4(color, 1.0);
}
