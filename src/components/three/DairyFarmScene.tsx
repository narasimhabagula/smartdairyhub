import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  Float,
  Cloud,
  Clouds,
  Sky,
  Instances,
  Instance,
} from "@react-three/drei";
import * as THREE from "three";

/* ---------------- helpers ---------------- */

function useMouseParallax(strength = 0.15) {
  const { pointer } = useThree();
  const group = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (!group.current) return;
    const tx = pointer.y * strength * 0.4;
    const ty = pointer.x * strength;
    group.current.rotation.x += (tx - group.current.rotation.x) * 0.05;
    group.current.rotation.y += (ty - group.current.rotation.y) * 0.05;
  });
  return group;
}

/* ---------------- Cow (stylized, animated) ----------------
   A low-poly PBR cow with idle breathing, tail swing, ear flick, blink.
   variant: "holstein" | "gir" | "buffalo" | "calf" | "goat"
------------------------------------------------------------ */
function Animal({
  position = [0, 0, 0] as [number, number, number],
  rotation = 0,
  variant = "holstein",
  scale = 1,
  walk = false,
}: {
  position?: [number, number, number];
  rotation?: number;
  variant?: "holstein" | "gir" | "buffalo" | "calf" | "goat";
  scale?: number;
  walk?: boolean;
}) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Mesh>(null!);
  const tail = useRef<THREE.Group>(null!);
  const earL = useRef<THREE.Group>(null!);
  const earR = useRef<THREE.Group>(null!);
  const eyeL = useRef<THREE.Mesh>(null!);
  const eyeR = useRef<THREE.Mesh>(null!);
  const legFL = useRef<THREE.Mesh>(null!);
  const legFR = useRef<THREE.Mesh>(null!);
  const legBL = useRef<THREE.Mesh>(null!);
  const legBR = useRef<THREE.Mesh>(null!);
  const head = useRef<THREE.Group>(null!);

  const palette = useMemo(() => {
    switch (variant) {
      case "gir":
        return { body: "#c76a3a", spot: "#7a3a1c", horn: "#efe4c9", udder: "#f4b8a0" };
      case "buffalo":
        return { body: "#1f1f22", spot: "#0f0f11", horn: "#2a2a2e", udder: "#3a3033" };
      case "calf":
        return { body: "#f5efe6", spot: "#2a2a2a", horn: "#efe4c9", udder: "#f4b8a0" };
      case "goat":
        return { body: "#e8ded0", spot: "#5b4a38", horn: "#3a2f22", udder: "#e8c0b0" };
      default:
        return { body: "#f8f7f3", spot: "#1e1e1e", horn: "#efe4c9", udder: "#f4b8a0" };
    }
  }, [variant]);

  const isBuffalo = variant === "buffalo";
  const isGir = variant === "gir";
  const isCalf = variant === "calf";
  const isGoat = variant === "goat";
  const bodyLen = isCalf || isGoat ? 1.5 : 2.2;
  const bodyH = isCalf || isGoat ? 0.75 : 1.05;
  const bodyW = isCalf || isGoat ? 0.8 : 1.15;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 1.4) * 0.015;
    if (tail.current) tail.current.rotation.z = Math.sin(t * 1.8) * 0.35;
    if (earL.current) earL.current.rotation.z = 0.4 + Math.sin(t * 2.2) * 0.15;
    if (earR.current) earR.current.rotation.z = -0.4 - Math.sin(t * 2.4 + 0.6) * 0.15;
    if (head.current) head.current.rotation.x = Math.sin(t * 0.7) * 0.05;

    // Blink every ~3.5s
    const blinkPhase = (t * 0.28) % 1;
    const blink = blinkPhase > 0.96 ? 0.05 : 1;
    if (eyeL.current) eyeL.current.scale.y = blink;
    if (eyeR.current) eyeR.current.scale.y = blink;

    // Walk cycle
    if (walk && root.current) {
      const speed = 0.35;
      root.current.position.x += Math.cos(rotation) * speed * 0.003;
      root.current.position.z += Math.sin(rotation) * speed * 0.003;
      // loop within a small area
      root.current.position.x = ((root.current.position.x + 6) % 12) - 6 + position[0] * 0;
      const swing = Math.sin(t * 4) * 0.4;
      if (legFL.current) legFL.current.rotation.x = swing;
      if (legBR.current) legBR.current.rotation.x = swing;
      if (legFR.current) legFR.current.rotation.x = -swing;
      if (legBL.current) legBL.current.rotation.x = -swing;
    } else {
      // Idle micro-shuffle
      const s = Math.sin(t * 1.6) * 0.03;
      if (legFL.current) legFL.current.rotation.x = s;
      if (legBR.current) legBR.current.rotation.x = s;
      if (legFR.current) legFR.current.rotation.x = -s;
      if (legBL.current) legBL.current.rotation.x = -s;
    }
  });

  const bodyMat = <meshStandardMaterial color={palette.body} roughness={0.75} metalness={0.02} />;

  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* legs */}
      <mesh ref={legFL} position={[bodyLen * 0.35, -bodyH * 0.55, bodyW * 0.35]} castShadow>
        <cylinderGeometry args={[0.11, 0.12, 0.9, 10]} />
        {bodyMat}
      </mesh>
      <mesh ref={legFR} position={[bodyLen * 0.35, -bodyH * 0.55, -bodyW * 0.35]} castShadow>
        <cylinderGeometry args={[0.11, 0.12, 0.9, 10]} />
        {bodyMat}
      </mesh>
      <mesh ref={legBL} position={[-bodyLen * 0.35, -bodyH * 0.55, bodyW * 0.35]} castShadow>
        <cylinderGeometry args={[0.11, 0.12, 0.9, 10]} />
        {bodyMat}
      </mesh>
      <mesh ref={legBR} position={[-bodyLen * 0.35, -bodyH * 0.55, -bodyW * 0.35]} castShadow>
        <cylinderGeometry args={[0.11, 0.12, 0.9, 10]} />
        {bodyMat}
      </mesh>

      {/* body */}
      <mesh ref={body} castShadow receiveShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[bodyW * 0.55, bodyLen * 0.85, 6, 14]} />
        <meshStandardMaterial color={palette.body} roughness={0.7} metalness={0.03} />
      </mesh>

      {/* Holstein-style spots */}
      {variant === "holstein" && (
        <>
          <mesh position={[0.4, 0.3, 0.5]} rotation={[0, 0, 0.3]}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshStandardMaterial color={palette.spot} roughness={0.8} />
          </mesh>
          <mesh position={[-0.5, 0.35, -0.45]}>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshStandardMaterial color={palette.spot} roughness={0.8} />
          </mesh>
          <mesh position={[0.1, -0.2, -0.55]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial color={palette.spot} roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Gir hump */}
      {isGir && (
        <mesh position={[0.6, 0.55, 0]} castShadow>
          <sphereGeometry args={[0.42, 14, 14]} />
          <meshStandardMaterial color={palette.body} roughness={0.75} />
        </mesh>
      )}

      {/* Buffalo shoulder mass */}
      {isBuffalo && (
        <mesh position={[0.5, 0.35, 0]} castShadow>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshStandardMaterial color={palette.body} roughness={0.85} />
        </mesh>
      )}

      {/* Udder (not for goat/calf/male-ish) */}
      {!isCalf && !isGoat && (
        <mesh position={[-0.3, -bodyH * 0.4, 0]} castShadow>
          <sphereGeometry args={[0.28, 12, 12]} />
          <meshStandardMaterial color={palette.udder} roughness={0.6} />
        </mesh>
      )}

      {/* head */}
      <group ref={head} position={[bodyLen * 0.55, bodyH * 0.35, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.75, 0.6, 0.6]} />
          {bodyMat}
        </mesh>
        {/* snout */}
        <mesh position={[0.42, -0.08, 0]}>
          <boxGeometry args={[0.4, 0.35, 0.42]} />
          <meshStandardMaterial color={isBuffalo ? "#3a3033" : "#f2c8b8"} roughness={0.6} />
        </mesh>
        {/* nostrils */}
        <mesh position={[0.63, -0.08, 0.12]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
        <mesh position={[0.63, -0.08, -0.12]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
        {/* eyes */}
        <mesh ref={eyeL} position={[0.25, 0.18, 0.22]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color="#111" roughness={0.3} />
        </mesh>
        <mesh ref={eyeR} position={[0.25, 0.18, -0.22]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color="#111" roughness={0.3} />
        </mesh>
        {/* ears */}
        <group ref={earL} position={[-0.05, 0.32, 0.32]}>
          <mesh castShadow>
            <coneGeometry args={[0.13, 0.3, 8]} />
            {bodyMat}
          </mesh>
        </group>
        <group ref={earR} position={[-0.05, 0.32, -0.32]}>
          <mesh castShadow>
            <coneGeometry args={[0.13, 0.3, 8]} />
            {bodyMat}
          </mesh>
        </group>
        {/* horns (not calves) */}
        {!isCalf && (
          <>
            <mesh position={[0.05, 0.42, 0.18]} rotation={[0, 0, 0.4]}>
              <coneGeometry args={[0.06, isGoat ? 0.45 : 0.25, 8]} />
              <meshStandardMaterial color={palette.horn} roughness={0.5} metalness={0.1} />
            </mesh>
            <mesh position={[0.05, 0.42, -0.18]} rotation={[0, 0, 0.4]}>
              <coneGeometry args={[0.06, isGoat ? 0.45 : 0.25, 8]} />
              <meshStandardMaterial color={palette.horn} roughness={0.5} metalness={0.1} />
            </mesh>
          </>
        )}
      </group>

      {/* tail */}
      <group ref={tail} position={[-bodyLen * 0.55, 0.1, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.03, 0.7, 8]} />
          {bodyMat}
        </mesh>
        <mesh position={[0, -0.4, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color={palette.spot} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------------- Grass (instanced, wind animated) ---------------- */
function GrassField({ count = 260 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 22,
        z: (Math.random() - 0.5) * 14,
        s: 0.6 + Math.random() * 0.9,
        p: Math.random() * Math.PI * 2,
      })),
    [count]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!ref.current) return;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      dummy.position.set(d.x, -0.5, d.z);
      dummy.rotation.set(Math.sin(t * 1.6 + d.p) * 0.25, d.p, 0);
      dummy.scale.set(0.08, d.s * 0.55, 0.08);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow>
      <coneGeometry args={[0.5, 1, 4]} />
      <meshStandardMaterial color="#3f8f3a" roughness={0.9} />
    </instancedMesh>
  );
}

/* ---------------- Tree (stylized) ---------------- */
function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const foliage = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    if (foliage.current)
      foliage.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.8 + position[0]) * 0.03;
  });
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 1.2, 10]} />
        <meshStandardMaterial color="#5a3a24" roughness={0.9} />
      </mesh>
      <mesh ref={foliage} castShadow position={[0, 1.7, 0]}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial color="#2f7a34" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.35, 1.5, 0.2]}>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial color="#3d8b3f" roughness={0.85} />
      </mesh>
    </group>
  );
}

/* ---------------- Milk can ---------------- */
function MilkCan({ position, rotate = false }: { position: [number, number, number]; rotate?: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((s) => {
    if (ref.current && rotate) ref.current.rotation.y = s.clock.elapsedTime * 0.6;
  });
  return (
    <group ref={ref} position={position} scale={0.35}>
      <mesh castShadow>
        <cylinderGeometry args={[0.6, 0.8, 1.8, 24]} />
        <meshStandardMaterial color="#d9dee3" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh castShadow position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.35, 0.55, 0.4, 24]} />
        <meshStandardMaterial color="#c0c6cd" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.14, 24]} />
        <meshStandardMaterial color="#9099a1" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0.55, 0.5, 0]}>
        <torusGeometry args={[0.08, 0.03, 8, 16]} />
        <meshStandardMaterial color="#5b6167" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ---------------- Birds (V shapes) ---------------- */
function Birds() {
  const g = useRef<THREE.Group>(null!);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      c.position.x = Math.sin(t * 0.2 + i) * 8;
      c.position.z = Math.cos(t * 0.2 + i) * 5 - 3;
      c.position.y = 4 + Math.sin(t * 1.5 + i) * 0.15;
      c.rotation.y = t * 0.2 + i + Math.PI / 2;
      const flap = Math.sin(t * 8 + i) * 0.5;
      (c.children[0] as THREE.Mesh).rotation.z = flap;
      (c.children[1] as THREE.Mesh).rotation.z = -flap;
    });
  });
  return (
    <group ref={g}>
      {[0, 1, 2].map((i) => (
        <group key={i}>
          <mesh position={[-0.15, 0, 0]}>
            <boxGeometry args={[0.25, 0.02, 0.08]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0.15, 0, 0]}>
            <boxGeometry args={[0.25, 0.02, 0.08]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------------- Sun disc ---------------- */
function Sun() {
  return (
    <mesh position={[-8, 3, -12]}>
      <sphereGeometry args={[1.2, 24, 24]} />
      <meshBasicMaterial color="#ffd39a" />
    </mesh>
  );
}

/* ---------------- Full scene ---------------- */
export default function DairyFarmScene() {
  const parallax = useMouseParallax(0.15);

  return (
    <>
      <Sky sunPosition={[-8, 2.5, -12]} turbidity={6} rayleigh={2.4} mieCoefficient={0.02} mieDirectionalG={0.9} />
      <Environment preset="sunset" />

      {/* Sunrise directional light + shadows */}
      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#ffd7a8", "#3b6d3b", 0.35]} />
      <directionalLight
        position={[-6, 6, -4]}
        intensity={2.2}
        color="#ffcf9a"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[6, 4, 4]} intensity={0.4} color="#bfe3ff" />

      <Sun />

      {/* Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[60, 60, 1, 1]} />
        <meshStandardMaterial color="#4a8a3d" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]}>
        <ringGeometry args={[3, 8, 40]} />
        <meshStandardMaterial color="#5aa348" roughness={0.9} transparent opacity={0.6} />
      </mesh>

      <ContactShadows position={[0, -0.49, 0]} opacity={0.5} scale={20} blur={2.2} far={4} />

      <group ref={parallax}>
        <GrassField count={220} />

        {/* Trees */}
        <Tree position={[-6, -0.5, -3]} scale={1.4} />
        <Tree position={[7, -0.5, -4]} scale={1.2} />
        <Tree position={[-9, -0.5, 1]} scale={1.6} />
        <Tree position={[9, -0.5, 2]} scale={1.3} />

        {/* Foreground hero cow */}
        <Float speed={1.1} rotationIntensity={0.05} floatIntensity={0.08}>
          <Animal position={[0.6, 0, 0.5]} rotation={-0.4} variant="holstein" scale={1.05} />
        </Float>

        {/* Gir cow (right, walking) */}
        <Animal position={[3.6, 0, -1.5]} rotation={Math.PI * 0.8} variant="gir" scale={0.95} walk />

        {/* Buffalo (back left) */}
        <Animal position={[-3.2, 0, -1.8]} rotation={0.5} variant="buffalo" scale={1.1} />

        {/* Calf beside mother */}
        <Animal position={[-1.4, 0, 0.8]} rotation={-0.2} variant="calf" scale={0.7} />

        {/* Goat */}
        <Animal position={[2.2, 0, 1.6]} rotation={-1.2} variant="goat" scale={0.55} />

        {/* Milk cans */}
        <MilkCan position={[-2.6, -0.15, 2.2]} />
        <MilkCan position={[-2.1, -0.15, 2.6]} />
        <MilkCan position={[-2.55, -0.15, 3.0]} rotate />

        <Birds />
      </group>

      {/* Clouds */}
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud segments={30} bounds={[8, 1.5, 3]} volume={5} color="#fff" position={[-6, 5, -10]} speed={0.15} />
        <Cloud segments={30} bounds={[8, 1.5, 3]} volume={5} color="#fff" position={[6, 6, -12]} speed={0.12} />
        <Cloud segments={20} bounds={[6, 1, 2]} volume={3} color="#ffe6cc" position={[0, 7, -14]} speed={0.1} />
      </Clouds>
    </>
  );
}
