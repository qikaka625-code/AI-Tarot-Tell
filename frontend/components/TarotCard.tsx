import React, { useMemo, useRef, useState } from 'react';
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

// --- EASING FUNCTIONS ---
const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const TarotCard: React.FC<TarotCardProps> = ({ cardState, onCardClick, isHoverable, isShuffling, language }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const frontMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const backMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHover] = useState(false);
  
  // Track shuffle start time using Three.js clock
  const shuffleStartTime = useRef<number>(-1);
  const wasShuffling = useRef<boolean>(false);

  // Random seeds for vortex chaos - each card gets unique motion
  const seeds = useMemo(() => ({
    phase: Math.random() * Math.PI * 2,
    speed: 0.6 + Math.random() * 0.8,
    radiusOffset: Math.random() * 3,
    yOffset: 1.5 + Math.random() * 2,
    spiralTightness: 0.3 + Math.random() * 0.4,
    floatFrequency: 2 + Math.random() * 3,
    rotationBias: (Math.random() - 0.5) * 0.1,
    orbitOffset: Math.random() * Math.PI * 2
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

  // --- FRAME LOOP ---
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();

    // Detect shuffle start
    if (isShuffling && !wasShuffling.current) {
      shuffleStartTime.current = time;
    }
    wasShuffling.current = isShuffling || false;

    // 1. SHUFFLE ANIMATION (5 seconds total)
    if (isShuffling && shuffleStartTime.current >= 0) {
      const localTime = time - shuffleStartTime.current;
      
      // Phase timing (5 seconds total)
      const phase1End = 0.8;    // Gather & lift
      const phase2End = 4.2;    // Spiral vortex (main show)
      const totalDuration = 5.0; // Settle down
      
      let targetX = 0, targetY = 0, targetZ = 0;
      let targetRotX = 0, targetRotY = 0, targetRotZ = 0;

      if (localTime < phase1End) {
        // Phase 1: Gather to center, lift up dramatically
        const t = easeInOutCubic(localTime / phase1End);
        targetX = THREE.MathUtils.lerp(meshRef.current.position.x, 0, t * 0.5);
        targetY = THREE.MathUtils.lerp(0, 4 + seeds.yOffset * 0.5, t);
        targetZ = THREE.MathUtils.lerp(meshRef.current.position.z, seeds.phase * 0.1, t * 0.5);
        
        // Gentle wobble starting
        targetRotX = Math.sin(time * 5 + seeds.phase) * 0.15 * t;
        targetRotY = Math.PI + Math.sin(time * 3 + seeds.orbitOffset) * 0.3 * t;
        targetRotZ = Math.cos(time * 4 + seeds.phase) * 0.15 * t;
        
      } else if (localTime < phase2End) {
        // Phase 2: Dramatic 3D spiral vortex (main animation)
        const phaseTime = (localTime - phase1End) / (phase2End - phase1End);
        const easedTime = easeInOutCubic(Math.min(phaseTime, 1));
        
        // Multi-layered spiral motion
        const vortexSpeed = 2.5 * seeds.speed;
        const angle = time * vortexSpeed + seeds.phase;
        const secondaryAngle = time * vortexSpeed * 0.6 + seeds.orbitOffset;
        
        // Dynamic radius - expands then contracts
        const radiusPulse = Math.sin(phaseTime * Math.PI * 2) * 1.5;
        const baseRadius = 6 + radiusPulse + seeds.radiusOffset;
        const spiralRadius = baseRadius * (1 - seeds.spiralTightness * easedTime * 0.5);
        
        // 3D helix motion
        targetX = Math.cos(angle) * spiralRadius + Math.sin(secondaryAngle) * 2;
        targetZ = Math.sin(angle) * spiralRadius + Math.cos(secondaryAngle) * 2;
        
        // Vertical wave motion with arc
        const verticalWave = Math.sin(time * seeds.floatFrequency + seeds.phase) * seeds.yOffset;
        const heightArc = 4 + Math.sin(phaseTime * Math.PI) * 3; // Arcs up in middle
        targetY = heightArc + verticalWave * 0.5;
        
        // Dramatic tumbling rotation
        targetRotX = time * 2.0 * seeds.speed + seeds.rotationBias;
        targetRotY = time * 3.5 * seeds.speed;
        targetRotZ = Math.sin(time * 2.5 + seeds.phase) * 1.0;
        
      } else {
        // Phase 3: Settle down gracefully with bounce
        const phaseTime = (localTime - phase2End) / (totalDuration - phase2End);
        const easedTime = easeOutElastic(Math.min(phaseTime, 1));
        
        targetX = THREE.MathUtils.lerp(meshRef.current.position.x, 0, easedTime * 0.6);
        targetY = THREE.MathUtils.lerp(meshRef.current.position.y, 0, easedTime);
        targetZ = THREE.MathUtils.lerp(meshRef.current.position.z, seeds.phase * 0.015, easedTime);
        
        // Settle rotation to face down
        targetRotX = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, easedTime);
        targetRotY = THREE.MathUtils.lerp(meshRef.current.rotation.y, Math.PI, easedTime);
        targetRotZ = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, easedTime);
      }

      // Smooth interpolation for fluid motion
      const lerpFactor = 0.1;
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, lerpFactor);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, lerpFactor);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, lerpFactor);
      
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, lerpFactor * 0.7);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, lerpFactor * 0.7);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotZ, lerpFactor * 0.7);

      // Enhanced glow during shuffle
      if (frontMatRef.current) {
        const glowIntensity = 0.2 + Math.sin(time * 8 + seeds.phase) * 0.15;
        frontMatRef.current.emissiveIntensity = glowIntensity;
      }
      if (backMatRef.current) {
        const glowIntensity = 0.25 + Math.sin(time * 6 + seeds.orbitOffset) * 0.2;
        backMatRef.current.emissiveIntensity = glowIntensity;
      }
      
      return;
    }

    // Reset shuffle start time when not shuffling
    if (!isShuffling) {
      shuffleStartTime.current = -1;
    }

    // 2. GSAP position sync when not shuffling
    if (!isShuffling) {
      gsap.to(meshRef.current.position, {
        x: cardState.position[0],
        y: cardState.position[1],
        z: cardState.position[2],
        duration: 0.8,
        overwrite: 'auto',
        ease: "elastic.out(1, 0.5)"
      });

      gsap.to(meshRef.current.rotation, {
        x: cardState.rotation[0],
        y: cardState.rotation[1],
        z: cardState.rotation[2],
        duration: 0.7,
        overwrite: 'auto',
        ease: "back.out(1.7)"
      });
    }

    // 3. HOVER EFFECT
    if (isHoverable && hovered) {
      const hoverFloat = Math.sin(time * 3) * 0.05;
      meshRef.current.position.y += hoverFloat * 0.1;
      
      if (frontMatRef.current) {
        frontMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
          frontMatRef.current.emissiveIntensity, 0.4, 0.15
        );
      }
      if (backMatRef.current) {
        backMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
          backMatRef.current.emissiveIntensity, 0.4, 0.15
        );
      }
    } else {
      // Subtle idle breathing
      const breathe = Math.sin(time * 1.5 + seeds.phase) * 0.02;
      
      if (frontMatRef.current) {
        frontMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
          frontMatRef.current.emissiveIntensity, 0.05 + breathe, 0.1
        );
      }
      if (backMatRef.current) {
        backMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
          backMatRef.current.emissiveIntensity, 0.08 + breathe, 0.1
        );
      }
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
        <boxGeometry args={[3.25, 5.46, 0.06]} />
        
        {/* SIDES: Metallic Gold */}
        <meshStandardMaterial attach="material-0" color="#d4af37" metalness={0.95} roughness={0.2} />
        <meshStandardMaterial attach="material-1" color="#d4af37" metalness={0.95} roughness={0.2} />
        <meshStandardMaterial attach="material-2" color="#d4af37" metalness={0.95} roughness={0.2} />
        <meshStandardMaterial attach="material-3" color="#d4af37" metalness={0.95} roughness={0.2} />
        
        {/* FRONT */}
        <meshStandardMaterial 
          ref={frontMatRef}
          attach="material-4" 
          map={frontTexture} 
          roughness={0.45} 
          metalness={0.45} 
          emissive="#ffd700"
          emissiveIntensity={0.05} 
        />
        
        {/* BACK */}
        <meshStandardMaterial 
          ref={backMatRef}
          attach="material-5" 
          map={backTexture} 
          roughness={0.35} 
          metalness={0.55}
          emissive="#8b5cf6"
          emissiveIntensity={0.08}
        />
      </mesh>
    </group>
  );
};

export default TarotCard;
