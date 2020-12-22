varying vec2 vPosition;
varying float vDistortionPosition;
varying float vDistortionThickness;

uniform float uDistortionPosition;
uniform float uDistortionAmount;
uniform float uDistortionThickness;
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

  // This defines how much the effect impacts.
  float distortion = smoothstep(uDistortionThickness, 1.0, 1.0 - abs(position.y+uDistortionPosition))*uDistortionAmount;

  // Get the local coordinates of each triangle.
  vec3 localPos = pos - aCentroid;

  // Random value used to rotate and position each triangle.
  float rand = Hash21(aCentroid.xy) + Hash21(aCentroid.yz);

  // Rotate the triangles around all the axis
  localPos.xz *= rotate2D(distortion * 15.0 * uDistortionPosition * rand);
  localPos.xy *= rotate2D(distortion * 35.0 * uDistortionPosition * rand);
  localPos.yz *= rotate2D(distortion * -84.0 * uDistortionPosition * rand);

  // Place the triangles to their original position after having rotated them.
  pos = aCentroid + localPos;

  // Move outside the triangles based on a random value * the distortion.
  pos += aCentroid * rand * distortion;

  // Apply a rotation on the Y axis to the whole mesh.
  pos.xz *= rotate2D(uTime*0.25 - 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  vPosition = position.xy;
  vDistortionPosition = uDistortionPosition;
  vDistortionThickness = uDistortionThickness;
}
