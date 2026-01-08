const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mqtt = require('mqtt');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Setup Socket.io (WebSocket untuk Frontend)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // URL Frontend React nanti
        methods: ["GET", "POST"]
    }
});

// Setup MQTT (Koneksi ke Broker Public dulu untuk tes)
// Nanti ganti dengan IP Broker lokal/cloud Anda jika sudah siap
const mqttClient = mqtt.connect('mqtt://broker.emqx.io'); 

// === LOGIC MQTT ===
mqttClient.on('connect', () => {
    console.log("✅ Terhubung ke MQTT Broker");
    mqttClient.subscribe('dobot/status'); // Dengar status dari Dobot
});

mqttClient.on('message', (topic, message) => {
    // Saat terima data dari Dobot (via MQTT)
    const data = message.toString();
    console.log(`📩 MQTT In: ${topic} -> ${data}`);
    
    // Teruskan langsung ke Frontend via WebSocket
    io.emit('dobot_status', JSON.parse(data)); 
});

// === LOGIC SOCKET.IO (Dari Frontend) ===
io.on('connection', (socket) => {
    console.log(`⚡ User terkoneksi: ${socket.id}`);

    // Saat Frontend kirim perintah (misal tombol ditekan)
    socket.on('send_command', (commandData) => {
        console.log("📤 Perintah dari Web:", commandData);
        
        // Teruskan ke Dobot via MQTT
        // Payload harus string/JSON string
        mqttClient.publish('dobot/command', JSON.stringify(commandData));
    });

    socket.on('disconnect', () => {
        console.log('User disconnect');
    });
});

// Jalankan Server
server.listen(3001, () => {
    console.log('🚀 Backend berjalan di http://localhost:3001');
});