varying vec2 vPosition;
varying float vDistortionPosition;

void main() {
  vec2 position = normalize(vPosition + 1.0);
  float alpha = 1.0 - abs((vPosition.y + vDistortionPosition) * 2.0);

  vec3 color1 = vec3(0.);
  vec3 color2 = vec3(vPosition+0.5, 0.5);

  vec3 color = mix(color1, color2, smoothstep(0.0, 0.6, alpha));

  gl_FragColor = vec4(color, 1.0);
}
