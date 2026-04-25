import React, { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';

const types = [
  { id: 'press', label: 'Press', color: '#2563eb' },
  { id: 'cutter', label: 'Cutter', color: '#16a34a' },
  { id: 'robot', label: 'Robot', color: '#9333ea' },
  { id: 'packer', label: 'Packer', color: '#ea580c' }
];

const snap = (v) => Math.round(v);

function Conveyor({ from, to, running, speed, time }) {
  if (!from || !to || from.id === to.id) return null;

  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  if (!Number.isFinite(length) || length < 0.2) return null;

  const angle = Math.atan2(dz, dx);
  const itemCount = Math.max(1, Math.min(6, Math.floor(length / 2)));

  return (
    <>
      <group position={[(from.x + to.x) / 2, 0.08, (from.z + to.z) / 2]} rotation={[0, -angle, 0]}>
        <mesh>
          <boxGeometry args={[length, 0.12, 0.35]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>

      {running && Array.from({ length: itemCount }).map((_, i) => {
        const progress = (time * speed + i / itemCount) % 1;
        return (
          <mesh key={i} position={[from.x + dx * progress, 0.32, from.z + dz * progress]}>
            <boxGeometry args={[0.25, 0.25, 0.25]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
        );
      })}
    </>
  );
}

function Machine({ m, selected, onSelect, onMove }) {
  const t = types.find(x => x.id === m.type) || types[0];
  const [drag, setDrag] = useState(false);

  return (
    <group
      position={[m.x, 0.5, m.z]}
      onClick={(e) => { e.stopPropagation(); onSelect(m.id); }}
      onPointerDown={(e) => { if (e.altKey) { e.stopPropagation(); setDrag(true); } }}
      onPointerUp={() => setDrag(false)}
      onPointerMove={(e) => { if (drag) { e.stopPropagation(); onMove(m.id, snap(e.point.x), snap(e.point.z)); } }}
    >
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={t.color} />
      </mesh>
      <mesh position={[0, -0.52, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.06, 32]} />
        <meshStandardMaterial color={selected ? '#facc15' : '#e2e8f0'} />
      </mesh>
      <Text position={[0, 0.85, 0]} fontSize={0.18} color="#111" anchorX="center">{m.name}</Text>
    </group>
  );
}

export default function App() {
  const [machines, setMachines] = useState([]);
  const [belts, setBelts] = useState([]);
  const [type, setType] = useState('press');
  const [sel, setSel] = useState(null);
  const [connectFrom, setConnectFrom] = useState(null);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(0.4);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!running) return;
    const handle = window.setInterval(() => setTime(t => t + 0.04), 40);
    return () => window.clearInterval(handle);
  }, [running]);

  const selected = machines.find(m => m.id === sel);
  const byId = useMemo(() => Object.fromEntries(machines.map(m => [m.id, m])), [machines]);

  function add(x, z) {
    const t = types.find(x => x.id === type) || types[0];
    const id = `${Date.now()}-${Math.random()}`;
    setMachines(current => [...current, { id, type, name: `${t.label} ${current.length + 1}`, x, z }]);
    setSel(id);
  }

  function select(id) {
    if (connectFrom && connectFrom !== id) {
      const exists = belts.some(b => b.from === connectFrom && b.to === id);
      if (!exists) {
        setBelts(current => [...current, { id: `${Date.now()}-${Math.random()}`, from: connectFrom, to: id }]);
      }
      setConnectFrom(null);
    }
    setSel(id);
  }

  function move(id, x, z) {
    setMachines(current => current.map(m => m.id === id ? { ...m, x, z } : m));
  }

  function rename(v) {
    setMachines(current => current.map(m => m.id === sel ? { ...m, name: v } : m));
  }

  function del() {
    setMachines(current => current.filter(m => m.id !== sel));
    setBelts(current => current.filter(b => b.from !== sel && b.to !== sel));
    setSel(null);
    setConnectFrom(null);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <aside style={{ padding: 16, borderRight: '1px solid #ddd', background: '#fff' }}>
        <h2>Factory Builder</h2>
        <p>Click floor to add. Alt+Drag to move.</p>

        {types.map(t => (
          <button key={t.id} onClick={() => setType(t.id)} style={{ display: 'block', width: '100%', marginBottom: 8, padding: 10, background: t.color, color: '#fff' }}>
            {t.label}
          </button>
        ))}

        <h3>Simulation</h3>
        <button onClick={() => setRunning(!running)} style={{ width: '100%', marginBottom: 8 }}>
          {running ? 'Pause' : 'Start'}
        </button>
        <label>Speed {speed.toFixed(2)}</label>
        <input type="range" min="0.1" max="1.5" step="0.05" value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: '100%' }} />

        {selected ? (
          <>
            <h3>Selected</h3>
            <input value={selected.name} onChange={e => rename(e.target.value)} style={{ width: '100%' }} />
            <button onClick={() => setConnectFrom(selected.id)} style={{ width: '100%', marginTop: 8 }}>Connect</button>
            <button onClick={del} style={{ width: '100%', marginTop: 8 }}>Delete</button>
          </>
        ) : <p>No selection</p>}

        {connectFrom && <p>Click another machine to finish conveyor.</p>}
        <p>M: {machines.length} · C: {belts.length}</p>
      </aside>

      <main>
        <Canvas camera={{ position: [8, 8, 8], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 10, 5]} intensity={1} />
          <gridHelper args={[24, 24]} />

          <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={(e) => add(snap(e.point.x), snap(e.point.z))}>
            <planeGeometry args={[24, 24]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>

          {belts.map(b => (
            <Conveyor key={b.id} from={byId[b.from]} to={byId[b.to]} running={running} speed={speed} time={time} />
          ))}

          {machines.map(m => (
            <Machine key={m.id} m={m} selected={sel === m.id} onSelect={select} onMove={move} />
          ))}

          <OrbitControls />
        </Canvas>
      </main>
    </div>
  );
}
