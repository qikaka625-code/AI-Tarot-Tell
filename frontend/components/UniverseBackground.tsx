import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- SHADERS ---

const StarShader = {
  vertexShader: `
    attribute float aScale;
    uniform float uTime;
    varying float vAlpha;
    
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation based on depth
      gl_PointSize = aScale * (300.0 / -mvPosition.z);
      
      // Twinkle effect: sin wave based on time and position
      float twinkle = sin(uTime * 1.5 + position.x * 10.0 + position.z * 5.0);
      vAlpha = 0.5 + 0.5 * twinkle; 
    }
  `,
  fragmentShader: `
    varying float vAlpha;
    
    void main() {
      // Circular soft particle
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if(dist > 0.5) discard;
      
      // Soft edge glow
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 2.0);
      
      gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha * strength);
    }
  `
};

const NebulaShader = {
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

        // Simple noise function
        float random (in vec2 _st) {
            return fract(sin(dot(_st.xy, vec2(12.9898,78.233)))*43758.5453123);
        }

        // 2D Noise based on Morgan McGuire @morgan3d
        float noise (in vec2 _st) {
            vec2 i = floor(_st);
            vec2 f = fract(_st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        #define NUM_OCTAVES 5

        float fbm ( in vec2 _st) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            // Rotate to reduce axial bias
            mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
            for (int i = 0; i < NUM_OCTAVES; ++i) {
                v += a * noise(_st);
                _st = rot * _st * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 st = vUv * 3.0;
            
            // Flow animation
            float time = uTime * 0.05;
            vec2 q = vec2(0.);
            q.x = fbm( st + 0.00*time);
            q.y = fbm( st + vec2(1.0));

            vec2 r = vec2(0.);
            r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*time );
            r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*time);

            float f = fbm(st+r);

            // Mix colors: Dark Blue/Purple to Transparent
            vec3 color = mix(vec3(0.05, 0.05, 0.1), vec3(0.1, 0.1, 0.2), clamp((f*f)*4.0,0.0,1.0));
            color = mix(color, vec3(0.15, 0.15, 0.3), clamp(length(q),0.0,1.0));
            
            // Vignette / Alpha mask
            float alpha = f * f * 0.8; 
            
            gl_FragColor = vec4(color, alpha * 0.3); // Low opacity background
        }
    `
};

// 1. Custom Star Field with Shader
const StarField = ({ count = 2000 }) => {
  const mesh = useRef<THREE.Points>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        // Spherical distribution
        const r = 30 + Math.random() * 60; // Distance from center
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        scales[i] = Math.random() * 2.0 + 0.5; // Base size multiplier
    }
    return { positions, scales };
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
        // Slow rotation of the entire sky
        mesh.current.rotation.y = state.clock.getElapsedTime() * 0.02;
        // Update shader time for twinkling
        // @ts-ignore
        mesh.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.positions.length / 3} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-aScale" count={particles.scales.length} array={particles.scales} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial 
        uniforms={uniforms}
        vertexShader={StarShader.vertexShader}
        fragmentShader={StarShader.fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false} // CRITICAL: Ignore fog so they shine through
      />
    </points>
  );
};

// 2. Flowing Nebula Mist Background
const NebulaMist = () => {
    const mesh = useRef<THREE.Mesh>(null);
    const uniforms = useMemo(() => ({
        uTime: { value: 0 }
    }), []);

    useFrame((state) => {
        if (mesh.current) {
            // @ts-ignore
            mesh.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
            // Subtle rotation
            mesh.current.rotation.z = state.clock.getElapsedTime() * 0.01;
        }
    });

    return (
        <mesh ref={mesh} position={[0, 0, -40]} rotation={[0, 0, 0]}>
            <planeGeometry args={[120, 120]} />
            <shaderMaterial 
                uniforms={uniforms}
                vertexShader={NebulaShader.vertexShader}
                fragmentShader={NebulaShader.fragmentShader}
                transparent={true}
                depthWrite={false}
                fog={false}
            />
        </mesh>
    );
}

// 3. Holographic Floor Grid (Subtle)
const HoloGrid = () => {
    const gridRef = useRef<THREE.Mesh>(null);
    
    // Shader for a fading grid
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#3c4043') } 
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
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
            float scale = 40.0;
            float moveY = uTime * 0.05; 
            
            vec2 grid = abs(fract(vUv * scale + vec2(0.0, moveY)) - 0.5) / fwidth(vUv * scale);
            float line = min(grid.x, grid.y);
            float alpha = 1.0 - min(line, 1.0);
            
            float dist = distance(vUv, vec2(0.5));
            float mask = 1.0 - smoothstep(0.0, 0.4, dist);
            
            gl_FragColor = vec4(uColor, alpha * mask * 0.15); 
        }
    `;

    useFrame((state) => {
        if (gridRef.current) {
            // @ts-ignore
            gridRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        <mesh ref={gridRef} position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[150, 150]} />
            <shaderMaterial 
                uniforms={uniforms}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                transparent={true}
                depthWrite={false}
                blending={THREE.NormalBlending}
                side={THREE.DoubleSide}
                fog={false}
            />
        </mesh>
    );
};

const UniverseBackground = () => {
  return (
    <group>
        {/* Deep background color sphere (The Void) */}
        <mesh scale={[200, 200, 200]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial color="#131314" side={THREE.BackSide} fog={false} />
        </mesh>
        
        <NebulaMist />
        <StarField count={2500} />
        <HoloGrid />
    </group>
  );
};

export default UniverseBackground;