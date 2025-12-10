import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CardState, Language } from '../types';
import { createCardTexture } from '../utils/textureGenerator';
import gsap from 'gsap';

interface TarotCardProps {
  cardState: CardState;
  onCardClick: (uuid: string) => void;
  isHoverable: boolean;
  isShuffling?: boolean;
  language: Language;
}

const TarotCard: React.FC<TarotCardProps> = ({ cardState, onCardClick, isHoverable, isShuffling, language }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const frontMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const backMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHover] = useState(false);

  // Random seeds for vortex chaos
  const seeds = useMemo(() => ({
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
      radiusOffset: Math.random() * 2,
      yOffset: Math.random() * 1.5
  }), []);

  // --- TEXTURES ---
  const frontTexture = useMemo(() => {
    if (cardState.customTexture) {
        const tex = new THREE.Texture();
        const img = new Image();
        img.onload = () => { tex.needsUpdate = true; };
        img.src = cardState.customTexture;
        tex.image = img;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }
    const canvas = createCardTexture(cardState.data, language, false);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    // Anisotropy helps texture look sharp at oblique angles
    tex.anisotropy = 16;
    return tex;
  }, [cardState.data, cardState.customTexture, language]);

  const backTexture = useMemo(() => {
    const canvas = createCardTexture(cardState.data, language, true);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    return tex;
  }, [cardState.data, language]);

  // --- ANIMATION CONTROL ---
  // If NOT shuffling, sync with React State via GSAP
  useEffect(() => {
    if (meshRef.current && !isShuffling) {
        // Sync position directly from state for reliability
        gsap.to(meshRef.current.position, {
            x: cardState.position[0],
            y: cardState.position[1],
            z: cardState.position[2],
            duration: 0.6,
            overwrite: 'auto',
            ease: "power2.out"
        });

        gsap.to(meshRef.current.rotation, {
            x: cardState.rotation[0],
            y: cardState.rotation[1],
            z: cardState.rotation[2],
            duration: 0.6,
            overwrite: 'auto',
            ease: "power2.out"
        });
    }
  }, [cardState.position, cardState.rotation, isShuffling]);

  // --- FRAME LOOP (Vortex & Hover) ---
  useFrame((state) => {
      if (!meshRef.current) return;
      
      const time = state.clock.getElapsedTime();

      // 1. SHUFFLE ANIMATION (Overrides GSAP)
      if (isShuffling) {
          // Vortex Math
          const vortexSpeed = 2.0;
          const angle = time * vortexSpeed * seeds.speed + seeds.phase;
          const radius = 6 + Math.sin(time * 3 + seeds.phase) * 1.5 + seeds.radiusOffset;
          
          const targetX = Math.cos(angle) * radius;
          const targetZ = Math.sin(angle) * radius;
          const targetY = 2 + Math.sin(time * 4 + seeds.phase) * seeds.yOffset; // Float up and down

          // Lerp for smoothness
          meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.1);
          meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.1);
          meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);

          // Crazy Rotation
          meshRef.current.rotation.x += 0.02;
          meshRef.current.rotation.y += 0.05;
          meshRef.current.rotation.z += 0.01;
          
          return; // Skip hover logic when shuffling
      }

      // 2. HOVER EFFECT (When Interaction Allowed)
      if (isHoverable && hovered) {
          if (frontMatRef.current) frontMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(frontMatRef.current.emissiveIntensity, 0.3, 0.1);
          if (backMatRef.current) backMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(backMatRef.current.emissiveIntensity, 0.3, 0.1);
      } else {
           // Return to normal
           if (frontMatRef.current) frontMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(frontMatRef.current.emissiveIntensity, 0.05, 0.1);
           if (backMatRef.current) backMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(backMatRef.current.emissiveIntensity, 0.05, 0.1);
      }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onCardClick(cardState.uuid);
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        castShadow
        receiveShadow
      >
        {/* Increased size by 30% -> 2.5*1.3=3.25, 4.2*1.3=5.46 */}
        <boxGeometry args={[3.25, 5.46, 0.06]} />
        
        {/* SIDES: Metallic Gold - High Metalness for Gilded Edge Look */}
        <meshStandardMaterial attach="material-0" color="#b8860b" metalness={0.9} roughness={0.3} />
        <meshStandardMaterial attach="material-1" color="#b8860b" metalness={0.9} roughness={0.3} />
        <meshStandardMaterial attach="material-2" color="#b8860b" metalness={0.9} roughness={0.3} />
        <meshStandardMaterial attach="material-3" color="#b8860b" metalness={0.9} roughness={0.3} />
        
        {/* FRONT: Aged Parchment with Gold Foil */}
        {/* We use medium roughness so paper looks matte but gold (light colors) reflects a bit */}
        <meshStandardMaterial 
            ref={frontMatRef}
            attach="material-4" 
            map={frontTexture} 
            roughness={0.5} 
            metalness={0.4} 
            emissive="#ffffff"
            emissiveIntensity={0.05} 
        />
        
        {/* BACK: Deep Cosmic Matte with Glossy Gold */}
        <meshStandardMaterial 
            ref={backMatRef}
            attach="material-5" 
            map={backTexture} 
            roughness={0.4} 
            metalness={0.5}
            emissive="#4b0082" // Subtle purple glow
            emissiveIntensity={0.05}
        />
      </mesh>
    </group>
  );
};

export default TarotCard;