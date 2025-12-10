import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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

const Scene: React.FC<SceneProps> = ({ cards, onCardClick, interactionAllowed, isShuffling = false, language }) => {
  return (
    <Canvas 
      shadows 
      camera={{ position: [0, -4, 14], fov: 45 }} // Closer, slightly angled up
      className="w-full h-full block"
      gl={{ 
        antialias: true, 
        alpha: false,
        toneMappingExposure: 1.0 // Normalized exposure for Studio look
      }}
    >
      <Suspense fallback={null}>
        {/* 1. ATMOSPHERE - Dark Studio Grey */}
        <color attach="background" args={['#131314']} />
        {/* Light Fog just to fade the floor grid into the distance, but keep stars visible (stars will ignore fog) */}
        <fogExp2 attach="fog" args={['#131314', 0.002]} />
        
        <UniverseBackground />
        
        {/* 2. LIGHTING STRATEGY: Clean Studio Lighting */}
        
        {/* A. Ambient Light: Neutral, sufficient base brightness */}
        <ambientLight intensity={0.6} color="#ffffff" />
        
        {/* B. Key Light: Soft White from top-right */}
        <directionalLight 
            position={[10, 15, 10]} 
            intensity={1.0} 
            color="#ffffff" 
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
        />
        
        {/* C. Fill Light: Cool soft light from left */}
        <pointLight position={[-10, 5, 10]} intensity={0.4} color="#dbeafe" distance={20} />

        {/* D. Rim Light (Backlight): Subtle cool separation, less neon */}
        <spotLight 
          position={[0, 10, -10]} 
          angle={0.6} 
          penumbra={1} 
          intensity={2.5} 
          color="#a8c7fa"
          distance={50}
          castShadow={false}
        />

        {/* 3. CONTENT */}
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

        {/* Shadow Catcher Plane */}
        <mesh position={[0, 0, -0.05]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial opacity={0.3} color="#000" />
        </mesh>

        {/* Camera Controls */}
        <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.8}
            minDistance={8}
            maxDistance={25}
        />
      </Suspense>
    </Canvas>
  );
};

export default Scene;