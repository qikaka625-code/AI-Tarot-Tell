import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import TarotCard from './TarotCard';
import UniverseBackground from './UniverseBackground';
import { CardState, Language } from '../types';

interface SceneProps {
  cards: CardState[];
  onCardClick: (uuid: string) => void;
  interactionAllowed: boolean;
  isShuffling?: boolean;
  language: Language;
}

// Ambient particle field for magical atmosphere
const AmbientMagicParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 200;
  
  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const time = state.clock.getElapsedTime();
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += Math.sin(time * 0.5 + i) * 0.002;
      positions[i * 3] += Math.cos(time * 0.3 + i * 0.5) * 0.001;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.rotation.y = time * 0.02;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#a78bfa"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Pulsing light orb effect
const MysticalOrb = ({ position, color, intensity }: { position: [number, number, number], color: string, intensity: number }) => {
  const lightRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (!lightRef.current) return;
    const time = state.clock.getElapsedTime();
    lightRef.current.intensity = intensity * (0.7 + Math.sin(time * 2) * 0.3);
  });

  return (
    <pointLight 
      ref={lightRef}
      position={position}
      color={color}
      intensity={intensity}
      distance={30}
      decay={2}
    />
  );
};

const Scene: React.FC<SceneProps> = ({ cards, onCardClick, interactionAllowed, isShuffling = false, language }) => {
  return (
    <Canvas 
      shadows 
      camera={{ position: [0, -4, 14], fov: 45 }}
      className="w-full h-full block"
      gl={{ 
        antialias: true, 
        alpha: false,
        toneMappingExposure: 1.1,
        toneMapping: THREE.ACESFilmicToneMapping
      }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        {/* 1. ATMOSPHERE - Deep cosmic void */}
        <color attach="background" args={['#0a0a0f']} />
        <fogExp2 attach="fog" args={['#0a0a0f', 0.015]} />
        
        {/* Enhanced Universe Background */}
        <UniverseBackground />
        
        {/* 2. ENHANCED LIGHTING SYSTEM */}
        
        {/* A. Global Ambient - Soft cosmic glow */}
        <ambientLight intensity={0.4} color="#e8e0ff" />
        
        {/* B. Primary Key Light - Warm mystical from above */}
        <directionalLight 
          position={[8, 20, 12]} 
          intensity={1.2} 
          color="#fff8f0"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        
        {/* C. Secondary Key - Cool blue from opposite side */}
        <directionalLight 
          position={[-10, 10, 8]} 
          intensity={0.6} 
          color="#b4c7ff"
        />
        
        {/* D. Fill Light - Soft purple from below for mystical feel */}
        <pointLight 
          position={[0, -5, 5]} 
          intensity={0.5} 
          color="#c4b5fd" 
          distance={25}
        />

        {/* E. Rim/Back Light - Strong separation with ethereal glow */}
        <spotLight 
          position={[0, 12, -15]} 
          angle={0.5} 
          penumbra={1} 
          intensity={3.0} 
          color="#818cf8"
          distance={60}
          castShadow={false}
        />
        
        {/* F. Accent Lights - Mystical colored orbs */}
        <MysticalOrb position={[-12, 3, 5]} color="#f472b6" intensity={0.8} />
        <MysticalOrb position={[12, 3, 5]} color="#60a5fa" intensity={0.8} />
        <MysticalOrb position={[0, 8, -5]} color="#a78bfa" intensity={0.6} />
        
        {/* G. Ground reflection light */}
        <pointLight 
          position={[0, -3, 0]} 
          intensity={0.3} 
          color="#4c1d95" 
          distance={15}
        />

        {/* 3. MAGICAL PARTICLES */}
        <AmbientMagicParticles />

        {/* 4. CONTENT - Cards */}
        <group>
          {cards.map((card) => (
            <TarotCard 
              key={card.uuid} 
              cardState={card} 
              onCardClick={onCardClick}
              isHoverable={interactionAllowed}
              isShuffling={isShuffling}
              language={language}
            />
          ))}
        </group>

        {/* 5. Shadow Catcher - Enhanced with gradient */}
        <mesh position={[0, -0.1, -0.05]} receiveShadow rotation={[-0.1, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial opacity={0.4} color="#1a1a2e" />
        </mesh>

        {/* 6. Camera Controls - Enhanced for better user experience */}
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.7}
          minDistance={8}
          maxDistance={22}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />
      </Suspense>
    </Canvas>
  );
};

export default Scene;
