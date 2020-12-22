varying vec2 vPosition;
varying float vDistortionPosition;

void main() {
  float alpha = abs((vPosition.y + vDistortionPosition) * 2.0);
  vec3 color = vec3(0.);

  gl_FragColor = vec4(color, 1.0);
}
