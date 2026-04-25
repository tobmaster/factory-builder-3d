import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function MovingItem({ from, to, offset = 0, speed = 0.35 }) {
  const ref = useRef(null);

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * speed + offset) % 1;
    if (!ref.current) return;
    ref.current.position.x = from.x + (to.x - from.x) * t;
    ref.current.position.y = 0.32;
    ref.current.position.z = from.z + (to.z - from.z) * t;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.25, 0.25, 0.25]} />
      <meshStandardMaterial color="#facc15" />
    </mesh>
  );
}
