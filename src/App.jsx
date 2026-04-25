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
const btn = { minHeight: 44, border: 0, borderRadius: 12, padding: '10px 12px', fontWeight: 700 };

function FactoryHall() {
  return <>
    <mesh position={[0,-0.04,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[26,26]} /><meshStandardMaterial color="#d1d5db" /></mesh>
    <mesh position={[0,2.2,-12]}><boxGeometry args={[26,4.4,0.25]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
    <mesh position={[-12,2.2,0]}><boxGeometry args={[0.25,4.4,26]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
    <mesh position={[12,2.2,0]}><boxGeometry args={[0.25,4.4,26]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
    <mesh position={[0,4.45,0]}><boxGeometry args={[26,0.18,26]} /><meshStandardMaterial color="#cbd5e1" transparent opacity={0.45} /></mesh>
    {[-8,-4,0,4,8].map(x => <mesh key={x} position={[x,2.5,-11.86]}><boxGeometry args={[2.3,1.0,0.08]} /><meshStandardMaterial color="#bfdbfe" transparent opacity={0.55} /></mesh>)}
    {[-9,-3,3,9].map(x => <mesh key={x} position={[x,4.25,0]}><boxGeometry args={[0.18,0.18,24]} /><meshStandardMaterial color="#64748b" /></mesh>)}
    {[-8,0,8].map(x => <mesh key={x} position={[x,3.85,-2]}><boxGeometry args={[1.4,0.12,0.45]} /><meshStandardMaterial color="#fef3c7" emissive="#facc15" emissiveIntensity={0.3} /></mesh>)}
  </>;
}

function Conveyor({ from, to, running, speed, time }) {
  if (!from || !to || from.id === to.id) return null;
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  if (!Number.isFinite(length) || length < 0.2) return null;
  const angle = Math.atan2(dz, dx);
  const itemCount = Math.max(1, Math.min(6, Math.floor(length / 2)));
  return <>
    <group position={[(from.x + to.x) / 2, 0.09, (from.z + to.z) / 2]} rotation={[0, -angle, 0]}>
      <mesh><boxGeometry args={[length, 0.16, 0.5]} /><meshStandardMaterial color="#1f2937" /></mesh>
      <mesh position={[0, 0.11, -0.22]}><boxGeometry args={[length, 0.08, 0.06]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      <mesh position={[0, 0.11, 0.22]}><boxGeometry args={[length, 0.08, 0.06]} /><meshStandardMaterial color="#94a3b8" /></mesh>
    </group>
    {running && Array.from({ length: itemCount }).map((_, i) => { const p = (time * speed + i / itemCount) % 1; return <mesh key={i} position={[from.x + dx * p, 0.38, from.z + dz * p]}><boxGeometry args={[0.28, 0.22, 0.28]} /><meshStandardMaterial color="#facc15" /></mesh>; })}
  </>;
}

function MachineBody({ type, color, time, running }) {
  const phase = running ? time : 0;
  if (type === 'robot') return <>
    <mesh position={[0,0.1,0]}><cylinderGeometry args={[0.28,0.42,0.7,24]} /><meshStandardMaterial color={color} metalness={0.25} roughness={0.35} /></mesh>
    <mesh position={[0,0.65,0]}><sphereGeometry args={[0.32,24,24]} /><meshStandardMaterial color={color} metalness={0.2} roughness={0.35} /></mesh>
    <group rotation={[0, Math.sin(phase*2)*0.9, 0]}><mesh position={[0.45,0.45,0]} rotation={[0,0,0.8]}><boxGeometry args={[0.65,0.16,0.16]} /><meshStandardMaterial color="#475569" /></mesh><mesh position={[0.8,0.22,0]}><sphereGeometry args={[0.12,16,16]} /><meshStandardMaterial color="#e5e7eb" /></mesh></group>
  </>;
  if (type === 'cutter') return <>
    <mesh><cylinderGeometry args={[0.5,0.5,0.9,32]} /><meshStandardMaterial color={color} metalness={0.2} roughness={0.35} /></mesh>
    <mesh position={[0,0.55,0]} rotation={[0, phase*8, 0]}><torusGeometry args={[0.38,0.04,12,32]} /><meshStandardMaterial color="#e5e7eb" metalness={0.5} /></mesh>
  </>;
  if (type === 'packer') return <>
    <mesh><boxGeometry args={[1.1,0.85,1.1]} /><meshStandardMaterial color={color} metalness={0.15} roughness={0.45} /></mesh>
    <mesh position={[0,0.55 + Math.abs(Math.sin(phase*3))*0.18,0]}><boxGeometry args={[0.75,0.12,0.75]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
  </>;
  return <>
    <mesh><boxGeometry args={[1.1,0.8,1.1]} /><meshStandardMaterial color={color} metalness={0.25} roughness={0.35} /></mesh>
    <mesh position={[0,0.52 - Math.abs(Math.sin(phase*3))*0.18,0]}><boxGeometry args={[0.7,0.18,0.7]} /><meshStandardMaterial color="#cbd5e1" metalness={0.35} /></mesh>
  </>;
}

function Machine({ m, selected, onSelect, moveMode, time, running }) {
  const t = types.find(x => x.id === m.type) || types[0];
  return <group position={[m.x, 0.5, m.z]} onClick={(e) => { e.stopPropagation(); onSelect(m.id); }}>
    <MachineBody type={m.type} color={t.color} time={time} running={running} />
    <mesh position={[0,-0.52,0]}><cylinderGeometry args={[0.78,0.78,0.08,32]} /><meshStandardMaterial color={selected ? '#facc15' : '#e2e8f0'} /></mesh>
    {selected && moveMode && <mesh position={[0,1.15,0]}><sphereGeometry args={[0.14,16,16]} /><meshStandardMaterial color="#ef4444" /></mesh>}
    <Text position={[0,1.02,0]} fontSize={0.18} color="#111" anchorX="center">{m.name}</Text>
  </group>;
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
  const [moveMode, setMoveMode] = useState(false);

  useEffect(() => { if (!running) return; const h = window.setInterval(() => setTime(t => t + 0.04), 40); return () => window.clearInterval(h); }, [running]);
  const selected = machines.find(m => m.id === sel);
  const byId = useMemo(() => Object.fromEntries(machines.map(m => [m.id, m])), [machines]);

  function addOrMove(x,z){ if (moveMode && sel) { setMachines(c => c.map(m => m.id === sel ? {...m,x,z} : m)); setMoveMode(false); return; } const t = types.find(x => x.id === type) || types[0]; const id = `${Date.now()}-${Math.random()}`; setMachines(c => [...c,{id,type,name:`${t.label} ${c.length+1}`,x,z}]); setSel(id); }
  function select(id){ if(connectFrom && connectFrom!==id){ const exists=belts.some(b=>b.from===connectFrom&&b.to===id); if(!exists) setBelts(c=>[...c,{id:`${Date.now()}-${Math.random()}`,from:connectFrom,to:id}]); setConnectFrom(null); } setSel(id); }
  function rename(v){ setMachines(c=>c.map(m=>m.id===sel?{...m,name:v}:m)); }
  function del(){ setMachines(c=>c.filter(m=>m.id!==sel)); setBelts(c=>c.filter(b=>b.from!==sel&&b.to!==sel)); setSel(null); setConnectFrom(null); }

  return <div style={{height:'100vh',fontFamily:'Arial,sans-serif',background:'#0f172a',overflow:'hidden'}}>
    <main style={{height:'100vh'}}><Canvas camera={{ position: [8, 8, 8], fov: 45 }}>
      <ambientLight intensity={0.55} /><directionalLight position={[5,10,5]} intensity={1.1} /><pointLight position={[0,3,-6]} intensity={0.5} />
      <FactoryHall />
      <gridHelper args={[24,24]} />
      <mesh rotation={[-Math.PI/2,0,0]} onClick={(e)=>addOrMove(snap(e.point.x),snap(e.point.z))}><planeGeometry args={[24,24]} /><meshStandardMaterial color="#f8fafc" transparent opacity={0.08} /></mesh>
      {belts.map(b => <Conveyor key={b.id} from={byId[b.from]} to={byId[b.to]} running={running} speed={speed} time={time} />)}
      {machines.map(m => <Machine key={m.id} m={m} selected={sel===m.id} onSelect={select} moveMode={moveMode} time={time} running={running} />)}
      <OrbitControls />
    </Canvas></main>
    <aside style={{position:'fixed',left:12,right:12,bottom:12,maxHeight:'44vh',overflowY:'auto',background:'rgba(255,255,255,.96)',borderRadius:18,padding:12,boxShadow:'0 20px 40px rgba(0,0,0,.25)'}}>
      <strong>Factory Builder</strong><span style={{float:'right'}}>M {machines.length} · C {belts.length}</span>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:10}}>{types.map(t=><button key={t.id} onClick={()=>setType(t.id)} style={{...btn,background:t.color,color:'#fff',outline:type===t.id?'3px solid #111':'none'}}>{t.label}</button>)}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:10}}><button onClick={()=>setRunning(!running)} style={btn}>{running?'Pause':'Start'}</button><button disabled={!selected} onClick={()=>setMoveMode(true)} style={btn}>Move</button><button disabled={!selected} onClick={()=>setConnectFrom(selected.id)} style={btn}>Connect</button></div>
      <input type="range" min="0.1" max="1.5" step="0.05" value={speed} onChange={e=>setSpeed(Number(e.target.value))} style={{width:'100%',marginTop:10}} />
      {selected && <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,marginTop:10}}><input value={selected.name} onChange={e=>rename(e.target.value)} style={{minHeight:40,borderRadius:10,border:'1px solid #ccc',padding:'0 10px'}}/><button onClick={del} style={{...btn,background:'#ef4444',color:'#fff'}}>Delete</button></div>}
      <small>{moveMode?'Tap the grid to move selected machine.':connectFrom?'Tap target machine to create conveyor.':'Tap grid to add. Tap machine to select.'}</small>
    </aside>
  </div>;
}
