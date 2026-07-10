uniform float uTime;
uniform float uClickTime;
uniform float uDistortionStrength;
uniform vec2 uSplashCenter;
uniform sampler2D uTexture; // Handle the image stream input
varying vec2 vUv;

void main() {
  float timeSinceClick = uTime - uClickTime;
  float dist = distance(vUv, uSplashCenter);

  // Propagate outward by subtracting dist from timeSinceClick
  // As time increases, the peak of the sine wave moves further away from the center
  float wave = sin(timeSinceClick * 12.0 - dist * 40.0) * uDistortionStrength;

  // Kill the wave trailing edge so it feels like a passing ripple ring
  float ringFalloff = exp(-dist * 2.0) * smoothstep(0.0, 0.5, timeSinceClick);
  wave *= ringFalloff;

  // Displace the coordinates outward from the click position
  vec2 distortedUv = vUv + normalize(vUv - uSplashCenter) * wave;

  // Ensure coordinates lock to borders to prevent screen edge bleeding
  distortedUv = clamp(distortedUv, 0.0, 1.0);

  // Sample the actual image pixels using the distorted UV mapping
  vec4 texColor = texture2D(uTexture, distortedUv);

  gl_FragColor = texColor;
}
