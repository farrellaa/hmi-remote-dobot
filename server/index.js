const mqtt = require('mqtt');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5173" } // Port Vite kamu
});

// --- GANTI DENGAN IP REVPI KAMU ---
const REVPI_IP = "192.168.0.2"; 

const mqttClient = mqtt.connect(`mqtt://${REVPI_IP}:1883`);

mqttClient.on('connect', () => {
    console.log("✅ Terhubung ke MQTT Broker di RevPi");
    mqttClient.subscribe(['dobot/telemetry', 'dobot/history']); 
});

mqttClient.on('message', (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        
        if (topic === 'dobot/history') {
            // Jika data dari topik history, kirim event "history_update"
            io.emit("history_update", payload.history_item);
            console.log("📜 History baru diterima:", payload.history_item);
        } else {
            // Jika data telemetry, tetap gunakan event "dobot_update"
            io.emit("dobot_update", payload);
        }
    } catch (e) {
        console.log("❌ Error parsing data:", e);
    }
});

server.listen(3001, () => {
    console.log('🚀 Server Bridge jalan di port 3001');
});