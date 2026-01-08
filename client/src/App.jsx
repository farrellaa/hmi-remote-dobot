import { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Pastikan Backend (server/index.js) di Laptop sudah jalan di port 3001
const socket = io.connect("http://localhost:3001");

function App() {
  // --- STATE DATA ---
  const [connection, setConnection] = useState(false);
  const [status, setStatus] = useState("Idle"); // Idle, Running, Emergency
  
  // Data History (Hasil deteksi dari RevPi)
  const [history, setHistory] = useState([
    { id: 1, color: 'Red', target: 'Zone A', time: '14:05' },
    { id: 2, color: 'Blue', target: 'Zone C', time: '14:10' },
  ]);
  
  // Data Telemetry (Koordinat & Aktuator)
  const [telemetry, setTelemetry] = useState({
    x: 0, y: 0, z: 0, r: 0,
    gripper: false,
    conveyorSpeed: 0
  });

  // Data Summary (Counter)
  const [counters, setCounters] = useState({
    red: 0, green: 0, blue: 0, yellow: 0
  });

  // --- LOGIC SOCKET (SINKRONISASI DENGAN REVPI VIA BRIDGE) ---
  useEffect(() => {
    // 1. Monitor Koneksi ke Bridge Laptop
    socket.on("connect", () => setConnection(true));
    socket.on("disconnect", () => setConnection(false));

    // 2. Mendengarkan data dari RevPi (yang dipancarkan setiap 5 detik)
    socket.on("dobot_update", (data) => {
      // Update status sistem (Running/Idle/Emergency)
      if (data.status) setStatus(data.status);
      
      // Update koordinat x, y, z, r
      if (data.telemetry) {
        setTelemetry(data.telemetry);
      }
      
      // Update history list jika ada data baru
      if (data.history) {
        setHistory(data.history);
      }
      
      // Update counters (jumlah warna)
      if (data.counters) {
        setCounters(data.counters);
      }
    });

    // Cleanup saat komponen di-unmount
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("dobot_update");
    };
  }, []);

  // Fungsi Emergency Stop (Mengirim perintah balik ke RevPi)
  const triggerEmergencyStop = () => {
    console.warn("EMERGENCY STOP TRIGGERED");
    socket.emit("send_command", { action: 'emergency_stop' });
    setStatus("EMERGENCY");
  };

  // Helper Warna untuk Card
  const getColorHex = (color) => {
    const map = { 
      'Red': '#ef4444', 'Green': '#22c55e', 
      'Blue': '#3b82f6', 'Yellow': '#eab308' 
    };
    return map[color] || '#6b7280';
  };

  return (
    <div className="bg-[#0f1115] text-slate-200 min-h-screen flex flex-col font-sans overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="w-full h-20 bg-[#161920] border-b border-white/5 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <span className="material-symbols-outlined text-blue-400 text-3xl">monitoring</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">Dobot Magician</h1>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.2em]">Remote Monitoring System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Network Status</span>
            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full ${connection ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div>
              <span className={`text-xs font-bold ${connection ? 'text-green-400' : 'text-red-400'}`}>
                {connection ? 'STABLE' : 'OFFLINE'}
              </span>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg border font-black text-sm uppercase ${status === 'EMERGENCY' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
            {status}
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden max-w-[1800px] mx-auto w-full">
        
        {/* KIRI: HISTORY LOG */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">history</span> Process History
            </h2>
            <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-500">{history.length} Items</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {history.map((item) => (
              <div key={item.id} className="bg-[#161920] border border-white/5 p-4 rounded-xl hover:border-white/20 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-lg flex items-center justify-center border border-white/5 bg-white/[0.02]" style={{ borderColor: `${getColorHex(item.color)}44` }}>
                    <div className="size-3 rounded-full shadow-lg" style={{ backgroundColor: getColorHex(item.color), boxShadow: `0 0 10px ${getColorHex(item.color)}` }}></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Color: {item.color}</h4>
                    <p className="text-xs text-slate-500">Target: {item.target}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-600">{item.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* KANAN: SUMMARY & TELEMETRY */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* TOP RIGHT: SUMMARY COUNTERS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard label="Red" count={counters.red} color="bg-red-500" />
            <SummaryCard label="Green" count={counters.green} color="bg-green-500" />
            <SummaryCard label="Blue" count={counters.blue} color="bg-blue-500" />
            <SummaryCard label="Yellow" count={counters.yellow} color="bg-yellow-500" />
          </div>

          {/* BOTTOM RIGHT: TELEMETRY & E-STOP */}
          <div className="flex-1 bg-[#161920] border border-white/5 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <span className="material-symbols-outlined text-[120px]">precision_manufacturing</span>
            </div>

            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-blue-400">sensors</span> Real-time Telemetry
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <TelemetryValue label="Coordinate X" value={telemetry.x} unit="mm" />
              <TelemetryValue label="Coordinate Y" value={telemetry.y} unit="mm" />
              <TelemetryValue label="Coordinate Z" value={telemetry.z} unit="mm" />
              <TelemetryValue label="Rotation R" value={telemetry.r} unit="°" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-auto">
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Gripper Status</span>
                <span className={`text-sm font-black ${telemetry.gripper ? 'text-blue-400' : 'text-slate-600'}`}>
                  {telemetry.gripper ? 'HOLDING' : 'RELEASED'}
                </span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Conv. Speed</span>
                <span className="text-sm font-black text-white">
                  {telemetry.conveyorSpeed} <span className="text-[10px] font-normal text-slate-500">mm/s</span>
                </span>
              </div>
            </div>

            {/* EMERGENCY STOP */}
            <button 
              onClick={triggerEmergencyStop}
              className="mt-8 w-full py-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-[0_10px_40px_-10px_rgba(220,38,38,0.5)] group"
            >
              <span className="material-symbols-outlined text-3xl group-hover:scale-125 transition-transform duration-300">dangerous</span>
              <span className="text-sm font-black uppercase tracking-[0.3em]">Emergency Stop</span>
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function SummaryCard({ label, count, color }) {
  return (
    <div className="bg-[#161920] border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
      <div className={`absolute top-0 left-0 h-1 w-full ${color} opacity-50`}></div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{label}</span>
      <span className="text-3xl font-black text-white">{count}</span>
    </div>
  );
}

function TelemetryValue({ label, value, unit }) {
  const numericValue = typeof value === 'number' ? value : 0;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-mono font-medium text-white tracking-tighter">{numericValue.toFixed(2)}</span>
        <span className="text-xs text-slate-600 font-bold">{unit}</span>
      </div>
    </div>
  );
}

export default App;