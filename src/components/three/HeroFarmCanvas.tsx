import { Suspense, lazy } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";

const DairyFarmScene = lazy(() => import("./DairyFarmScene"));

export default function HeroFarmCanvas({ className = "" }: { className?: string }) {
  return (
    <Canvas
      className={className}
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      style={{ background: "linear-gradient(180deg,#f9d59a 0%,#ffb37a 30%,#e28c6a 60%,#7a8f5a 100%)" }}
    >
      <PerspectiveCamera makeDefault position={[2.4, 2.2, 7.5]} fov={42} />
      <Suspense fallback={null}>
        <DairyFarmScene />
      </Suspense>
    </Canvas>
  );
}
