import { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Pastikan Backend (server/index.js) sudah jalan di port 3001
const socket = io.connect("http://localhost:3001");

function App() {
  // --- STATE DATA ---
  const [connection, setConnection] = useState(false);
  const [status, setStatus] = useState("Idle");
  
  // Data Queue (Antrian)
  const [queue, setQueue] = useState([]);
  
  // Data Sensor (Simulasi Koordinat)
  const [telemetry, setTelemetry] = useState({
    x: 245.50, y: -120.20, z: 45.00, r: 12.5,
    gripper: false
  });

  // Data Counter
  const [counters, setCounters] = useState({
    red: 0, green: 0, blue: 0, yellow: 0
  });

  // --- LOGIC SOCKET ---
  useEffect(() => {
    socket.on("connect", () => setConnection(true));
    socket.on("disconnect", () => setConnection(false));

    // Menerima update dari Backend (yang meneruskan dari MQTT Dobot)
    socket.on("dobot_status", (data) => {
      if(data.status) setStatus(data.status);
      if(data.queue) setQueue(data.queue);
      // Jika nanti ada data telemetry/counter dari python, handle disini
      // if(data.telemetry) setTelemetry(data.telemetry); 
    });

    return () => socket.off("dobot_status");
  }, []);

  // Fungsi Kirim Perintah ke Backend
  const sendCommand = (actionType, payload) => {
    console.log("Mengirim:", actionType, payload);
    socket.emit("send_command", { action: actionType, ...payload });
  };

  // Helper Warna
  const getColorClass = (color) => {
    const map = { 
      'Merah': 'bg-red-500', 'Red': 'bg-red-500',
      'Hijau': 'bg-green-500', 'Green': 'bg-green-500',
      'Biru': 'bg-blue-500', 'Blue': 'bg-blue-500',
      'Kuning': 'bg-yellow-500', 'Yellow': 'bg-yellow-500'
    };
    return map[color] || 'bg-gray-500';
  };

  const activeTask = queue.length > 0 ? queue[0] : null;
  const pendingTasks = queue.length > 1 ? queue.slice(1) : [];

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-text-main dark:text-white min-h-screen flex flex-col overflow-hidden transition-colors duration-300">
      
      {/* --- HEADER --- */}
      <header className="w-full h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">precision_manufacturing</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-tight tracking-tight text-text-main dark:text-white">Dobot Control</h1>
            <span className="text-xs font-medium text-text-sub uppercase tracking-wider">HMI Remote System</span>
          </div>
        </div>
        
        {/* Indikator Status Kanan Atas */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 mr-4 border-r border-border-light dark:border-border-dark pr-6 h-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-text-sub uppercase">Connection</span>
              <span className={`text-xs font-medium ${connection ? 'text-green-500' : 'text-red-500'}`}>
                {connection ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
            <div className={`size-2 rounded-full bg-green-500 ${status === 'Moving' ? 'animate-pulse' : ''}`}></div>
            <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
              {status}
            </span>
          </div>
        </div>
      </header>

      {/* --- MAIN DASHBOARD --- */}
      <main className="flex-1 overflow-hidden p-6 w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          
          {/* KOLOM KIRI: ANTRIAN TUGAS */}
          <section className="lg:col-span-8 flex flex-col gap-4 h-full overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold tracking-tight">Task Queue</h2>
              <div className="flex gap-2">
                {/* Tombol Kontrol Manual */}
                <button onClick={() => sendCommand('add_queue', { color: 'Merah', target: 'A' })} 
                  className="flex items-center gap-1 text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded hover:bg-red-500/20 transition font-bold">
                  <span className="material-symbols-outlined text-[16px]">add</span> Red Task
                </button>
                <button onClick={() => sendCommand('add_queue', { color: 'Hijau', target: 'B' })} 
                  className="flex items-center gap-1 text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1.5 rounded hover:bg-green-500/20 transition font-bold">
                  <span className="material-symbols-outlined text-[16px]">add</span> Green Task
                </button>
                <button onClick={() => sendCommand('add_queue', { color: 'Biru', target: 'C' })} 
                  className="flex items-center gap-1 text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded hover:bg-blue-500/20 transition font-bold">
                  <span className="material-symbols-outlined text-[16px]">add</span> Blue Task
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 dark:bg-black/20 border border-border-light dark:border-border-dark rounded-xl p-4 shadow-inner space-y-4">
              
              {/* KARTU AKTIF (ACTIVE JOB) */}
              {activeTask ? (
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-primary/50 shadow-sm p-5 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-primary/20 text-primary-dark dark:text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Running</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1">Processing Task</h3>
                        <p className="text-text-sub text-sm">Target Location: {activeTask.target}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-sub uppercase font-bold">Color</span>
                          <div className="flex items-center gap-1.5 font-medium">
                            <div className={`size-3 rounded-full ${getColorClass(activeTask.color)}`}></div> {activeTask.color}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-border-dark rounded-xl text-text-sub">
                  Waiting for command...
                </div>
              )}

              {/* LIST ANTRIAN (PENDING) */}
              <div className="space-y-3">
                {pendingTasks.map((task, idx) => (
                  <div key={idx} className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg border border-border-light dark:border-border-dark flex items-center justify-between hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded bg-background-light dark:bg-background-dark flex items-center justify-center text-text-sub">
                        <span className="material-symbols-outlined">pending</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Queue #{idx + 1}</h4>
                        <p className="text-xs text-text-sub">Target: {task.target}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className={`size-2 rounded-full ${getColorClass(task.color)}`}></div>
                        <span className="text-xs font-mono text-text-sub">{task.color}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>

          {/* KOLOM KANAN: MONITORING */}
          <aside className="lg:col-span-4 flex flex-col gap-4 h-full">
            
            {/* COUNTERS */}
            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-bold tracking-tight">Output Counters</h2>
              <div className="grid grid-cols-2 gap-3">
                <CounterBox color="bg-red-500" count={counters.red} label="Red" />
                <CounterBox color="bg-green-500" count={counters.green} label="Green" />
                <CounterBox color="bg-blue-500" count={counters.blue} label="Blue" />
                <CounterBox color="bg-yellow-500" count={counters.yellow} label="Yellow" />
              </div>
            </div>

            {/* KOORDINAT & KONTROL DARURAT */}
            <div className="flex flex-col gap-3 mt-2 flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Telemetry</h2>
                <span className="text-[10px] text-text-sub bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark px-2 py-0.5 rounded uppercase">Live</span>
              </div>
              
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 flex flex-col gap-5 shadow-sm h-full">
                <div className="grid grid-cols-1 gap-4">
                  <CoordinateRow label="X" value={telemetry.x} />
                  <CoordinateRow label="Y" value={telemetry.y} />
                  <CoordinateRow label="Z" value={telemetry.z} />
                </div>

                <div className="mt-auto pt-4 border-t border-border-light dark:border-border-dark">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => sendCommand('calibrate', {})} className="w-full py-2 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-border-dark text-xs font-bold uppercase transition text-text-main dark:text-white">
                      Homing
                    </button>
                    <button onClick={() => sendCommand('emergency_stop', {})} className="w-full py-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold uppercase transition animate-pulse">
                      STOP
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// --- SUB COMPONENTS (Agar kode lebih rapi) ---
const CounterBox = ({ color, count, label }) => (
  <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg border border-border-light dark:border-border-dark flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
    <div className={`absolute top-0 left-0 w-full h-1 ${color}`}></div>
    <span className="text-3xl font-bold text-text-main dark:text-white mb-1">{count}</span>
    <div className="flex items-center gap-1.5">
      <div className={`size-2 rounded-full ${color}`}></div>
      <span className="text-xs font-medium text-text-sub uppercase">{label}</span>
    </div>
  </div>
);

const CoordinateRow = ({ label, value }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark">
    <div className="flex items-center gap-3">
      <div className="size-8 rounded bg-surface-light dark:bg-surface-dark flex items-center justify-center font-bold text-text-sub border border-border-light dark:border-border-dark shadow-sm">{label}</div>
    </div>
    <span className="text-xl font-mono font-medium tracking-tight text-text-main dark:text-white">{value}</span>
  </div>
);

export default App;