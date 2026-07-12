uniform float uTime;
uniform float uClickTime;
uniform float uDistortionStrength;
uniform float uWaveFrequency;
uniform float uExpansionSpeed;
uniform float uMaxRadius;
uniform vec2 uSplashCenter;
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
  float timeSinceClick = uTime - uClickTime;
  float dist = distance(vUv, uSplashCenter);

  // 1. Core Wave Equation
  // Higher frequency (e.g., 45.0) creates tighter, multiple concentric rings.
  // Higher speed (e.g., 15.0) makes the ripples race outward faster.
  float wavePhase = timeSinceClick * uExpansionSpeed - dist * uWaveFrequency;
  float baseWave = sin(wavePhase);

  // 2. Define the Leading Edge of the Ripple
  // This stops rings from appearing instantly across the whole screen.
  // It creates a boundary wavefront that expands over time.
  float waveFrontSpeed = uExpansionSpeed / 45.0;
  float waveFront = smoothstep(
      timeSinceClick * waveFrontSpeed + 0.1,
      timeSinceClick * waveFrontSpeed, dist
    );

  // 3. Define the Trailing Edge (The Calm Wake)
  // This dampens the center over time so it stops shaking after the rings pass.
  float wakeDecay = smoothstep(0.0, 0.4, timeSinceClick - dist);

  // 4. Define the Distance Boundary Mask (Restricted to 10% of texture space)
  float distanceMask = smoothstep(uMaxRadius, uMaxRadius * 0.7, dist);
  // 5. Combine into an isolated, propagating wave packet
  // The overall distortion strength scales down based on the Svelte file's lerp decay
  float finalWave = baseWave * waveFront * wakeDecay * distanceMask * uDistortionStrength;
  // 6. Apply the refraction displacement vectors
  vec2 distortedUv = vUv;
  if (dist > 0.0) {
    distortedUv += normalize(vUv - uSplashCenter) * finalWave;
  }

  // Keep UVs clamped inside safe 0.0-1.0 texture boundaries
  distortedUv = clamp(distortedUv, 0.0, 1.0);

  gl_FragColor = texture2D(uTexture, distortedUv);
}
