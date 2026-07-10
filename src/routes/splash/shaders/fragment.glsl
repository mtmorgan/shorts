uniform float uTime;
uniform float uClickTime;
uniform float uDistortionStrength;
uniform float uWaveFrequency;
uniform float uExpansionSpeed;
uniform vec2 uSplashCenter;
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
  float timeSinceClick = uTime - uClickTime;
  float dist = distance(vUv, uSplashCenter);

  // 1. Core Wave Equation
  // Higher frequency (45.0) creates tighter, multiple concentric rings.
  // Higher speed (15.0) makes the ripples race outward faster.
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

  // 4. Combine into an isolated, propagating wave packet
  // The overall distortion strength scales down based on the Svelte file's lerp decay
  float finalWave = baseWave * waveFront * wakeDecay * uDistortionStrength;

  // 5. Apply the refraction displacement vectors
  vec2 distortedUv = vUv + normalize(vUv - uSplashCenter) * finalWave;

  // Keep UVs clamped inside safe 0.0-1.0 texture boundaries
  distortedUv = clamp(distortedUv, 0.0, 1.0);

  gl_FragColor = texture2D(uTexture, distortedUv);
}
