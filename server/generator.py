import paho.mqtt.client as mqtt
import json
import time
import random

# Konfigurasi MQTT
MQTT_BROKER = "localhost"
MQTT_TOPIC = "dobot/telemetry"

client = mqtt.Client()

try:
    client.connect(MQTT_BROKER, 1883, 60)
    print("✅ Generator Dummy Aktif. Mengirim data ke MQTT...")
except:
    print("❌ Gagal terhubung ke MQTT Broker. Pastikan Mosquitto sudah jalan.")
    exit()

colors = ["Red", "Green", "Blue", "Yellow"]
zones = ["Zone A", "Zone B", "Zone C"]

while True:
    # Simulasi data yang berubah-ubah
    data = {
        "status": "Running",
        "telemetry": {
            "x": round(random.uniform(200, 300), 2),
            "y": round(random.uniform(-150, 150), 2),
            "z": round(random.uniform(20, 80), 2),
            "r": round(random.uniform(-90, 90), 2),
            "gripper": random.choice([True, False]),
            "conveyorSpeed": random.randint(30, 80)
        },
        "counters": {
            "red": random.randint(10, 20),
            "green": random.randint(5, 15),
            "blue": random.randint(8, 18),
            "yellow": random.randint(2, 10)
        },
        "history": [
            {"id": 1, "color": random.choice(colors), "target": random.choice(zones), "time": "19:40"},
            {"id": 2, "color": random.choice(colors), "target": random.choice(zones), "time": "19:45"}
        ]
    }
    
    client.publish(MQTT_TOPIC, json.dumps(data))
    time.sleep(0.5) # Kirim data setiap 0.5 detik