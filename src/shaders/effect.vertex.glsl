varying vec2 vPosition;
varying float vDistortionPosition;

uniform float uDistortionPosition;
uniform float uDistortionAmount;
uniform float uTime;

attribute vec3 aCentroid;

// float random (vec2 st) {
//     return fract(sin(dot(st.xy,
//                          vec2(12.9898,78.233)))*
//         43758.5453123);
// }

mat2 rotate2D(in float angle) {
  return mat2(cos(angle), -sin(angle),
              sin(angle), cos(angle));
}

void main() {
  vec3 pos = position;

  // Make if fatter using `uDistortionPosition`
  float distortion = smoothstep(0.5, 1.0, 1.0 - abs(position.y+uDistortionPosition))*0.2;
  pos.xz *= 1.0 + distortion;

  vec3 myCentroid = aCentroid;
  // myCentroid.xz *= 1.0 + rotate2D(distortion);
  // myCentroid.yz *= rotate2D(uTime*0.7);
  // pos += myCentroid*position.y;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  vPosition = position.xy;
  vDistortionPosition = uDistortionPosition;
}
