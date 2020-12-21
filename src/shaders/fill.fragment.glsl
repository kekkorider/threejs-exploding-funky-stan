varying vec2 vPosition;
varying float vDistortionPosition;

void main() {
  vec2 position = normalize(vPosition + 1.0);
  float alpha = abs((vPosition.y + vDistortionPosition) * 2.0);

  vec3 color = vec3(0.);

  gl_FragColor = vec4(color*alpha, alpha);
}
