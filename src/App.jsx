import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';

const types = [
  { id: 'press', label: 'Press', color: '#2563eb' },
  { id: 'cutter', label: 'Cutter', color: '#16a34a' },
  { id: 'packer', label: 'Packer', color: '#ea580c' }
];

function Conveyor({ from, to }) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  return (
    <mesh position={[(from.x + to.x) / 2, 0.08, (from.z + to.z) / 2]} rotation={[0, -angle, 0]}>
      <boxGeometry args={[length, 0.12, 0.35]} />
      <meshStandardMaterial color="#334155" />
    </mesh>
  );
}

function Machine({ item, selected, onClick }) {
  const type = types.find(t => t.id === item.type) || types[0];
  return (
    <group position={[item.x, 0.5, item.z]} onClick={(e) => { e.stopPropagation(); onClick(item.id); }}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={type.color} />
      </mesh>
      <mesh position={[0, -0.52, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.06, 32]} />
        <meshStandardMaterial color={selected ? '#facc15' : '#e2e8f0'} />
      </mesh>
      <Text position={[0, 0.85, 0]} fontSize={0.18} color="#111827" anchorX="center">
        {item.name}
      </Text>
    </group>
  );
}

export default function App() {
  const [machines, setMachines] = useState([]);
  const [belts, setBelts] = useState([]);
  const [selectedType, setSelectedType] = useState('press');
  const [selectedId, setSelectedId] = useState(null);
  const [connectFrom, setConnectFrom] = useState(null);
  const selected = machines.find(m => m.id === selectedId);

  function addMachine(x, z) {
    const type = types.find(t => t.id === selectedType) || types[0];
    const id = String(Date.now());
    const next = { id, type: selectedType, name: `${type.label} ${machines.length + 1}`, x, z };
    setMachines([...machines, next]);
    setSelectedId(id);
  }

  function selectMachine(id) {
    if (connectFrom && connectFrom !== id) {
      setBelts([...belts, { id: String(Date.now()), from: connectFrom, to: id }]);
      setConnectFrom(null);
    }
    setSelectedId(id);
  }

  function rename(value) {
    setMachines(machines.map(m => m.id === selectedId ? { ...m, name: value } : m));
  }

  function removeSelected() {
    setMachines(machines.filter(m => m.id !== selectedId));
    setBelts(belts.filter(b => b.from !== selectedId && b.to !== selectedId));
    setSelectedId(null);
    setConnectFrom(null);
  }

  const byId = Object.fromEntries(machines.map(m => [m.id, m]));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', width: '100vw', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <aside style={{ padding: 16, borderRight: '1px solid #ddd', background: '#fff' }}>
        <h1>3D Factory Builder</h1>
        <p>Click the floor to place machines. Select two machines to connect them.</p>
        <h2>Machine type</h2>
        {types.map(t => (
          <button key={t.id} onClick={() => setSelectedType(t.id)} style={{ display: 'block', width: '100%', marginBottom: 8, padding: 10, borderRadius: 8, border: selectedType === t.id ? '2px solid #111' : '1px solid #ccc', background: t.color, color: 'white' }}>
            {t.label}
          </button>
        ))}
        <h2>Selected</h2>
        {selected ? (
          <div>
            <input value={selected.name} onChange={e => rename(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <button onClick={() => setConnectFrom(selected.id)} style={{ width: '100%', padding: 10, marginBottom: 8 }}>Start conveyor</button>
            <button onClick={removeSelected} style={{ width: '100%', padding: 10 }}>Delete</button>
          </div>
        ) : <p>No machine selected.</p>}
        <p>Machines: {machines.length}</p>
        <p>Conveyors: {belts.length}</p>
        {connectFrom && <strong>Click another machine to finish conveyor.</strong>}
      </aside>
      <main>
        <Canvas camera={{ position: [8, 8, 8], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 10, 5]} intensity={1} />
          <gridHelper args={[24, 24]} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={(e) => addMachine(Math.round(e.point.x), Math.round(e.point.z))}>
            <planeGeometry args={[24, 24]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          {belts.map(b => byId[b.from] && byId[b.to] ? <Conveyor key={b.id} from={byId[b.from]} to={byId[b.to]} /> : null)}
          {machines.map(m => <Machine key={m.id} item={m} selected={selectedId === m.id} onClick={selectMachine} />)}
          <OrbitControls />
        </Canvas>
      </main>
    </div>
  );
}
