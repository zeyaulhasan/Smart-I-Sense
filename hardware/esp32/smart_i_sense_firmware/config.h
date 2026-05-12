/**
 * Smart-I-Sense ESP32 Configuration
 * ───────────────────────────────────
 * Edit ONLY this file before uploading to your ESP32.
 */

#pragma once

// ────────────────────────────────────────────────────────────
//  NETWORK — WiFi
// ────────────────────────────────────────────────────────────
#define WIFI_SSID       "Aashirwad ground"    // 2.4GHz network ONLY (ESP32 can't do 5G)
#define WIFI_PASSWORD   "Rohit@123"

// ────────────────────────────────────────────────────────────
//  BACKEND SERVER — HTTP (replaces MQTT, much more reliable)
// ────────────────────────────────────────────────────────────
// PC's STATIC IP — permanently set to 192.168.1.50
// This never changes anymore. No more rc=-2 / rc=-4 errors!
#define BACKEND_HOST    "192.168.1.50"
#define BACKEND_PORT    5000
#define DEVICE_API_KEY  "smartisense-esp32-secret-2024"  // Must match backend .env

// ────────────────────────────────────────────────────────────
//  PROPERTY IDENTIFICATION
// ────────────────────────────────────────────────────────────
#define PROPERTY_ID     "default"    // Matches your MongoDB user's propertyId

// ────────────────────────────────────────────────────────────
//  PUBLISH RATE
// ────────────────────────────────────────────────────────────
#define PUBLISH_INTERVAL_MS   5000   // Send data every 5 seconds

// ────────────────────────────────────────────────────────────
//  PIN ASSIGNMENTS
// ────────────────────────────────────────────────────────────

// ACS712 Analog Output → ESP32 GPIO34 (ADC1_CH6)
// IMPORTANT: Use ADC1 pins only (32–39). ADC2 is disabled when WiFi is active!
#define ACS712_PIN            34

// ACS712 model sensitivity:
//   ACS712-5A  → 0.185 V/A
//   ACS712-20A → 0.100 V/A
//   ACS712-30A → 0.066 V/A
#define ACS712_SENSITIVITY    0.066f

// YF-S201 Digital Pulse Output → ESP32 GPIO27
#define FLOW_SENSOR_PIN       27

// Built-in LED for status blinks
#define LED_PIN               2

// ────────────────────────────────────────────────────────────
//  SENSOR CONNECTION FLAGS
// ────────────────────────────────────────────────────────────
// ACS712 is physically wired and active — enabled for electricity readings.
#define ACS712_SENSOR_CONNECTED  true

// ────────────────────────────────────────────────────────────
//  ACS712 VCC VOLTAGE — CRITICAL FOR CORRECT MIDPOINT
// ────────────────────────────────────────────────────────────
// The ACS712 output sits at VCC/2 when current = 0A.
// If you power the ACS712 module from ESP32 3.3V pin → use 3.3f
// If you power the ACS712 module from ESP32 5V/VIN pin → use 5.0f
// WRONG value here = always-wrong readings or constant offset!
#define ACS712_VCC_VOLTAGE       3.3f   // ESP32 3.3V pin → midpoint = 1.65V = ADC 2048

// ────────────────────────────────────────────────────────────
//  ELECTRICAL CONSTANTS
// ────────────────────────────────────────────────────────────
// Using 9V DC battery for demo load (LED strip).
// Change back to 230.0f when using AC mains + ACS712 on real load.
#define MAINS_VOLTAGE         9.0f     // 9V DC battery demo
#define NOISE_FLOOR_WATTS     0.8f     // After calibration, jitter is tiny; 0.8W won't filter real LED strip readings
#define MAX_ELECTRICITY_WATTS 50.0f    // 9V × max ~5A = 45W cap for safety

// ────────────────────────────────────────────────────────────
//  WATER FLOW CALIBRATION
// ────────────────────────────────────────────────────────────
#define FLOW_CALIBRATION      7.5f    // YF-S201: 7.5 pulses per L/min (RISING edge only)

// ────────────────────────────────────────────────────────────
//  ROOM DISTRIBUTION RATIOS
// ────────────────────────────────────────────────────────────
#define ROOM_LIVING_ELEC      0.35f
#define ROOM_BEDROOM_ELEC     0.25f
#define ROOM_KITCHEN_ELEC     0.25f
#define ROOM_BATHROOM_ELEC    0.15f

#define ROOM_KITCHEN_WATER    0.70f
#define ROOM_BATHROOM_WATER   0.30f
