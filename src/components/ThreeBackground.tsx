'use client';

import { useRef, useMemo } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import { Float, Sphere, Box, Torus } from '@react-three/drei';
import * as THREE from 'three';

function FloatingShapes() {
  const groupRef = useRef<THREE.Group>(null);

  const shapes = useMemo(() => {
    const temp = [];
    // Use a fixed number of shapes to avoid hydration mismatches
    // Mobile optimization will be handled by CSS media queries
    const shapeCount = 12;
    
    for (let i = 0; i < shapeCount; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10
        ],
        rotation: [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ],
        scale: Math.random() * 0.6 + 0.3,
        type: Math.floor(Math.random() * 3),
        speed: Math.random() * 0.5 + 0.5
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005;
      groupRef.current.rotation.x += 0.0003;
      
      // Add subtle floating animation
      shapes.forEach((shape, index) => {
        const mesh = groupRef.current?.children[index];
        if (mesh) {
          mesh.position.y += Math.sin(state.clock.elapsedTime * shape.speed) * 0.001;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {shapes.map((shape, index) => (
        <Float
          key={index}
          speed={shape.speed}
          rotationIntensity={0.3}
          floatIntensity={0.2}
          position={shape.position as [number, number, number]}
          rotation={shape.rotation as [number, number, number]}
        >
          {shape.type === 0 && (
            <Sphere args={[shape.scale, 12, 8]}>
              <meshStandardMaterial
                color="#3B82F6"
                transparent
                opacity={0.12}
                wireframe
                emissive="#3B82F6"
                emissiveIntensity={0.15}
              />
            </Sphere>
          )}
          {shape.type === 1 && (
            <Box args={[shape.scale, shape.scale, shape.scale]}>
              <meshStandardMaterial
                color="#8B5CF6"
                transparent
                opacity={0.12}
                wireframe
                emissive="#8B5CF6"
                emissiveIntensity={0.15}
              />
            </Box>
          )}
          {shape.type === 2 && (
            <Torus args={[shape.scale, shape.scale * 0.3, 12, 8]}>
              <meshStandardMaterial
                color="#06B6D4"
                transparent
                opacity={0.12}
                wireframe
                emissive="#06B6D4"
                emissiveIntensity={0.15}
              />
            </Torus>
          )}
        </Float>
      ))}
    </group>
  );
}

function GradientPlane() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && meshRef.current.material instanceof THREE.Material) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -5]} rotation={[0, 0, 0]}>
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial
        color="#667eea"
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
          opacity: 1.0,
          width: '100%',
          height: '100%'
        }}
        gl={{ 
          antialias: true, 
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false,
          alpha: true
        }}
        onCreated={({ gl, scene }) => {
          // Set up scene
          scene.background = null;
          gl.setClearColor(0x000000, 0);
          
          // Handle WebGL context loss gracefully
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.warn('WebGL context lost, attempting to restore...');
          });
          
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
          });
        }}
        onError={(error) => {
          console.error('Three.js error:', error);
        }}
        fallback={
          <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 flex items-center justify-center opacity-70">
            <div className="text-slate-600 text-center">
              <div className="text-4xl mb-2">🎨</div>
              <div className="text-lg font-medium">Background Loading...</div>
            </div>
          </div>
        }
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} color="#ffffff" />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.7} 
          color="#ffffff"
          castShadow={false}
        />
        <directionalLight 
          position={[-10, -10, -5]} 
          intensity={0.4} 
          color="#e2e8f0"
          castShadow={false}
        />
        
        {/* Background gradient plane */}
        <GradientPlane />
        
        {/* Floating shapes */}
        <FloatingShapes />
      </Canvas>
    </div>
  );
}
