import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- ENHANCED SHADERS ---

const TwinklingStarShader = {
  vertexShader: `
    attribute float aScale;
    attribute float aPhase;
    attribute vec3 aColor;
    uniform float uTime;
    varying float vAlpha;
    varying vec3 vColor;
    
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Enhanced size attenuation
      gl_PointSize = aScale * (400.0 / -mvPosition.z);
      
      // Multi-frequency twinkle for more natural effect
      float twinkle1 = sin(uTime * 2.0 + aPhase);
      float twinkle2 = sin(uTime * 3.7 + aPhase * 1.3) * 0.5;
      float twinkle3 = sin(uTime * 1.2 + aPhase * 0.7) * 0.3;
      float combined = (twinkle1 + twinkle2 + twinkle3) / 1.8;
      
      vAlpha = 0.4 + 0.6 * (combined * 0.5 + 0.5);
      vColor = aColor;
    }
  `,
  fragmentShader: `
    varying float vAlpha;
    varying vec3 vColor;
    
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if(dist > 0.5) discard;
      
      // Multi-layered glow effect
      float core = 1.0 - smoothstep(0.0, 0.15, dist);
      float inner = 1.0 - smoothstep(0.0, 0.3, dist);
      float outer = 1.0 - smoothstep(0.0, 0.5, dist);
      
      float strength = core * 1.0 + inner * 0.4 + outer * 0.2;
      
      // Add color bloom
      vec3 finalColor = vColor + vec3(0.3, 0.3, 0.5) * core;
      
      gl_FragColor = vec4(finalColor, vAlpha * strength);
    }
  `
};

const EnhancedNebulaShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;

    // Improved noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for(int i = 0; i < 6; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }

    void main() {
      vec2 st = vUv * 2.0 - 1.0;
      float time = uTime * 0.03;
      
      // Multi-layer noise for depth
      vec3 p = vec3(st * 3.0, time);
      float n1 = fbm(p);
      float n2 = fbm(p + vec3(5.2, 1.3, 0.0));
      float n3 = fbm(p + vec3(n1, n2, time * 0.5));
      
      // Cosmic color palette - purple, blue, pink, gold
      vec3 color1 = vec3(0.1, 0.05, 0.2);   // Deep purple
      vec3 color2 = vec3(0.05, 0.1, 0.25);  // Deep blue
      vec3 color3 = vec3(0.25, 0.1, 0.3);   // Magenta
      vec3 color4 = vec3(0.15, 0.12, 0.05); // Gold hint
      vec3 color5 = vec3(0.1, 0.2, 0.3);    // Teal
      
      // Complex color mixing
      float blend1 = smoothstep(-0.5, 0.5, n1);
      float blend2 = smoothstep(-0.3, 0.7, n2);
      float blend3 = smoothstep(-0.2, 0.8, n3);
      
      vec3 color = mix(color1, color2, blend1);
      color = mix(color, color3, blend2 * 0.6);
      color = mix(color, color4, blend3 * 0.3);
      color = mix(color, color5, (n1 + n2) * 0.2);
      
      // Add bright nebula highlights
      float highlight = pow(max(0.0, n3), 3.0) * 0.5;
      color += vec3(0.4, 0.2, 0.5) * highlight;
      
      // Radial vignette
      float dist = length(st);
      float vignette = 1.0 - smoothstep(0.3, 1.5, dist);
      
      // Alpha based on noise density
      float alpha = (0.2 + n3 * 0.3) * vignette;
      
      gl_FragColor = vec4(color, alpha * 0.6);
    }
  `
};

const ShootingStarShader = {
  vertexShader: `
    attribute float aProgress;
    attribute float aLength;
    attribute float aBrightness;
    varying float vProgress;
    varying float vBrightness;
    
    void main() {
      vProgress = aProgress;
      vBrightness = aBrightness;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = (3.0 + aBrightness * 4.0) * (200.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    varying float vProgress;
    varying float vBrightness;
    
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if(dist > 0.5) discard;
      
      // Bright core with soft glow
      float core = 1.0 - smoothstep(0.0, 0.2, dist);
      float glow = 1.0 - smoothstep(0.0, 0.5, dist);
      
      // Fade based on trail progress
      float fade = 1.0 - vProgress;
      fade = pow(fade, 0.5);
      
      vec3 color = vec3(1.0, 0.95, 0.8) * core + vec3(0.6, 0.7, 1.0) * glow * 0.5;
      float alpha = (core + glow * 0.3) * fade * vBrightness;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
};

// 1. Enhanced Multi-layer Star Field
const StarField = ({ count = 3000, layer = 0 }) => {
  const mesh = useRef<THREE.Points>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    // Star color palette
    const starColors = [
      [1.0, 1.0, 1.0],      // White
      [0.9, 0.95, 1.0],     // Cool white
      [1.0, 0.95, 0.9],     // Warm white
      [0.8, 0.85, 1.0],     // Blue-white
      [1.0, 0.9, 0.8],      // Yellow-white
      [0.7, 0.8, 1.0],      // Light blue
      [1.0, 0.85, 0.7],     // Orange tint
      [0.9, 0.7, 1.0],      // Purple tint
    ];

    const minRadius = 25 + layer * 20;
    const maxRadius = 60 + layer * 30;

    for (let i = 0; i < count; i++) {
      // Spherical distribution with layering
      const r = minRadius + Math.random() * (maxRadius - minRadius);
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Varied star sizes
      const sizeRandom = Math.random();
      scales[i] = sizeRandom < 0.7 ? 0.5 + Math.random() * 1.0 : // Most stars small
                  sizeRandom < 0.95 ? 1.5 + Math.random() * 1.5 : // Some medium
                  3.0 + Math.random() * 2.0; // Few bright ones
      
      phases[i] = Math.random() * Math.PI * 2;

      // Random star color
      const colorIndex = Math.floor(Math.random() * starColors.length);
      const color = starColors[colorIndex];
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }
    return { positions, scales, phases, colors };
  }, [count, layer]);

  useFrame((state) => {
    if (mesh.current) {
      const rotSpeed = 0.015 - layer * 0.005;
      mesh.current.rotation.y = state.clock.getElapsedTime() * rotSpeed;
      mesh.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.01) * 0.1;
      // @ts-ignore
      mesh.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.positions.length / 3} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-aScale" count={particles.scales.length} array={particles.scales} itemSize={1} />
        <bufferAttribute attach="attributes-aPhase" count={particles.phases.length} array={particles.phases} itemSize={1} />
        <bufferAttribute attach="attributes-aColor" count={particles.colors.length / 3} array={particles.colors} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial 
        uniforms={uniforms}
        vertexShader={TwinklingStarShader.vertexShader}
        fragmentShader={TwinklingStarShader.fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  );
};

// 2. Shooting Stars System
const ShootingStars = () => {
  const mesh = useRef<THREE.Points>(null);
  const dataRef = useRef<{
    positions: Float32Array;
    progress: Float32Array;
    lengths: Float32Array;
    brightness: Float32Array;
    velocities: Float32Array;
    active: boolean[];
    lastSpawn: number;
  } | null>(null);

  const maxStars = 20;
  const trailLength = 15;
  const totalPoints = maxStars * trailLength;

  useMemo(() => {
    dataRef.current = {
      positions: new Float32Array(totalPoints * 3),
      progress: new Float32Array(totalPoints),
      lengths: new Float32Array(totalPoints),
      brightness: new Float32Array(totalPoints),
      velocities: new Float32Array(maxStars * 3),
      active: new Array(maxStars).fill(false),
      lastSpawn: 0
    };
    
    // Initialize all positions off-screen
    for (let i = 0; i < totalPoints * 3; i++) {
      dataRef.current.positions[i] = -1000;
    }
  }, []);

  const spawnShootingStar = (index: number) => {
    if (!dataRef.current) return;
    
    // Random spawn position in upper hemisphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.4; // Upper portion
    const r = 40 + Math.random() * 20;
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi) + 10;
    const z = r * Math.sin(phi) * Math.sin(theta);
    
    // Velocity - mostly downward with some horizontal
    const speed = 0.8 + Math.random() * 0.5;
    dataRef.current.velocities[index * 3] = (Math.random() - 0.5) * speed;
    dataRef.current.velocities[index * 3 + 1] = -speed * (0.5 + Math.random() * 0.5);
    dataRef.current.velocities[index * 3 + 2] = (Math.random() - 0.5) * speed;
    
    // Initialize trail
    for (let t = 0; t < trailLength; t++) {
      const idx = index * trailLength + t;
      dataRef.current.positions[idx * 3] = x;
      dataRef.current.positions[idx * 3 + 1] = y;
      dataRef.current.positions[idx * 3 + 2] = z;
      dataRef.current.progress[idx] = t / trailLength;
      dataRef.current.brightness[idx] = 0.8 + Math.random() * 0.2;
    }
    
    dataRef.current.active[index] = true;
  };

  useFrame((state, delta) => {
    if (!mesh.current || !dataRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Spawn new shooting stars randomly
    if (time - dataRef.current.lastSpawn > 0.5 + Math.random() * 2) {
      const inactiveIndex = dataRef.current.active.findIndex(a => !a);
      if (inactiveIndex !== -1) {
        spawnShootingStar(inactiveIndex);
        dataRef.current.lastSpawn = time;
      }
    }
    
    // Update active shooting stars
    for (let i = 0; i < maxStars; i++) {
      if (!dataRef.current.active[i]) continue;
      
      const vx = dataRef.current.velocities[i * 3];
      const vy = dataRef.current.velocities[i * 3 + 1];
      const vz = dataRef.current.velocities[i * 3 + 2];
      
      // Move trail points (cascade effect)
      for (let t = trailLength - 1; t > 0; t--) {
        const idx = i * trailLength + t;
        const prevIdx = i * trailLength + t - 1;
        dataRef.current.positions[idx * 3] = dataRef.current.positions[prevIdx * 3];
        dataRef.current.positions[idx * 3 + 1] = dataRef.current.positions[prevIdx * 3 + 1];
        dataRef.current.positions[idx * 3 + 2] = dataRef.current.positions[prevIdx * 3 + 2];
      }
      
      // Move head
      const headIdx = i * trailLength;
      dataRef.current.positions[headIdx * 3] += vx;
      dataRef.current.positions[headIdx * 3 + 1] += vy;
      dataRef.current.positions[headIdx * 3 + 2] += vz;
      
      // Deactivate if out of view
      if (dataRef.current.positions[headIdx * 3 + 1] < -30) {
        dataRef.current.active[i] = false;
        for (let t = 0; t < trailLength; t++) {
          const idx = i * trailLength + t;
          dataRef.current.positions[idx * 3] = -1000;
          dataRef.current.positions[idx * 3 + 1] = -1000;
          dataRef.current.positions[idx * 3 + 2] = -1000;
        }
      }
    }
    
    // Update geometry
    const geo = mesh.current.geometry;
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={totalPoints} 
          array={dataRef.current?.positions || new Float32Array(totalPoints * 3)} 
          itemSize={3} 
        />
        <bufferAttribute 
          attach="attributes-aProgress" 
          count={totalPoints} 
          array={dataRef.current?.progress || new Float32Array(totalPoints)} 
          itemSize={1} 
        />
        <bufferAttribute 
          attach="attributes-aBrightness" 
          count={totalPoints} 
          array={dataRef.current?.brightness || new Float32Array(totalPoints)} 
          itemSize={1} 
        />
      </bufferGeometry>
      <shaderMaterial 
        vertexShader={ShootingStarShader.vertexShader}
        fragmentShader={ShootingStarShader.fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  );
};

// 3. Enhanced Flowing Nebula
const NebulaMist = () => {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    if (mesh.current) {
      // @ts-ignore
      mesh.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
      mesh.current.rotation.z = state.clock.getElapsedTime() * 0.005;
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, -50]} rotation={[0, 0, 0]}>
      <planeGeometry args={[200, 200]} />
      <shaderMaterial 
        uniforms={uniforms}
        vertexShader={EnhancedNebulaShader.vertexShader}
        fragmentShader={EnhancedNebulaShader.fragmentShader}
        transparent={true}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
};

// 4. Cosmic Dust Particles
const CosmicDust = ({ count = 500 }) => {
  const mesh = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Scattered in viewing area
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
      
      sizes[i] = 0.02 + Math.random() * 0.05;
      speeds[i] = 0.1 + Math.random() * 0.3;
    }
    return { positions, sizes, speeds };
  }, [count]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    
    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.getElapsedTime();
    
    for (let i = 0; i < count; i++) {
      // Gentle floating motion
      positions[i * 3] += Math.sin(time * particles.speeds[i] + i) * 0.002;
      positions[i * 3 + 1] += Math.cos(time * particles.speeds[i] * 0.7 + i) * 0.001;
      positions[i * 3 + 2] += Math.sin(time * 0.1 + i * 0.1) * 0.001;
    }
    
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles.positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#8b9dc3"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// 5. Mystical Aura Ring
const MysticalAura = () => {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.z = state.clock.getElapsedTime() * 0.1;
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
      mesh.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, -2]} rotation={[0.3, 0, 0]}>
      <ringGeometry args={[12, 14, 64]} />
      <meshBasicMaterial
        color="#4a1f7a"
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// 6. Enhanced Holographic Floor Grid
const HoloGrid = () => {
  const gridRef = useRef<THREE.Mesh>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#2a2d3e') },
    uColor2: { value: new THREE.Color('#4a3f6b') }
  }), []);

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    varying vec2 vUv;

    void main() {
      float scale = 30.0;
      float moveY = uTime * 0.08;
      
      vec2 grid = abs(fract(vUv * scale + vec2(0.0, moveY)) - 0.5) / fwidth(vUv * scale);
      float line = min(grid.x, grid.y);
      float alpha = 1.0 - min(line, 1.0);
      
      // Distance-based fade
      float dist = distance(vUv, vec2(0.5));
      float mask = 1.0 - smoothstep(0.0, 0.5, dist);
      
      // Pulse effect
      float pulse = 0.5 + 0.5 * sin(uTime * 0.5 - dist * 5.0);
      
      // Color gradient
      vec3 color = mix(uColor1, uColor2, pulse);
      
      gl_FragColor = vec4(color, alpha * mask * 0.2 * pulse);
    }
  `;

  useFrame((state) => {
    if (gridRef.current) {
      // @ts-ignore
      gridRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={gridRef} position={[0, -6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[200, 200]} />
      <shaderMaterial 
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        fog={false}
      />
    </mesh>
  );
};

const UniverseBackground = () => {
  return (
    <group>
      {/* Deep space background sphere */}
      <mesh scale={[250, 250, 250]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial 
          color="#0a0a0f" 
          side={THREE.BackSide} 
          fog={false} 
        />
      </mesh>
      
      {/* Multi-layer nebula for depth */}
      <NebulaMist />
      
      {/* Three layers of stars at different distances */}
      <StarField count={1500} layer={0} />
      <StarField count={2000} layer={1} />
      <StarField count={2500} layer={2} />
      
      {/* Dynamic shooting stars */}
      <ShootingStars />
      
      {/* Floating cosmic dust */}
      <CosmicDust count={400} />
      
      {/* Mystical aura effect */}
      <MysticalAura />
      
      {/* Enhanced floor grid */}
      <HoloGrid />
    </group>
  );
};

export default UniverseBackground;
