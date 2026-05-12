/**
 * ============================================================
 *  Smart-I-Sense ESP32 Firmware v3.0  —  HTTP Edition
 * ============================================================
 *  ✅ Uses HTTP POST instead of MQTT
 *     - No broker setup needed
 *     - No firewall MQTT issues
 *     - Works exactly like your frontend calling the backend API
 *
 *  Hardware:
 *    - ESP32 (any dev board)
 *    - ACS712-30A  → Electricity / Current sensor (GPIO34)
 *    - YF-S201     → Water flow sensor (GPIO27)
 *    - Built-in LED (GPIO2) → Status blinks
 *
 *  Libraries needed (Sketch → Library Manager):
 *    1. ArduinoJson  by Benoit Blanchon  (v6.x)
 *
 *  All settings in config.h — edit that file, not this one.
 * ============================================================
 */

#include "config.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ─────────────────────────────────────────────────────────────
//  GLOBAL STATE
// ─────────────────────────────────────────────────────────────

// Water flow sensor (interrupt-driven)
volatile uint32_t      pulseCount       = 0;
volatile unsigned long lastPulseUs      = 0;
float                  flowRateLpm      = 0.0f;
unsigned long          lastFlowCalcTime = 0;

// 2ms debounce — blocks MHz EMI spikes, passes real YF-S201 pulses (max ~225 Hz)
#define MIN_PULSE_INTERVAL_US  2000UL

// Timing
unsigned long lastPublishTime = 0;

// Electricity smoothing buffer
const int ELEC_SAMPLES = 5;
float     elecBuffer[ELEC_SAMPLES];
int       elecBufIdx  = 0;
bool      elecBufFull = false;

// ACS712 auto-calibrated zero-current midpoint (set at boot, no load)
// This replaces the theoretical VCC/2 midpoint which drifts with component tolerances.
int acs712Midpoint = 2048;  // Will be overwritten by calibrateACS712() at startup

// ─────────────────────────────────────────────────────────────
//  INTERRUPT — Flow Sensor Pulse Counter
// ─────────────────────────────────────────────────────────────
void IRAM_ATTR onFlowPulse() {
  unsigned long nowUs = micros();
  if ((nowUs - lastPulseUs) >= MIN_PULSE_INTERVAL_US) {
    pulseCount++;
    lastPulseUs = nowUs;
  }
}

// ─────────────────────────────────────────────────────────────
//  LED HELPERS
// ─────────────────────────────────────────────────────────────
void ledOn()  { digitalWrite(LED_PIN, HIGH); }
void ledOff() { digitalWrite(LED_PIN, LOW);  }

void blinkLed(int times, int ms = 120) {
  for (int i = 0; i < times; i++) {
    ledOn();  delay(ms);
    ledOff(); delay(ms);
  }
}

// ─────────────────────────────────────────────────────────────
//  WiFi CONNECTION
// ─────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("\n📶 Connecting to: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 40) {
    delay(500);
    Serial.print(".");
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.printf("   ESP32 IP  : %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("   Signal    : %d dBm\n", WiFi.RSSI());
    blinkLed(3, 100);
  } else {
    Serial.println("\n❌ WiFi failed — restarting...");
    delay(3000);
    ESP.restart();
  }
}

// ─────────────────────────────────────────────────────────────
//  PING TEST — Verify backend is reachable before publishing
// ─────────────────────────────────────────────────────────────
bool pingBackend() {
  HTTPClient http;
  char url[100];
  snprintf(url, sizeof(url), "http://%s:%d/api/hardware/ping", BACKEND_HOST, BACKEND_PORT);

  http.begin(url);
  http.setTimeout(5000);
  int code = http.GET();
  http.end();

  return (code == 200);
}

// ─────────────────────────────────────────────────────────────
//  ACS712 CALIBRATION — Find true zero-current midpoint
// ─────────────────────────────────────────────────────────────
// Called AFTER WiFi connects (so ADC noise from RF is already present).
// Countdown gives the user time to DISCONNECT the load before sampling.
// Can also be triggered any time by typing 'c' in the Serial Monitor.
void calibrateACS712() {
  Serial.println();
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("🔴  ACS712 CALIBRATION — DISCONNECT LOAD / LED STRIP NOW");
  Serial.println("   Unplug the 9V battery or the LED strip from the circuit.");
  Serial.println("   Calibrating in:");
  for (int i = 5; i >= 1; i--) {
    Serial.printf("      %d...\n", i);
    blinkLed(3, 80);   // Rapid triple-blink = danger / wait
    delay(400);
  }
  Serial.println("   📸 Sampling now...");

  int64_t sum = 0;
  const int CAL_SAMPLES = 300;   // More samples = more accurate baseline
  for (int i = 0; i < CAL_SAMPLES; i++) {
    sum += analogRead(ACS712_PIN);
    delay(1);
  }
  acs712Midpoint = (int)(sum / CAL_SAMPLES);
  float midpointVolts = (acs712Midpoint / 4095.0f) * 3.3f;

  Serial.printf("   ✅ Zero-point set: ADC %d  (%.3f V)\n",
                acs712Midpoint, midpointVolts);
  Serial.println("   RECONNECT the load / LED strip now.");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println();

  // Clear smoothing buffer so old (wrong) readings don't pollute the average
  memset(elecBuffer, 0, sizeof(elecBuffer));
  elecBufIdx  = 0;
  elecBufFull = false;

  blinkLed(5, 60);  // Fast burst = calibration done
}

// ─────────────────────────────────────────────────────────────
//  ELECTRICITY READING  (ACS712)
// ─────────────────────────────────────────────────────────────
float readCurrentRMS() {
  // Use the auto-calibrated midpoint captured at boot (no load).
  // This is far more accurate than the theoretical VCC/2 formula.
  int64_t sumSquares = 0;  // 64-bit — prevents overflow with large offsets
  int  sampleCount   = 0;
  uint32_t startMs   = millis();

  // Sample for one full 50Hz cycle = 20ms (also works for DC loads)
  while (millis() - startMs < 20) {
    int raw    = analogRead(ACS712_PIN);
    int offset = raw - acs712Midpoint;  // Remove DC bias using calibrated zero-point
    sumSquares += (int64_t)offset * offset;
    sampleCount++;
  }

  if (sampleCount == 0) return 0.0f;

  float rmsRaw   = sqrt((float)sumSquares / sampleCount);
  float rmsVolts = (rmsRaw / 4095.0f) * 3.3f;
  float currentA = rmsVolts / ACS712_SENSITIVITY;

  return max(currentA, 0.0f);
}

float readElectricityWatts() {
#if !ACS712_SENSOR_CONNECTED
  // Sensor not physically wired — return 0W.
  return 0.0f;
#else
  // Average 5 burst readings
  float total = 0.0f;
  for (int i = 0; i < 5; i++) {
    total += readCurrentRMS();
    delay(5);
  }
  float rawAmps  = total / 5.0f;
  float rawWatts = rawAmps * MAINS_VOLTAGE;

  // ── DEBUG: always print raw values before any filtering ──
  Serial.printf("   🔬 RAW → Amps: %.3f A  Watts (pre-filter): %.2f W  Midpoint: %d\n",
                rawAmps, rawWatts, acs712Midpoint);

  float watts = rawWatts;

  // Noise floor — zero out tiny jitter
  if (watts < NOISE_FLOOR_WATTS) watts = 0.0f;

  // Safety cap — discard impossibly large readings (ADC runaway)
  if (watts > MAX_ELECTRICITY_WATTS) watts = 0.0f;

  // Moving average for stable display
  elecBuffer[elecBufIdx] = watts;
  elecBufIdx = (elecBufIdx + 1) % ELEC_SAMPLES;
  if (elecBufIdx == 0) elecBufFull = true;

  int   count = elecBufFull ? ELEC_SAMPLES : elecBufIdx;
  float sum   = 0.0f;
  for (int i = 0; i < count; i++) sum += elecBuffer[i];
  return (count > 0) ? (sum / count) : watts;
#endif
}

// ─────────────────────────────────────────────────────────────
//  WATER FLOW READING  (YF-S201)
// ─────────────────────────────────────────────────────────────
float readWaterFlowLpm() {
  unsigned long now     = millis();
  unsigned long elapsed = now - lastFlowCalcTime;

  if (elapsed >= 1000) {
    noInterrupts();
    uint32_t pulses = pulseCount;
    pulseCount = 0;
    interrupts();

    // CHANGE mode counts both edges → divide by 2 × calibration factor
    // FLOW_CALIBRATION = 15.0 (doubled from 7.5) to account for both edges
    float hz  = pulses / (elapsed / 1000.0f);
    float lpm = hz / FLOW_CALIBRATION;

    // 0.3 L/min noise floor — filters stray spikes, passes air-blow readings
    flowRateLpm = (lpm > 0.3f) ? lpm : 0.0f;

    lastFlowCalcTime = now;
  }
  return flowRateLpm;
}

// ─────────────────────────────────────────────────────────────
//  HTTP POST — Send sensor data to backend
// ─────────────────────────────────────────────────────────────
void sendSensorData(float electricity, float water) {
  // Build JSON payload
  StaticJsonDocument<512> doc;
  doc["propertyId"]  = PROPERTY_ID;
  doc["electricity"] = round(electricity * 10) / 10.0;
  doc["water"]       = round(water * 100) / 100.0;

  JsonObject rooms = doc.createNestedObject("rooms");

  // ── Water goes 100% to Living Room for real-time demo ──
  // When you blow air through YF-S201, Living Room FLOW updates live.
  // Electricity is split proportionally across rooms.
  JsonObject livingRoom = rooms.createNestedObject("livingRoom");
  livingRoom["electricity"] = round(electricity * ROOM_LIVING_ELEC * 10) / 10.0;
  livingRoom["water"]       = round(water * 100) / 100.0;  // ← ALL water here

  JsonObject bedroom = rooms.createNestedObject("bedroom");
  bedroom["electricity"] = round(electricity * ROOM_BEDROOM_ELEC * 10) / 10.0;
  bedroom["water"]       = 0;

  JsonObject kitchen = rooms.createNestedObject("kitchen");
  kitchen["electricity"] = round(electricity * ROOM_KITCHEN_ELEC * 10) / 10.0;
  kitchen["water"]       = 0;

  JsonObject bathroom = rooms.createNestedObject("bathroom");
  bathroom["electricity"] = round(electricity * ROOM_BATHROOM_ELEC * 10) / 10.0;
  bathroom["water"]       = 0;

  char payload[512];
  serializeJson(doc, payload, sizeof(payload));

  // POST to backend
  HTTPClient http;
  char url[100];
  snprintf(url, sizeof(url), "http://%s:%d/api/hardware/data", BACKEND_HOST, BACKEND_PORT);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_API_KEY);
  http.setTimeout(8000);

  int httpCode = http.POST(payload);
  String response = http.getString();
  http.end();

  // Log result
  Serial.println("─────────────────────────────────────────");
  Serial.printf("📤 POST → http://%s:%d/api/hardware/data\n", BACKEND_HOST, BACKEND_PORT);
  Serial.printf("   ⚡ Electricity : %.1f W\n", electricity);
  Serial.printf("   💧 Water Flow  : %.2f L/min\n", water);
  Serial.printf("   📶 WiFi Signal : %d dBm\n", WiFi.RSSI());

  if (httpCode == 201) {
    Serial.println("   Status         : ✅ 201 Created — data saved!");
    blinkLed(1, 50);
  } else if (httpCode > 0) {
    Serial.printf("   Status         : ⚠️  HTTP %d\n", httpCode);
    Serial.printf("   Response       : %s\n", response.c_str());
  } else {
    Serial.printf("   Status         : ❌ Connection failed (%d)\n", httpCode);
    Serial.println("   → Check BACKEND_HOST in config.h");
  }
  Serial.println("─────────────────────────────────────────");
}

// ─────────────────────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(300);

  Serial.println();
  Serial.println("╔══════════════════════════════════════════╗");
  Serial.println("║  Smart-I-Sense  ESP32 Firmware v3 (HTTP) ║");
  Serial.println("╚══════════════════════════════════════════╝");
  Serial.printf("   Backend   : http://%s:%d\n", BACKEND_HOST, BACKEND_PORT);
  Serial.printf("   Property  : %s\n\n", PROPERTY_ID);

  // LED
  pinMode(LED_PIN, OUTPUT);
  ledOff();

  // ACS712 ADC setup
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  // NOTE: ACS712 calibration runs AFTER WiFi connects (see below)
  // so that the ADC is in the same RF-noise state as during normal operation.

  // YF-S201 Flow Sensor — GPIO27
  // INPUT_PULLUP: ESP32 internal pull-up keeps pin HIGH if sensor VCC is weak.
  // RISING edge: counts each LOW→HIGH transition (one per rotor magnet pass).
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), onFlowPulse, RISING);
  pulseCount       = 0;
  lastPulseUs      = 0;
  lastFlowCalcTime = millis();

  // Initialize smoothing buffer
  memset(elecBuffer, 0, sizeof(elecBuffer));

  // Connect WiFi
  connectWiFi();

  // ACS712 zero-point calibration — runs HERE (after WiFi) so ADC
  // is in the same RF-noise state as during normal loop() readings.
  // A 5-second countdown lets you disconnect the LED strip/load first.
#if ACS712_SENSOR_CONNECTED
  calibrateACS712();
#endif

  // Verify backend is reachable
  Serial.printf("🔗 Testing backend at %s:%d ...\n", BACKEND_HOST, BACKEND_PORT);
  if (pingBackend()) {
    Serial.println("✅ Backend reachable — ready to send data!\n");
    blinkLed(4, 80);
  } else {
    Serial.println("⚠️  Backend ping failed — will retry on publish\n");
    Serial.println("   Check: Is 'npm run dev' running in the backend folder?");
  }

  Serial.println("✅ Setup complete — entering main loop");
  Serial.println("   💡 Tip: type 'c' + Enter in Serial Monitor to re-calibrate ACS712 anytime.\n");
}

// ─────────────────────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // WiFi watchdog
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi lost — reconnecting...");
    blinkLed(5, 200);
    connectWiFi();
  }

  // ── Serial command handler ──
  // Type 'c' + Enter in Serial Monitor to re-calibrate ACS712 at any time.
  // Useful if you forgot to disconnect the load during the boot countdown.
#if ACS712_SENSOR_CONNECTED
  if (Serial.available()) {
    char cmd = Serial.read();
    while (Serial.available()) Serial.read();  // flush remainder
    if (cmd == 'c' || cmd == 'C') {
      Serial.println("\n🔁 Manual re-calibration triggered...");
      calibrateACS712();
    }
  }
#endif

  // Continuously update water flow (unchanged)
  readWaterFlowLpm();

  // Send data on schedule
  if (now - lastPublishTime >= PUBLISH_INTERVAL_MS) {
    lastPublishTime = now;
    float electricity = readElectricityWatts();
    float water       = flowRateLpm;
    sendSensorData(electricity, water);
  }
}
