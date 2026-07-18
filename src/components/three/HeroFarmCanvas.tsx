import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";

const DairyFarmScene = lazy(() => import("./DairyFarmScene"));

export default function HeroFarmCanvas({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ background: "linear-gradient(180deg,#f9d59a 0%,#ffb37a 30%,#e28c6a 60%,#7a8f5a 100%)" }}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "demand"}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        style={{ width: "100%", height: "100%" }}
      >
        <PerspectiveCamera makeDefault position={[2.4, 2.2, 7.5]} fov={42} />
        <Suspense fallback={null}>
          <DairyFarmScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
