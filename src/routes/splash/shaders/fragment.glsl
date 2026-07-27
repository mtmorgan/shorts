uniform float uTime;
uniform sampler2D uTexture;
uniform float uAspect;

uniform vec2 uSplashCenter;
uniform float uClickTime;
uniform float uStrength;
uniform float uFrequency;
uniform float uSpeed;
uniform float uRadius;

#define MAX_RAIN_DROPS 50
uniform vec2 uRainCenters[MAX_RAIN_DROPS];
uniform float uRainTimes[MAX_RAIN_DROPS];
uniform float uRainStrengths[MAX_RAIN_DROPS];

varying vec2 vUv;

void main() {
  // Horizon & clamp
  float horizonY = 0.69;
  float horizonMask = smoothstep(horizonY, horizonY * 0.9, vUv.y);

  // Perspective calculation
  float distToHorizon = abs(vUv.y - horizonY);
  float horizonDepth = 1.0 / (pow(distToHorizon, 2.0) * 18.5 + 0.02);
  float foregroundBlend = smoothstep(2., 0.0, vUv.y);
  float depthScale = mix(horizonDepth, 1.0, foregroundBlend);

  vec2 totalDisplacement = vec2(0.0);

  // 1. Splash from user clicks
  if (uStrength > 0.0) {
    float timeSinceClick = uTime - uClickTime;
    if (timeSinceClick > 0.0 && timeSinceClick < 3.0) {
      vec2 uvDiff = vUv - uSplashCenter;
      vec2 perspectiveDiff = vec2(uvDiff.x * uAspect, uvDiff.y * depthScale);
      float dist = length(perspectiveDiff);
      if (dist > 0.05) {
        float wavePhase = timeSinceClick * uSpeed - dist * uFrequency;
        float baseWave = sin(wavePhase);

        float waveFrontSpeed = uSpeed / 45.0;
        float waveFront = smoothstep(timeSinceClick * waveFrontSpeed + 0.1, timeSinceClick * waveFrontSpeed, dist);
        float wakeDecay = smoothstep(0.0, 0.4, timeSinceClick - dist);
        float distanceMask = smoothstep(uRadius, uRadius * 0.7, dist);

        float finalWave = baseWave * waveFront * wakeDecay * distanceMask * horizonMask * uStrength;
        totalDisplacement += normalize(uvDiff) * finalWave;
      }
    }
  }

  // 2. Ambient raindrops from circular buffer
  for (int i = 0; i < MAX_RAIN_DROPS; i++) {
    float rainTime = uRainTimes[i];
    float rainStrength = uRainStrengths[i];
    if (rainTime > 0.0 && rainStrength > 0.0) {
      float timeSinceRain = uTime - rainTime;
      if (timeSinceRain > 0.0 && timeSinceRain < 2.5) {
        vec2 uvDiff = vUv - uRainCenters[i];
        vec2 perspectiveDiff = vec2(uvDiff.x * uAspect, uvDiff.y * depthScale);
        float dist = length(perspectiveDiff);
        if (dist > 0.01) {
          float wavePhase = timeSinceRain * uSpeed - dist * uFrequency;
          float baseWave = sin(wavePhase);

          float waveFrontSpeed = uSpeed / 45.0;
          float waveFront = smoothstep(timeSinceRain * waveFrontSpeed + 0.1, timeSinceRain * waveFrontSpeed, dist);
          float wakeDecay = smoothstep(0.0, 0.4, timeSinceRain - dist) * (1.0 - smoothstep(0.0, 2.0, timeSinceRain));
          float rainRadius = uRadius * 0.6;
          float distanceMask = smoothstep(rainRadius, rainRadius * 0.7, dist);

          float finalWave = baseWave * waveFront * wakeDecay * distanceMask * horizonMask * rainStrength;
          totalDisplacement += normalize(uvDiff) * finalWave;
        }
      }
    }
  }

  vec2 distortedUv = vUv + totalDisplacement;

  gl_FragColor = texture2D(uTexture, clamp(distortedUv, 0.0, 1.0));

  if (false) {
    // =========================================================================
    // DEBUG MODE: VISUALIZE PERSPECTIVE GRID OVERLAY
    // =========================================================================
    vec4 baseColor = texture2D(uTexture, distortedUv);

    // Create your virtual perspective mapping space
    vec2 gridUv = vec2(vUv.x * uAspect, vUv.y * depthScale);

    // Use sine waves over coordinates to create a repeated tile pattern
    // Change 40.0 to increase or decrease the number of grid lines
    float gridLinesX = sin(gridUv.x * 40.0);
    float gridLinesY = sin(gridUv.y * 40.0);

    // Filter out thin borders (closer to 1.0 means thinner, sharper grid lines)
    float lineThreshold = 0.95;
    float isLineX = smoothstep(lineThreshold, 1.0, gridLinesX);
    float isLineY = smoothstep(lineThreshold, 1.0, gridLinesY);

    // Combine horizontal and vertical grid lines
    float gridMask = max(isLineX, isLineY);

    // Cut off the grid lines completely above the 2/3 horizon boundary line
    gridMask *= smoothstep(horizonY, horizonY * 0.9, vUv.y);

    // Define bright neon overlay colors for inspection
    vec4 gridColor = vec4(0.0, 1.0, 1.0, 1.0); // Cyan Grid Lines
    vec4 horizonColor = vec4(1.0, 0.0, 0.0, 1.0); // Red Horizon Target Line

    // Draw a strict 1-pixel red baseline right over the exact  horizon mark
    float isHorizon = smoothstep(0.003, 0.0, abs(vUv.y - horizonY));

    // Blend the grid lines and horizon marker on top of your background picture
    vec4 finalRender = mix(baseColor, gridColor, gridMask * 0.6); // 60% grid opacity
    finalRender = mix(finalRender, horizonColor, isHorizon);

    // Output the composite debug visualization frame
    gl_FragColor = finalRender;
  }
}
