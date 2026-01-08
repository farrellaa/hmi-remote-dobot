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
    mqttClient.subscribe('dobot/telemetry');
});

mqttClient.on('message', (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        // --- TAMBAHKAN LOG INI ---
        console.log("📥 Data masuk dari RevPi:", data); 
        
        io.emit("dobot_update", data);
    } catch (e) {
        console.log("❌ Error parsing data:", e);
    }
});

server.listen(3001, () => {
    console.log('🚀 Server Bridge jalan di port 3001');
});