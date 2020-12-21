varying vec2 vPosition;
varying float vDistortionPosition;

uniform float uDistortionPosition;
uniform float uDistortionAmount;
uniform float uTime;

attribute vec3 aCentroid;

mat2 rotate2D(in float angle) {
  return mat2(cos(angle), -sin(angle),
              sin(angle), cos(angle));
}

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p+45.32);
  return fract(p.x * p.y);
}

void main() {
  vec3 pos = position;

  // float distPos = cos(uTime);

  // Make if fatter using `uDistortionPosition`
  float distortion = smoothstep(0.5, 1.0, 1.0 - abs(position.y+uDistortionPosition))*uDistortionAmount;
  // pos.xz *= 1.0 + distortion;

  vec3 localPos = pos - aCentroid;
  float rand = Hash21(aCentroid.xy) + Hash21(aCentroid.yz);
  localPos.xz *= rotate2D(distortion * 15.0 * uDistortionPosition * rand);
  localPos.xy *= rotate2D(distortion * 35.0 * uDistortionPosition * rand);
  localPos.yz *= rotate2D(distortion * -84.0 * uDistortionPosition * rand);

  pos = aCentroid + localPos;
  // pos += localPos*max(0.0, distortion);
  // pos.xz *= 1.0 + distortion;
  pos += aCentroid * rand * distortion;


  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  vPosition = position.xy;
  vDistortionPosition = uDistortionPosition;
}
