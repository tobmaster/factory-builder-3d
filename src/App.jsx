import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import MovingItem from './MovingItem.jsx';

const types = [
  { id: 'press', label: 'Press', color: '#2563eb' },
  { id: 'cutter', label: 'Cutter', color: '#16a34a' },
  { id: 'robot', label: 'Robot', color: '#9333ea' },
  { id: 'packer', label: 'Packer', color: '#ea580c' }
];

const snap = (v) => Math.round(v);

function Conveyor({ from, to, running, speed }) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  const itemCount = Math.max(1, Math.floor(length / 2));

  return (
    <>
      <group position={[(from.x + to.x) / 2, 0.08, (from.z + to.z) / 2]} rotation={[0, -angle, 0]}>
        <mesh>
          <boxGeometry args={[length, 0.12, 0.35]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>
      {running && Array.from({ length: itemCount }).map((_, i) => (
        <MovingItem key={i} from={from} to={to} offset={i / itemCount} speed={speed} />
      ))}
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
      onPointerMove={(e) => { if (drag) onMove(m.id, snap(e.point.x), snap(e.point.z)); }}
    >
      <mesh>
        <boxGeometry args={[1,1,1]} />
        <meshStandardMaterial color={t.color} />
      </mesh>
      <mesh position={[0,-0.52,0]}>
        <cylinderGeometry args={[0.7,0.7,0.06,32]} />
        <meshStandardMaterial color={selected ? '#facc15' : '#e2e8f0'} />
      </mesh>
      <Text position={[0,0.85,0]} fontSize={0.18} color="#111" anchorX="center">{m.name}</Text>
    </group>
  );
}

export default function App(){
  const [machines,setMachines]=useState([]);
  const [belts,setBelts]=useState([]);
  const [type,setType]=useState('press');
  const [sel,setSel]=useState(null);
  const [connectFrom,setConnectFrom]=useState(null);
  const [running,setRunning]=useState(true);
  const [speed,setSpeed]=useState(0.4);

  const selected = machines.find(m=>m.id===sel);
  const byId = useMemo(()=>Object.fromEntries(machines.map(m=>[m.id,m])),[machines]);

  function add(x,z){
    const t=types.find(x=>x.id===type)||types[0];
    const id=String(Date.now());
    setMachines([...machines,{id,type,name:`${t.label} ${machines.length+1}`,x,z}]);
    setSel(id);
  }

  function select(id){
    if(connectFrom && connectFrom!==id){
      setBelts([...belts,{id:String(Date.now()),from:connectFrom,to:id}]);
      setConnectFrom(null);
    }
    setSel(id);
  }

  function move(id,x,z){
    setMachines(machines.map(m=>m.id===id?{...m,x,z}:m));
  }

  function rename(v){ setMachines(machines.map(m=>m.id===sel?{...m,name:v}:m)); }

  function del(){
    setMachines(machines.filter(m=>m.id!==sel));
    setBelts(belts.filter(b=>b.from!==sel&&b.to!==sel));
    setSel(null); setConnectFrom(null);
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:'320px 1fr',height:'100vh'}}>
      <aside style={{padding:16,borderRight:'1px solid #ddd',background:'#fff'}}>
        <h2>Factory Builder</h2>
        <p>Click floor to add · Alt+Drag to move</p>

        {types.map(t=> (
          <button key={t.id} onClick={()=>setType(t.id)} style={{display:'block',width:'100%',marginBottom:8,padding:10,background:t.color,color:'#fff'}}>
            {t.label}
          </button>
        ))}

        <h3>Simulation</h3>
        <button onClick={()=>setRunning(!running)} style={{width:'100%',marginBottom:8}}>
          {running ? 'Pause' : 'Start'}
        </button>

        <input type="range" min="0.1" max="1.5" step="0.05" value={speed} onChange={e=>setSpeed(Number(e.target.value))} />

        {selected && (
          <>
            <input value={selected.name} onChange={e=>rename(e.target.value)} style={{width:'100%'}} />
            <button onClick={()=>setConnectFrom(selected.id)}>Connect</button>
            <button onClick={del}>Delete</button>
          </>
        )}

        <p>M: {machines.length} · C: {belts.length}</p>
      </aside>

      <Canvas camera={{position:[8,8,8]}}>
        <ambientLight />
        <gridHelper args={[24,24]} />

        <mesh rotation={[-Math.PI/2,0,0]} onClick={(e)=>add(snap(e.point.x),snap(e.point.z))}>
          <planeGeometry args={[24,24]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>

        {belts.map(b=> byId[b.from]&&byId[b.to] ? (
          <Conveyor key={b.id} from={byId[b.from]} to={byId[b.to]} running={running} speed={speed} />
        ) : null)}

        {machines.map(m=> (
          <Machine key={m.id} m={m} selected={sel===m.id} onSelect={select} onMove={move} />
        ))}

        <OrbitControls />
      </Canvas>
    </div>
  );
}
