"use client";

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Center, Text } from '@react-three/drei';
import * as THREE from 'three';

// --- Shared Materials ---
const borderMaterial = new THREE.MeshStandardMaterial({
    color: "#e2e8f0", // Silver/Chrome
    metalness: 1,
    roughness: 0.1,
});

const matteMaterial = new THREE.MeshStandardMaterial({
    color: "#1e293b",
    roughness: 0.9,
    metalness: 0.1,
});

// --- Specific Badge Models ---

// 1. First Steps: Infinity Loop
function InfinityHexBadge({ mainColor = "#10b981", accentColor = "#db2777", isLocked }) {
    const path = useMemo(() => {
        class CustomSinCurve extends THREE.Curve {
            constructor(scale = 1) {
                super();
                this.scale = scale;
            }
            getPoint(t, optionalTarget = new THREE.Vector3()) {
                const tx = Math.cos(2 * Math.PI * t);
                const ty = Math.sin(4 * Math.PI * t) / 2;
                const tz = 0;
                return optionalTarget.set(tx, ty, tz).multiplyScalar(this.scale);
            }
        }
        return new CustomSinCurve(0.85); // Increased scale
    }, []);

    return (
        <Center>
            <group scale={isLocked ? 1 : 1.2}>
                {/* Base Hexagon */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[1.2, 1.2, 0.2, 6]} />
                    {isLocked ? <primitive object={matteMaterial} attach="material" /> : <meshStandardMaterial color={mainColor} metalness={0.6} roughness={0.2} />}
                </mesh>
                {/* Silver Border */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1.15, 0.05, 16, 6]} />
                    <primitive object={isLocked ? matteMaterial : borderMaterial} attach="material" />
                </mesh>
                {/* Infinity Loop Symbol */}
                {!isLocked && (
                    <mesh position={[0, 0, 0.15]}>
                        <tubeGeometry args={[path, 64, 0.15, 8, true]} />
                        <meshStandardMaterial color={accentColor} metalness={0.6} roughness={0.1} emissive={accentColor} emissiveIntensity={0.5} />
                    </mesh>
                )}
            </group>
        </Center>
    );
}

// 5. LifeFlow Brand: 3D Zap/Flow Emblem
function LifeFlowLogo({ mainColor = "#3b82f6", isLocked }) {
    const zapShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(0.1, 0.8);
        shape.lineTo(-0.4, 0.1);
        shape.lineTo(-0.1, 0.1);
        shape.lineTo(-0.3, -0.8);
        shape.lineTo(0.5, -0.1);
        shape.lineTo(0.2, -0.1);
        shape.lineTo(0.1, 0.8);
        return shape;
    }, []);

    const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4 };

    return (
        <Center>
            <group>
                <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
                    <torusGeometry args={[1.2, 0.02, 16, 100]} />
                    <meshStandardMaterial color={mainColor} transparent opacity={0.3} emissive={mainColor} emissiveIntensity={0.5} />
                </mesh>
                <mesh rotation={[-Math.PI / 3, Math.PI / 4, 0]}>
                    <torusGeometry args={[1.5, 0.02, 16, 100]} />
                    <meshStandardMaterial color="#8b5cf6" transparent opacity={0.3} emissive="#8b5cf6" emissiveIntensity={0.5} />
                </mesh>
                <Float speed={4} rotationIntensity={0.5} floatIntensity={1}>
                    <mesh position={[0, 0, 0]}>
                        <extrudeGeometry args={[zapShape, extrudeSettings]} />
                        <meshStandardMaterial
                            color={mainColor}
                            metalness={0.8}
                            roughness={0.1}
                            emissive={mainColor}
                            emissiveIntensity={0.6}
                        />
                    </mesh>
                </Float>
                <mesh position={[0, 0, -0.2]}>
                    <sphereGeometry args={[0.8, 32, 32]} />
                    <meshStandardMaterial color={mainColor} transparent opacity={0.1} />
                </mesh>
            </group>
        </Center>
    );
}

// 2. Verified Pro: Checked Shield
function VerifiedBadge({ mainColor = "#3b82f6", isLocked }) {
    // Symmetrical Shield Shape
    const shieldShape = useMemo(() => {
        const shape = new THREE.Shape();
        // Start top center
        shape.moveTo(0, 0.9);
        // Top Right
        shape.lineTo(0.8, 0.9);
        // Vertical side down to curve start
        shape.lineTo(0.8, 0.2);
        // Curve to bottom tip
        shape.quadraticCurveTo(0.8, -0.6, 0, -1.0);
        // Curve up to left vertical
        shape.quadraticCurveTo(-0.8, -0.6, -0.8, 0.2);
        // Top Left
        shape.lineTo(-0.8, 0.9);
        // Close
        shape.lineTo(0, 0.9);
        return shape;
    }, []);

    // Large Bold Checkmark
    const checkShape = useMemo(() => {
        const s = new THREE.Shape();
        // Center the shape around 0,0 locally
        s.moveTo(-0.4, -0.1);
        s.lineTo(-0.1, -0.4);
        s.lineTo(0.5, 0.4);
        s.lineTo(0.3, 0.6);
        s.lineTo(-0.1, 0.0);
        s.lineTo(-0.3, 0.2);
        return s;
    }, []);

    const extrudeSettingsShield = { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05, bevelSegments: 4 };
    const extrudeSettingsCheck = { depth: 0.2, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 };

    return (
        <Center>
            <group scale={isLocked ? 1.1 : 1.4}>
                {/* Shield Body */}
                <mesh position={[0, 0, 0]}>
                    <extrudeGeometry args={[shieldShape, extrudeSettingsShield]} />
                    {isLocked ? <primitive object={matteMaterial} attach="material" /> : <meshStandardMaterial color={mainColor} metalness={0.7} roughness={0.2} />}
                </mesh>

                {/* Silver Rim */}
                <mesh position={[0, 0, -0.05]} scale={[1.05, 1.05, 1]}>
                    <extrudeGeometry args={[shieldShape, { ...extrudeSettingsShield, depth: 0.1 }]} />
                    <primitive object={borderMaterial} attach="material" />
                </mesh>

                {/* Big White Checkmark */}
                {!isLocked && (
                    <mesh position={[0.05, 0.1, 0.32]} rotation={[0, 0, 0]}> {/* Manual centering adjustment */}
                        <extrudeGeometry args={[checkShape, extrudeSettingsCheck]} />
                        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.1} emissive="#ffffff" emissiveIntensity={0.6} />
                    </mesh>
                )}
            </group>
        </Center>
    );
}

// 3. Rising Star: 3D Star
function StarBadge({ mainColor = "#f59e0b", isLocked }) {
    const starShape = useMemo(() => {
        const shape = new THREE.Shape();
        const outerRadius = 0.9; // Bigger star
        const innerRadius = 0.45;
        const points = 5;
        for (let i = 0; i < points * 2; i++) {
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const a = (i / (points * 2)) * Math.PI * 2;
            const x = Math.cos(a + Math.PI / 2) * r;
            const y = Math.sin(a + Math.PI / 2) * r;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        return shape;
    }, []);

    const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05, bevelSegments: 3 };

    return (
        <Center>
            <group scale={isLocked ? 1 : 1.2}>
                {/* Base Circle */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[1.2, 1.2, 0.15, 32]} />
                    {isLocked ? <primitive object={matteMaterial} attach="material" /> : <meshStandardMaterial color="#fef3c7" metalness={0.5} roughness={0.2} />}
                </mesh>

                {/* Decorative Ring */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1.3, 0.08, 16, 32]} />
                    <primitive object={borderMaterial} attach="material" />
                </mesh>

                {/* Main Star */}
                {!isLocked && (
                    <mesh position={[0, 0, 0.2]}>
                        <extrudeGeometry args={[starShape, extrudeSettings]} />
                        <meshStandardMaterial color={mainColor} metalness={0.9} roughness={0.1} emissive={mainColor} emissiveIntensity={0.5} />
                    </mesh>
                )}
            </group>
        </Center>
    );
}

// 4. Paperwork Master: Crown
function CrownBadge({ mainColor = "#8b5cf6", isLocked }) {
    const crownShape = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-0.7, -0.5);
        shape.lineTo(-0.7, 0.2);
        shape.lineTo(-0.4, 0.6);
        shape.lineTo(-0.2, 0.2);
        shape.lineTo(0, 0.7);
        shape.lineTo(0.2, 0.2);
        shape.lineTo(0.4, 0.6);
        shape.lineTo(0.7, 0.2);
        shape.lineTo(0.7, -0.5);
        shape.lineTo(-0.7, -0.5);
        return shape;
    }, []);

    const extrudeSettings = { depth: 0.25, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 };

    return (
        <Center>
            <group scale={isLocked ? 1 : 1.3}>
                {/* Base Cushion */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[1.1, 1.1, 0.2, 12]} />
                    {isLocked ? <primitive object={matteMaterial} attach="material" /> : <meshStandardMaterial color="#4c1d95" metalness={0.4} roughness={0.6} />}
                </mesh>

                {/* Gold Crown */}
                {!isLocked && (
                    <mesh position={[0, 0, 0.2]}>
                        <extrudeGeometry args={[crownShape, extrudeSettings]} />
                        <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.1} emissive="#fbbf24" emissiveIntensity={0.4} />
                    </mesh>
                )}

                {/* Gemstone */}
                {!isLocked && (
                    <mesh position={[0, -0.15, 0.4]}>
                        <dodecahedronGeometry args={[0.2]} />
                        <meshStandardMaterial color={mainColor} metalness={0.6} roughness={0.1} emissive={mainColor} emissiveIntensity={0.8} />
                    </mesh>
                )}
            </group>
        </Center>
    );
}

function BadgeSelector({ id, color, isLocked, unlockedDate }) {
    const mesh = useRef();
    const [hovered, setHover] = useState(false);

    useFrame((state, delta) => {
        if (mesh.current) {
            // Idle Rotation
            mesh.current.rotation.y += delta * 0.5;

            // Hover Animation
            const targetScale = hovered ? 1.25 : 1;
            const targetTilt = hovered ? 0.4 : 0;

            mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

            // If hovered, rotate to show back (PI = 180 deg), else 0
            const targetRotY = hovered ? Math.PI : state.clock.getElapsedTime() * 0.5; // Continue spinning slowly if not hovered? Or just idle. 
            // Let's make it snap to back on hover
            if (hovered) {
                mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, Math.PI, 0.1);
            } else {
                mesh.current.rotation.y += delta * 0.5; // Regular spin
            }

            mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, targetTilt, 0.1);
        }
    });

    return (
        <group
            ref={mesh}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            {id === 'first_step' && <InfinityHexBadge mainColor={color} isLocked={isLocked} />}
            {id === 'verified_pro' && <VerifiedBadge mainColor={color} isLocked={isLocked} />}
            {id === 'level_5' && <StarBadge mainColor={color} isLocked={isLocked} />}
            {id === 'paperwork_master' && <CrownBadge mainColor={color} isLocked={isLocked} />}
            {id === 'lifeflow_hero' && <LifeFlowLogo mainColor={color} isLocked={isLocked} />}

            {/* Back Side Text */}
            {!isLocked && id !== 'lifeflow_hero' && (
                <group rotation={[0, Math.PI, 0]} position={[0, 0, -0.05]}>
                    <Text
                        position={[0, 0, -0.06]} // Slightly pushed out from back
                        rotation={[0, Math.PI, 0]} // Correct text orientation
                        fontSize={0.15}
                        color={color}
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.01}
                        outlineColor="#ffffff"
                    >
                        UNLOCKED
                    </Text>
                    <Text
                        position={[0, -0.2, -0.06]}
                        rotation={[0, Math.PI, 0]}
                        fontSize={0.12}
                        color="#ffffff"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {new Date().toLocaleDateString()}
                    </Text>
                </group>
            )}

            {/* Invisible Hitbox */}
            <mesh visible={false}>
                <sphereGeometry args={[1.3, 16, 16]} />
            </mesh>
        </group>
    );
}

export default function Badge3D({ id = 'first_step', color = "#3b82f6", icon = "★", isLocked = false, className = "", unlockedDate, cameraPosition = [0, 0, 4] }) {
    return (
        <div className={`w-full h-full transition-all duration-500 ${isLocked ? 'grayscale opacity-60' : 'grayscale-0 opacity-100'} ${className}`}>
            <Canvas camera={{ position: cameraPosition, fov: 40 }}> {/* Lower FOV for less distortion */}
                <ambientLight intensity={1.5} /> {/* Brighter ambient */}
                <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={3} color="white" />
                <pointLight position={[-10, -5, -10]} intensity={2} color={color} />
                <pointLight position={[0, 5, 5]} intensity={1} color="#ffffff" /> {/* Front fill light */}
                <Environment preset="city" />

                <Float speed={3} rotationIntensity={0.4} floatIntensity={0.8} floatingRange={[-0.1, 0.1]}> {/* Gentle float */}
                    <BadgeSelector id={id} color={color} isLocked={isLocked} unlockedDate={unlockedDate} />
                </Float>
            </Canvas>
        </div>
    );
}
