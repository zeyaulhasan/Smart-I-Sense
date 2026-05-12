# 🔌 Smart-I-Sense — ESP32 Hardware Guide

A step-by-step guide to wire, flash, and connect the ESP32 to the Smart-I-Sense backend.

---

## 📦 Required Components

| Component | Spec | Notes |
|---|---|---|
| ESP32 Dev Board | Any 30/38-pin variant | DOIT, AZ-Delivery, etc. |
| ACS712 Current Sensor | **30A module** (red PCB) | Measures AC current |
| YF-S201 Water Flow Sensor | G1/2" brass or plastic | Measures flow rate |
| Jumper Wires | M-to-M + M-to-F | Dupont cables |
| Micro-USB Cable | For flashing | Data cable, NOT charge-only |

---

## 🔧 Wiring Diagram

### ACS712 → ESP32

```
ACS712 PCB       ESP32 Pin
────────────     ─────────
VCC    ──────→   3V3  (3.3V rail)
GND    ──────→   GND
OUT    ──────→   GPIO 34  (ADC1_CH6)

AC Load wiring:
  Live wire passes THROUGH the ACS712 current clamp
  (the two large screw terminals labeled IP+ and IP-)
```

> ⚠️ **IMPORTANT**: Only use ADC1 pins (GPIO32–39) for the ACS712.  
> ADC2 is **disabled when WiFi is active** on ESP32!

### YF-S201 → ESP32

```
YF-S201 Wire     ESP32 Pin
────────────     ─────────
Red   (VCC) ──→  5V (VIN pin — NOT 3.3V!)
Black (GND) ──→  GND
Yellow(SIG) ──→  GPIO 27
```

> ⚠️ YF-S201 runs on **5V**. Use the VIN/5V pin on the ESP32 board (from USB power).

---

## 💻 Arduino IDE Setup

### 1. Install ESP32 Board Support

1. Open Arduino IDE → **File → Preferences**
2. In "Additional boards manager URLs" add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools → Board → Boards Manager**
4. Search for `esp32` → Install **esp32 by Espressif Systems**

### 2. Install Required Libraries

Go to **Sketch → Include Library → Manage Libraries**, then install:

| Library Name | Author | Version |
|---|---|---|
| `PubSubClient` | Nick O'Leary | ≥ 2.8.0 |
| `ArduinoJson` | Benoit Blanchon | ≥ 6.21.0 |

### 3. Board Settings

Go to **Tools** and set:

| Setting | Value |
|---|---|
| Board | `ESP32 Dev Module` |
| Upload Speed | `921600` |
| CPU Frequency | `240MHz` |
| Flash Frequency | `80MHz` |
| Flash Mode | `QIO` |
| Flash Size | `4MB (32Mb)` |
| Partition Scheme | `Default 4MB with spiffs` |
| Port | Your COM port (e.g., `COM3`, `COM7`) |

---

## ⚙️ Configuration — Before Flashing

Open `config.h` and update:

```cpp
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"
#define MQTT_SERVER     "192.168.x.x"   // ← Your PC's LAN IP
#define PROPERTY_ID     "property_01"
```

### Finding Your PC's LAN IP (Windows)

Open PowerShell and run:
```powershell
ipconfig
```
Look for **IPv4 Address** under your active WiFi adapter, e.g.:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.0.105
```
Use that IP as `MQTT_SERVER`.

---

## 🚀 Flashing

1. Connect ESP32 via USB
2. Select the correct **COM port** in Arduino IDE
3. Open `smart_i_sense_firmware.ino`
4. Click **Upload** (→ arrow button)
5. Hold the **BOOT button** on the ESP32 if upload fails to start
6. Open **Serial Monitor** at **115200 baud** to see live output

### Expected Serial Monitor Output

```
╔══════════════════════════════════════╗
║   Smart-I-Sense  ESP32 Firmware v2   ║
╚══════════════════════════════════════╝

📶 Connecting to WiFi: MyHomeNetwork......
✅ WiFi Connected!
   IP Address : 192.168.0.112
   Signal     : -55 dBm

📡 MQTT Topic: smartisense/property_01/sensors
🔌 Connecting to MQTT broker 192.168.0.105:1883 as 'SmartISense_A3F1'...
✅ MQTT Connected!
✅ Setup complete — entering main loop

─────────────────────────────────────────
📤 Published to [smartisense/property_01/sensors]
   ⚡ Electricity : 124.5 W
   💧 Water Flow  : 0.00 L/min
   📶 WiFi RSSI   : -53 dBm
   Status         : ✅ OK
─────────────────────────────────────────
```

---

## 🛑 Firewall Note (Windows)

The backend MQTT broker runs on **port 1883**. Windows Firewall may block incoming connections from the ESP32.

To allow it, open PowerShell as **Administrator** and run:
```powershell
New-NetFirewallRule -DisplayName "Smart-I-Sense MQTT" -Direction Inbound -Protocol TCP -LocalPort 1883 -Action Allow
```

---

## 🔍 Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| Upload fails | Wrong COM port / no driver | Install CP2102 or CH340 USB driver |
| WiFi stuck connecting | Wrong credentials | Double-check SSID/password (case-sensitive) |
| MQTT connection fails | Wrong IP or firewall | Run `ipconfig`, allow port 1883 in firewall |
| Electricity always 0W | ADC2 pin used | Switch to GPIO 34/35/36/39 (ADC1 only) |
| Water always 0 L/min | VCC on 3.3V | YF-S201 needs 5V — use VIN pin |
| Noisy electricity reading | Loose ACS712 wires | Secure all connections; add 10µF capacitor on VCC-GND |
| No data in dashboard | Simulator overwriting | Data appears — check the "Hardware" badge in the live feed |

---

## 📡 Data Flow

```
ESP32 Sensors
    │
    │  (ACS712 → ADC, YF-S201 → Interrupt)
    ▼
ESP32 Firmware  ──MQTT JSON──▶  Backend MQTT Broker (port 1883)
                                        │
                                        ▼
                               mqttService.js parses payload
                                        │
                                        ▼
                               SensorData saved to MongoDB
                                        │
                                 Socket.io emit('sensor-data')
                                        │
                                        ▼
                              React Dashboard updates in real-time
```

---

## 🔋 Power Tip

For stable demo operation, power the ESP32 from a **wall adapter via USB** (not laptop USB), to avoid noise on the ADC caused by laptop ground loops.
