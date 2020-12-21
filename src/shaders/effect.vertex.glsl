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

void main() {
  vec3 pos = position;

  // Make if fatter using `uDistortionPosition`
  float distortion = smoothstep(0.5, 1.0, 1.0 - abs(position.y+uDistortionPosition))*uDistortionAmount;
  // pos.xz *= 1.0 + distortion;

  // vec3 centr = aCentroid;
  vec3 localPos = pos - aCentroid;
  localPos.xz *= rotate2D(uTime*3.0*distortion);
  localPos.xy *= rotate2D(uTime*6.0*distortion);

  pos = aCentroid + localPos;
  // pos += localPos*max(0.0, distortion);
  pos.xz *= 1.0 + distortion;


  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  vPosition = position.xy;
  vDistortionPosition = uDistortionPosition;
}
