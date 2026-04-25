import React, { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { createFactoryTextures } from './textures.js';

const STORAGE_KEY = 'factory-builder-3d-layout-v2';
const types = [
  { id: 'press', label: 'Press', color: '#2563eb' },
  { id: 'cutter', label: 'Cutter', color: '#16a34a' },
  { id: 'robot', label: 'Robot', color: '#9333ea' },
  { id: 'packer', label: 'Packer', color: '#ea580c' }
];
const snap = v => Math.round(v);
const btn = { minHeight: 44, border: 0, borderRadius: 12, padding: '10px 12px', fontWeight: 700 };

function loadSavedLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { machines: [], belts: [] };
    const parsed = JSON.parse(raw);
    return { machines: parsed.machines || [], belts: parsed.belts || [] };
  } catch {
    return { machines: [], belts: [] };
  }
}

function useFactoryTextures() {
  return useMemo(() => createFactoryTextures(), []);
}

function FactoryHall() {
  const tex = useFactoryTextures();
  const tiles = [];
  for (let x = -12; x <= 12; x += 2) for (let z = -12; z <= 12; z += 2) tiles.push([x, z]);
  const stains = [[-5,-4,1.5],[3,2,1],[7,-6,1.8],[-8,5,.9]];
  return <>
    <mesh position={[0,-0.055,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[26,26]} /><meshStandardMaterial map={tex.concrete} roughness={1} /></mesh>
    {tiles.map(([x,z],i)=><mesh key={i} position={[x,0.002,z]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.96,1.96]} /><meshStandardMaterial map={tex.concrete} color={i%2?'#fff':'#ddd'} roughness={1} /></mesh>)}
    {stains.map(([x,z,w],i)=><mesh key={i} position={[x,0.008,z]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[w,24]} /><meshStandardMaterial color="#1f2937" transparent opacity={0.2} /></mesh>)}
    <mesh position={[0,0.02,-9.5]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[18,0.22]} /><meshStandardMaterial color="#facc15" /></mesh>
    <mesh position={[0,0.021,-9.1]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[18,0.08]} /><meshStandardMaterial color="#111827" /></mesh>
    <mesh position={[0,2.2,-12]}><boxGeometry args={[26,4.4,0.25]} /><meshStandardMaterial map={tex.wall} roughness={0.9} /></mesh>
    <mesh position={[-12,2.2,0]}><boxGeometry args={[0.25,4.4,26]} /><meshStandardMaterial map={tex.wall} roughness={0.9} /></mesh>
    <mesh position={[12,2.2,0]}><boxGeometry args={[0.25,4.4,26]} /><meshStandardMaterial map={tex.wall} roughness={0.9} /></mesh>
    {[-8,-4,0,4,8].map(x => <mesh key={x} position={[x,2.55,-11.84]}><boxGeometry args={[2.3,1,0.08]} /><meshStandardMaterial map={tex.glass} transparent opacity={0.48} /></mesh>)}
    {[-9,-3,3,9].map(x => <mesh key={x} position={[x,4.25,0]}><boxGeometry args={[0.18,0.18,24]} /><meshStandardMaterial map={tex.metal} metalness={0.6} roughness={0.35} /></mesh>)}
    {[-8,0,8].map(x => <mesh key={x} position={[x,3.85,-2]}><boxGeometry args={[1.4,0.12,0.45]} /><meshStandardMaterial color="#fef3c7" emissive="#facc15" emissiveIntensity={0.35} /></mesh>)}
  </>;
}

function Conveyor({ from, to, running, speed, time }) {
  const tex = useFactoryTextures();
  if (!from || !to || from.id === to.id) return null;
  const dx = to.x - from.x, dz = to.z - from.z, length = Math.sqrt(dx*dx + dz*dz);
  if (!Number.isFinite(length) || length < 0.2) return null;
  const angle = Math.atan2(dz, dx), itemCount = Math.max(1, Math.min(6, Math.floor(length / 2)));
  return <>
    <group position={[(from.x+to.x)/2,0.09,(from.z+to.z)/2]} rotation={[0,-angle,0]}>
      <mesh><boxGeometry args={[length,0.16,0.5]} /><meshStandardMaterial map={tex.belt} roughness={0.85} /></mesh>
      <mesh position={[0,0.13,-0.24]}><boxGeometry args={[length,0.09,0.07]} /><meshStandardMaterial map={tex.metal} metalness={0.55} roughness={0.35} /></mesh>
      <mesh position={[0,0.13,0.24]}><boxGeometry args={[length,0.09,0.07]} /><meshStandardMaterial map={tex.metal} metalness={0.55} roughness={0.35} /></mesh>
    </group>
    {running && Array.from({ length: itemCount }).map((_, i) => { const p=(time*speed+i/itemCount)%1; return <mesh key={i} position={[from.x+dx*p,0.38,from.z+dz*p]}><boxGeometry args={[0.28,0.22,0.28]} /><meshStandardMaterial color="#facc15" roughness={0.5} /></mesh>; })}
  </>;
}

function StatusLights({ active }) {
  return <group position={[0.42,0.25,0.52]}>
    <mesh position={[0,0.22,0]}><sphereGeometry args={[0.045,12,12]} /><meshStandardMaterial color={active?'#22c55e':'#64748b'} emissive={active?'#22c55e':'#000'} emissiveIntensity={active?0.6:0} /></mesh>
    <mesh position={[0,0.08,0]}><sphereGeometry args={[0.045,12,12]} /><meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.25} /></mesh>
    <mesh position={[0,-0.06,0]}><sphereGeometry args={[0.045,12,12]} /><meshStandardMaterial color="#ef4444" /></mesh>
  </group>;
}

function MachineBody({ type, color, time, running }) {
  const tex = useFactoryTextures();
  const phase = running ? time : 0;
  const metal = <meshStandardMaterial map={tex.metal} color="#94a3b8" metalness={0.65} roughness={0.25} />;
  if (type === 'robot') return <>
    <mesh position={[0,0.05,0]}><cylinderGeometry args={[0.45,0.55,0.18,32]} />{metal}</mesh>
    <mesh position={[0,0.35,0]}><cylinderGeometry args={[0.28,0.42,0.7,24]} /><meshStandardMaterial color={color} metalness={0.4} roughness={0.28} /></mesh>
    <mesh position={[0,0.85,0]}><sphereGeometry args={[0.32,24,24]} /><meshStandardMaterial color={color} metalness={0.35} roughness={0.25} /></mesh>
    <group rotation={[0,Math.sin(phase*2)*0.9,0]}><mesh position={[0.45,0.58,0]} rotation={[0,0,0.8]}><boxGeometry args={[0.75,0.16,0.16]} />{metal}</mesh><mesh position={[0.86,0.34,0]}><boxGeometry args={[0.18,0.18,0.28]} />{metal}</mesh></group>
    <StatusLights active={running}/>
  </>;
  if (type === 'cutter') return <>
    <mesh position={[0,0,0]}><boxGeometry args={[1.05,0.18,1.05]} />{metal}</mesh>
    <mesh position={[0,0.38,0]}><cylinderGeometry args={[0.5,0.5,0.75,32]} /><meshStandardMaterial color={color} metalness={0.35} roughness={0.32} /></mesh>
    <mesh position={[0,0.82,0]} rotation={[0,phase*10,0]}><torusGeometry args={[0.42,0.04,12,40]} /><meshStandardMaterial map={tex.metal} color="#e5e7eb" metalness={0.8} roughness={0.2} /></mesh>
    <mesh position={[0,0.82,0]} rotation={[Math.PI/2,phase*10,0]}><boxGeometry args={[0.85,0.04,0.08]} />{metal}</mesh>
    <StatusLights active={running}/>
  </>;
  if (type === 'packer') return <>
    <mesh position={[0,0.1,0]}><boxGeometry args={[1.15,0.95,1.15]} /><meshStandardMaterial color={color} metalness={0.25} roughness={0.4} /></mesh>
    <mesh position={[0,0.7+Math.abs(Math.sin(phase*3))*0.2,0]}><boxGeometry args={[0.82,0.16,0.82]} />{metal}</mesh>
    <mesh position={[0.48,0.25,0]}><boxGeometry args={[0.08,0.5,0.9]} />{metal}</mesh>
    <mesh position={[-0.48,0.25,0]}><boxGeometry args={[0.08,0.5,0.9]} />{metal}</mesh>
    <StatusLights active={running}/>
  </>;
  return <>
    <mesh position={[0,0.04,0]}><boxGeometry args={[1.2,0.2,1.15]} />{metal}</mesh>
    <mesh position={[0,0.36,0]}><boxGeometry args={[1.1,0.72,1.1]} /><meshStandardMaterial color={color} metalness={0.4} roughness={0.32} /></mesh>
    <mesh position={[0,0.74-Math.abs(Math.sin(phase*3))*0.22,0]}><boxGeometry args={[0.76,0.18,0.76]} />{metal}</mesh>
    <mesh position={[0.52,0.45,0.52]}><cylinderGeometry args={[0.05,0.05,0.7,12]} />{metal}</mesh>
    <mesh position={[-0.52,0.45,0.52]}><cylinderGeometry args={[0.05,0.05,0.7,12]} />{metal}</mesh>
    <StatusLights active={running}/>
  </>;
}

function Machine({ m, selected, onSelect, moveMode, time, running }) {
  const t = types.find(x => x.id === m.type) || types[0];
  return <group position={[m.x,0.5,m.z]} onClick={(e)=>{e.stopPropagation();onSelect(m.id);}}>
    <MachineBody type={m.type} color={t.color} time={time} running={running} />
    <mesh position={[0,-0.52,0]}><cylinderGeometry args={[0.84,0.84,0.08,32]} /><meshStandardMaterial color={selected?'#facc15':'#6b7280'} metalness={0.2} roughness={0.55} /></mesh>
    {selected && moveMode && <mesh position={[0,1.35,0]}><sphereGeometry args={[0.14,16,16]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} /></mesh>}
    <Text position={[0,1.22,0]} fontSize={0.18} color="#111" anchorX="center">{m.name}</Text>
  </group>;
}

export default function App() {
  const saved = useMemo(loadSavedLayout, []);
  const [machines,setMachines]=useState(saved.machines), [belts,setBelts]=useState(saved.belts), [type,setType]=useState('press'), [sel,setSel]=useState(null), [connectFrom,setConnectFrom]=useState(null), [running,setRunning]=useState(true), [speed,setSpeed]=useState(0.4), [time,setTime]=useState(0), [moveMode,setMoveMode]=useState(false);
  useEffect(()=>{ if(!running) return; const h=window.setInterval(()=>setTime(t=>t+0.04),40); return()=>window.clearInterval(h); },[running]);
  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify({machines, belts})); }, [machines, belts]);
  const selected=machines.find(m=>m.id===sel), byId=useMemo(()=>Object.fromEntries(machines.map(m=>[m.id,m])),[machines]);
  function addOrMove(x,z){ if(moveMode&&sel){setMachines(c=>c.map(m=>m.id===sel?{...m,x,z}:m));setMoveMode(false);return;} const t=types.find(x=>x.id===type)||types[0], id=`${Date.now()}-${Math.random()}`; setMachines(c=>[...c,{id,type,name:`${t.label} ${c.length+1}`,x,z}]); setSel(id); }
  function select(id){ if(connectFrom&&connectFrom!==id){ const exists=belts.some(b=>b.from===connectFrom&&b.to===id); if(!exists)setBelts(c=>[...c,{id:`${Date.now()}-${Math.random()}`,from:connectFrom,to:id}]); setConnectFrom(null);} setSel(id); }
  function rename(v){setMachines(c=>c.map(m=>m.id===sel?{...m,name:v}:m));}
  function del(){setMachines(c=>c.filter(m=>m.id!==sel));setBelts(c=>c.filter(b=>b.from!==sel&&b.to!==sel));setSel(null);setConnectFrom(null);}
  function resetLayout(){ localStorage.removeItem(STORAGE_KEY); setMachines([]); setBelts([]); setSel(null); setConnectFrom(null); setMoveMode(false); }
  return <div style={{height:'100vh',fontFamily:'Arial,sans-serif',background:'#0f172a',overflow:'hidden'}}><main style={{height:'100vh'}}><Canvas camera={{position:[8,8,8],fov:45}}>
    <ambientLight intensity={0.42}/><directionalLight position={[5,10,5]} intensity={1.15}/><pointLight position={[0,3,-6]} intensity={0.6}/><FactoryHall/><gridHelper args={[24,24]}/>
    <mesh rotation={[-Math.PI/2,0,0]} onClick={(e)=>addOrMove(snap(e.point.x),snap(e.point.z))}><planeGeometry args={[24,24]}/><meshStandardMaterial color="#f8fafc" transparent opacity={0.04}/></mesh>
    {belts.map(b=><Conveyor key={b.id} from={byId[b.from]} to={byId[b.to]} running={running} speed={speed} time={time}/>) }
    {machines.map(m=><Machine key={m.id} m={m} selected={sel===m.id} onSelect={select} moveMode={moveMode} time={time} running={running}/>) }
    <OrbitControls/>
  </Canvas></main><aside style={{position:'fixed',left:12,right:12,bottom:12,maxHeight:'46vh',overflowY:'auto',background:'rgba(255,255,255,.96)',borderRadius:18,padding:12,boxShadow:'0 20px 40px rgba(0,0,0,.25)'}}>
    <strong>Factory Builder</strong><span style={{float:'right'}}>M {machines.length} · C {belts.length}</span>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:10}}>{types.map(t=><button key={t.id} onClick={()=>setType(t.id)} style={{...btn,background:t.color,color:'#fff',outline:type===t.id?'3px solid #111':'none'}}>{t.label}</button>)}</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:10}}><button onClick={()=>setRunning(!running)} style={btn}>{running?'Pause':'Start'}</button><button disabled={!selected} onClick={()=>setMoveMode(true)} style={btn}>Move</button><button disabled={!selected} onClick={()=>setConnectFrom(selected.id)} style={btn}>Connect</button></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,alignItems:'center',marginTop:10}}><input type="range" min="0.1" max="1.5" step="0.05" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/><button onClick={resetLayout} style={{...btn,background:'#111827',color:'#fff'}}>Reset</button></div>
    {selected&&<div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,marginTop:10}}><input value={selected.name} onChange={e=>rename(e.target.value)} style={{minHeight:40,borderRadius:10,border:'1px solid #ccc',padding:'0 10px'}}/><button onClick={del} style={{...btn,background:'#ef4444',color:'#fff'}}>Delete</button></div>}
    <small>{moveMode?'Tap the grid to move selected machine.':connectFrom?'Tap target machine to create conveyor.':'Tap grid to add. Tap machine to select. Layout saves automatically.'}</small>
  </aside></div>;
}
