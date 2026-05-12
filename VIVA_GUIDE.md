# ============================================================
#   SMART-I-SENSE — COMPLETE VIVA & PRESENTATION GUIDE
#   Read this fully before your viva tomorrow.
# ============================================================

---

## PART 1: WHAT IS THIS PROJECT? (Your Opening Statement)

"Smart-I-Sense is a full-stack IoT-based real-time monitoring system that
tracks electricity and water consumption of a smart home. It collects data
from physical sensors or a software simulator, stores it in a database,
detects anomalies automatically, provides AI-powered usage forecasts, and
displays everything on a live web dashboard — with secure user login,
room-by-room breakdown, and alert notifications."

---

## PART 2: COMPLETE PROJECT FILE MAP
(Where every file is and what it does — for faculty questions)

```
Smart-I-Sense/                          ← ROOT FOLDER
│
├── README.md                           ← Project documentation
├── docker-compose.yml                  ← One-command full-stack deployment
├── .env.example                        ← Template for environment variables
│
├── backend/                            ← NODE.JS SERVER (Port 5000)
│   ├── server.js                       ← ENTRY POINT: Starts Express, Socket.io, MQTT, Simulator
│   ├── .env                            ← Secret config: DB URL, JWT key, Port
│   ├── package.json                    ← Lists all backend dependencies
│   │
│   ├── config/
│   │   └── db.js                       ← Connects to MongoDB using Mongoose
│   │
│   ├── models/                         ← DATABASE SCHEMAS (what data looks like)
│   │   ├── SensorData.js               ← Stores: timestamp, electricity(W), water(L/min), rooms{}
│   │   ├── Alert.js                    ← Stores: type, severity, message, room, resolved(bool)
│   │   ├── User.js                     ← Stores: name, email, hashed-password, role, phone
│   │   └── Config.js                   ← Stores: houseName, rooms[], devices[], thresholds
│   │
│   ├── routes/                         ← API ENDPOINTS (what the frontend calls)
│   │   ├── authRoutes.js               ← POST /auth/login, POST /auth/register, GET /auth/me
│   │   ├── sensorRoutes.js             ← GET /latest, GET /history, POST /sensor-data
│   │   ├── alertRoutes.js              ← GET /alerts, PATCH /alerts/:id/resolve
│   │   ├── predictionRoutes.js         ← GET /predictions, POST /predictions/cost
│   │   └── configRoutes.js             ← GET /config, PATCH /config, POST /config/diagnose
│   │
│   ├── middleware/
│   │   ├── auth.js                     ← Checks JWT token on every protected request
│   │   └── validator.js                ← Validates sensor data before saving
│   │
│   ├── services/                       ← CORE BUSINESS LOGIC
│   │   ├── simulator.js                ← Generates fake sensor data every 5 seconds
│   │   ├── anomalyDetector.js          ← Checks if electricity/water exceeds thresholds → creates Alert
│   │   ├── predictionEngine.js         ← Double Exponential Smoothing forecast algorithm
│   │   ├── mqttService.js              ← MQTT broker (receives data from real ESP32 hardware)
│   │   └── pushService.js              ← Sends push notifications on alerts
│   │
│   ├── utils/
│   │   └── seedData.js                 ← Auto-fills 24 hours of demo data on first run
│   │
│   └── tests/                          ← Jest unit tests for prediction engine & helpers
│
├── frontend/                           ← REACT APP (Port 5173)
│   ├── index.html                      ← HTML shell, loads the React app
│   ├── vite.config.js                  ← Vite build tool config, proxies API to backend
│   │
│   └── src/
│       ├── main.jsx                    ← Wraps app with all Providers (Auth, Socket, Theme)
│       ├── App.jsx                     ← React Router: defines all 7 page routes
│       ├── index.css                   ← Global CSS, design tokens, dark/light theme vars
│       │
│       ├── context/                    ← GLOBAL STATE (shared data across all pages)
│       │   ├── AuthContext.jsx         ← Manages login/logout/token state
│       │   ├── SocketContext.jsx       ← Manages real-time WebSocket connection
│       │   ├── ThemeContext.jsx        ← Manages dark/light mode toggle
│       │   └── UserContext.jsx         ← Stores logged-in user profile data
│       │
│       ├── pages/                      ← 7 PAGES (each is one URL route)
│       │   ├── LandingPage.jsx         ← /login — Login & Register forms
│       │   ├── Dashboard.jsx           ← /  — Main overview (stats, digital twin, live feed)
│       │   ├── ElectricityPage.jsx     ← /electricity — Detailed power charts, room breakdown
│       │   ├── WaterPage.jsx           ← /water — Water flow charts, usage stats
│       │   ├── AnalyticsPage.jsx       ← /analytics — Historical comparison, trends
│       │   ├── PredictionsPage.jsx     ← /predictions — AI forecast charts
│       │   ├── AlertsPage.jsx          ← /alerts — Alert history, resolve alerts
│       │   └── SettingsPage.jsx        ← /settings — Room/device/threshold management
│       │
│       ├── components/                 ← REUSABLE UI PIECES
│       │   ├── layout/
│       │   │   ├── Layout.jsx          ← Wraps every page with Sidebar + Header
│       │   │   ├── Sidebar.jsx         ← Left navigation menu (all 7 page links)
│       │   │   ├── Header.jsx          ← Top bar: connection status, theme, user menu
│       │   │   └── UserProfileModal.jsx← Edit profile popup
│       │   │
│       │   ├── dashboard/
│       │   │   ├── StatsCards.jsx      ← KPI cards: current watts, water, alerts count
│       │   │   ├── DigitalTwin.jsx     ← Interactive house floor-plan with room statuses
│       │   │   ├── LiveFeed.jsx        ← Scrolling real-time log of system events
│       │   │   ├── HeroPanel.jsx       ← Top summary panel on dashboard
│       │   │   ├── RoomCard.jsx        ← Single room status card
│       │   │   ├── RoomDetailPanel.jsx ← Side panel showing room details
│       │   │   └── RoomDetailModal.jsx ← Popup with full room sensor history
│       │   │
│       │   ├── charts/                 ← Chart components (using Recharts library)
│       │   ├── alerts/                 ← Alert panel, alert list items
│       │   ├── ai/                     ← AI Insights panel component
│       │   ├── auth/
│       │   │   └── ProtectedRoute.jsx  ← Redirects to /login if user not logged in
│       │   ├── settings/               ← Room manager, device manager components
│       │   └── ui/                     ← Toast notifications, Skeleton loaders, Error boundary
│       │
│       └── utils/
│           └── api.js                  ← Axios client: auto-attaches JWT to every API call
│
└── hardware/
    └── esp32/
        └── smart_i_sense_firmware/
            └── smart_i_sense_firmware.ino  ← Arduino C++ code for real ESP32 hardware
```

---

## PART 3: HOW THE WHOLE SYSTEM WORKS (Flow Explanation)

### Step 1 — Data Collection
- The **Simulator** (`services/simulator.js`) generates realistic sensor data every **5 seconds**
- It uses time-of-day logic: morning = high water, evening = high electricity (peak hours)
- It has a **3% chance** of generating a spike (anomaly) to test the alert system
- If real **ESP32 hardware** is connected, data comes via **MQTT** on port 1883 instead

### Step 2 — Data Storage
- Data is saved to **MongoDB** in the `sensordatas` collection
- Each document has: timestamp, total electricity (Watts), total water (L/min), and a breakdown per room (living room, bedroom, kitchen, bathroom)

### Step 3 — Real-Time Push to Frontend
- After saving, the server uses **Socket.io** (WebSocket) to instantly push the data to ALL connected browsers
- No page refresh needed — data appears live on the dashboard every 5 seconds

### Step 4 — Anomaly Detection
- EVERY new data point is passed through `anomalyDetector.js`
- If electricity is **1.5× higher** than the rolling average of last 10 readings → **Warning Alert**
- If electricity is **2× higher** → **Critical Alert**
- If per-room water exceeds its configured threshold → **Water Leak Alert**
- Alerts are saved to MongoDB AND pushed instantly to the frontend via WebSocket
- A **5-minute cooldown** prevents alert spam

### Step 5 — Prediction Engine
- When user opens Predictions page, frontend calls `GET /api/predictions`
- The engine fetches last 60 sensor readings from MongoDB
- Applies **Double Exponential Smoothing** (Holt's Method):
  - `alpha = 0.85` (high weight on recent data)
  - `beta = 0.3` (trend tracking)
- Generates 6 future data points (30 seconds ahead)
- Returns actual data + predicted data + AI suggestions

### Step 6 — Authentication
- User registers → password is **bcrypt hashed** (12 salt rounds) and stored
- User logs in → server verifies password, generates a **JWT token** (7 days valid)
- Token is stored in browser **localStorage**
- Every API call from frontend includes `Authorization: Bearer <token>` header
- `auth.js` middleware verifies the token before allowing any protected route

---

## PART 4: TECHNOLOGY STACK EXPLANATION

| Layer | Technology | Why We Used It |
|-------|-----------|---------------|
| Frontend UI | React 19 | Component-based, fast, industry standard |
| Frontend Build | Vite | Much faster than Create React App |
| Styling | Tailwind CSS v4 + Custom CSS | Rapid development, consistent design |
| Charts | Recharts | Easy React-compatible charting library |
| Animations | Framer Motion | Smooth, professional micro-animations |
| Real-time | Socket.io | Easiest WebSocket library for Node.js + React |
| HTTP Calls | Axios | Supports interceptors for auto-attaching JWT |
| Backend | Node.js + Express | JavaScript everywhere (same language as frontend) |
| Database | MongoDB + Mongoose | Flexible schema, perfect for time-series IoT data |
| Authentication | JWT (jsonwebtoken) | Stateless, scalable, industry standard |
| Password Security | bcryptjs | Irreversible hashing, salt protection |
| Input Validation | express-validator | Prevents bad/malicious data from entering DB |
| MQTT Broker | Aedes (embedded) | No separate broker server needed |
| Hardware | ESP32 + Arduino | Cheap, WiFi-enabled microcontroller |
| Current Sensor | ACS712-30A | Hall-effect sensor, measures AC current |
| Flow Sensor | YF-S201 | Pulse-based water flow measurement |
| Containers | Docker + Docker Compose | Easy deployment, consistent environment |
| Testing | Jest + Supertest | Unit testing for backend logic |

---

## PART 5: DATABASE SCHEMAS (For Faculty Questions)

### Collection: `users`
```
name        → String (2-50 chars)
email       → String (unique, lowercase)
password    → String (bcrypt hash — NEVER stored as plain text)
role        → "admin" or "viewer"
facility    → String (building name)
phone       → String
pushToken   → String (for mobile notifications)
createdAt   → Date
```

### Collection: `sensordatas`
```
propertyId  → String (which house/property)
timestamp   → Date (when reading was taken)
electricity → Number (total Watts for whole house)
water       → Number (total Litres/minute)
rooms: {
  livingRoom:  { electricity: Number, water: Number }
  bedroom:     { electricity: Number, water: Number }
  kitchen:     { electricity: Number, water: Number }
  bathroom:    { electricity: Number, water: Number }
}
```

### Collection: `alerts`
```
propertyId  → String
timestamp   → Date
type        → "electricity" or "water"
severity    → "info", "warning", or "critical"
message     → String (human-readable description)
room        → String (which room triggered it)
value       → Number (the actual sensor reading)
threshold   → Number (the limit that was breached)
resolved    → Boolean (true = acknowledged by user)
```

### Collection: `configs`
```
propertyId    → String (unique per house)
houseName     → String
rooms: [{
  id            → String (e.g., "living_room")
  label         → String (e.g., "Living Room")
  elecThreshold → Number (Watts — triggers alert if exceeded)
  waterThreshold→ Number (L/min — triggers alert if exceeded)
  devices: [{
    name         → String (e.g., "Air Conditioner")
    nominalPower → Number (Watts)
    isActive     → Boolean
  }]
}]
```

---

## PART 6: ALL API ENDPOINTS

### Public (No login needed)
```
POST   /api/auth/register     → Create new account
POST   /api/auth/login        → Login, get JWT token
```

### Protected (Need JWT token in header)
```
GET    /api/auth/me           → Get my profile
PATCH  /api/auth/profile      → Update name/phone/facility

GET    /api/latest            → Latest sensor reading (right now)
POST   /api/sensor-data       → Submit new sensor reading (used by ESP32)
GET    /api/history?range=1h  → Historical data (1h / 24h / 7d / 30d)
GET    /api/history/compare   → Compare current vs previous period

GET    /api/predictions       → AI forecast for next 30 seconds
POST   /api/predictions/cost  → Calculate projected electricity bill

GET    /api/alerts            → Get alert history (filter by type/resolved)
PATCH  /api/alerts/:id/resolve → Mark alert as fixed

GET    /api/config            → Get room/device configuration
PATCH  /api/config            → Update rooms, devices, thresholds
POST   /api/config/diagnose   → Re-run anomaly check on latest data

GET    /api/health            → Server health check
```

### WebSocket Events (Real-time, no polling)
```
sensor-data    → New reading pushed to all browsers every 5s
alert          → New alert pushed instantly when anomaly detected
alert-resolved → Alert resolved notification pushed to all browsers
live-feed      → Activity log messages (data, warnings, system info)
```

---

## PART 7: ESP32 HARDWARE EXPLANATION

**Sensors Used:**
1. **ACS712-30A** — Current Sensor (Pin 34)
   - Hall-effect sensor placed around live wire
   - Samples for 20ms (one 50Hz AC cycle) to calculate RMS current
   - Formula: Power (W) = Current (A) × 230V (Indian standard)
   - Below 15W is treated as noise (filtered out)

2. **YF-S201** — Water Flow Sensor (Pin 27)
   - Generates pulses as water flows through it
   - Uses hardware interrupt to count pulses accurately
   - Formula: Flow Rate (L/min) = Pulse Frequency (Hz) / 7.5

**Communication Flow:**
```
ESP32 reads sensors
   → Every 5 seconds, builds JSON payload
   → Publishes to MQTT topic: "smartisense/property_01/sensors"
   → Backend MQTT broker (Aedes) receives it
   → Saves to MongoDB
   → Pushes to frontend via Socket.io
```

---

## PART 8: WHAT TO SAY — FULL VERBAL EXPLANATION

"Good morning/afternoon. Our project is called Smart-I-Sense. It is a real-time
IoT monitoring system for smart homes that tracks electricity and water usage.

The system has three main parts:

FIRST — The Hardware Layer. We have written firmware for an ESP32 microcontroller
in Arduino C++. It connects to a current sensor (ACS712) to measure electricity
and a flow sensor (YF-S201) to measure water. It sends this data every 5 seconds
using the MQTT protocol over WiFi to our backend server.

SECOND — The Backend Server. We built this using Node.js and Express. It runs
on port 5000 and does multiple things:
- It receives sensor data, validates it, and saves it to MongoDB database
- It checks every new reading for anomalies — if electricity suddenly spikes
  to 1.5 times the average, it creates an alert automatically
- It runs a prediction algorithm using Double Exponential Smoothing to forecast
  future usage
- It uses JWT tokens and bcrypt password hashing to secure the system
- It uses Socket.io WebSockets to push live data to the frontend instantly

THIRD — The Frontend Dashboard. We built this using React 19 with Vite. It has
7 pages: Dashboard, Electricity, Water, Analytics, Predictions, Alerts, and
Settings. The dashboard shows live stats, an interactive digital twin floor plan
of the house, room-by-room data, real-time charts, and a live activity feed.
The system supports dark and light mode, and is fully responsive.

Since we do not always have the physical hardware available, we built a software
simulator that generates realistic sensor data based on time-of-day patterns —
for example, electricity peaks in the evening from 5 to 8 PM, which matches
real household behavior.

The entire system can be deployed using Docker with one command."

---

## PART 9: COMMON VIVA QUESTIONS & ANSWERS

**Q: Why did you use MongoDB instead of MySQL?**
A: "IoT sensor data is time-series in nature and does not have a rigid relational
structure. MongoDB's document model is flexible — we can add room fields without
changing a schema. It also handles high-frequency writes better for real-time data.
For an IoT system generating data every 5 seconds, a NoSQL database is more
appropriate."

**Q: How is the password stored?**
A: "Passwords are NEVER stored as plain text. We use bcryptjs with a salt round
of 12. This means even if someone steals the database, the passwords are
mathematically irreversible. When a user logs in, bcrypt compares the entered
password against the stored hash."

**Q: What is JWT and why did you use it?**
A: "JWT stands for JSON Web Token. After login, the server generates a token
containing the user's ID, signed with a secret key. The frontend stores this token
and sends it in the Authorization header with every API request. The server verifies
the signature — if valid, the user is allowed access. This is stateless, meaning
the server does not need to store session data."

**Q: What is Socket.io and why is it better than REST API for this?**
A: "Socket.io is a WebSocket library. With REST API, the frontend would need to
poll the server every few seconds asking 'any new data?' — this wastes resources.
With Socket.io, the server PUSHES data to the frontend the moment it's available.
This gives us true real-time updates with zero delay."

**Q: What is MQTT?**
A: "MQTT is a lightweight publish-subscribe messaging protocol designed for IoT
devices. The ESP32 PUBLISHES sensor data to a topic. The backend SUBSCRIBES to that
topic and receives the data. It is much lighter than HTTP, which matters for
low-power microcontrollers."

**Q: How does your anomaly detection work?**
A: "For every new sensor reading, we calculate the rolling average of the last 10
readings. If the new reading is more than 1.5 times that average, we flag it as a
warning. If it is more than 2 times the average, it is critical. For water, we
compare against a user-configured threshold per room. A 5-minute cooldown prevents
duplicate alerts for the same sustained anomaly."

**Q: What is a Digital Twin?**
A: "A Digital Twin is a virtual representation of a physical object. In our case,
it is an interactive floor plan of the house shown on the dashboard. Each room
shows real-time electricity and water values from the sensor data. If a room has
high usage, it lights up in orange or red. This gives a visual, at-a-glance
understanding of the entire house's status."

**Q: What is Docker and why did you use it?**
A: "Docker packages the application and all its dependencies into a container — an
isolated box that runs identically on any machine. We have a docker-compose.yml that
starts MongoDB, the backend, and the frontend with one command. This solves the
classic problem of 'it works on my machine but not yours.'"

**Q: How does your prediction work?**
A: "We use Double Exponential Smoothing, also known as Holt's Method. It is a
time-series forecasting technique that tracks both the current level and the trend
of the data. Alpha (0.85) controls how quickly the model reacts to new data.
Beta (0.3) controls trend sensitivity. Based on the last 60 readings, it predicts
the next 6 readings — approximately 30 seconds into the future. This is a
statistically valid method used in production IoT systems."

**Q: What testing did you do?**
A: "We wrote unit tests using Jest and Supertest for the backend. These test the
prediction engine calculations, the sensor data validation, and the API routes.
Tests can be run with 'npm test' from the backend directory."

**Q: What is the difference between your simulator and real hardware?**
A: "The simulator generates data programmatically using time-of-day base values
plus random noise. The real ESP32 hardware collects actual electrical current using
an ACS712 Hall-effect sensor and actual water flow using a YF-S201 pulse sensor.
Both feed data through the same pipeline — MQTT → MongoDB → WebSocket → Dashboard.
The system is designed to work with either source transparently."

**Q: What are the roles in your user system?**
A: "There are two roles — 'admin' and 'viewer'. Admin users can change settings,
update thresholds, add/remove devices, and manage rooms. Viewer users can only
view data. This multi-role system is designed for scenarios where multiple people
in a household have the app."

**Q: How does room-level monitoring work?**
A: "When the simulator generates data, it reads the device list from the Config
collection in MongoDB. Each device has a nominal power rating (e.g., AC = 1500W).
The electricity is distributed to rooms proportionally based on device power.
For water, we use fixed ratios (bathroom 55%, kitchen 35%, etc.). This means if
you turn off the AC in the config, the living room's electricity share drops."

---

## PART 10: QUICK FILE LOCATION CHEATSHEET
(If faculty says "show me the file where X happens")

| Faculty asks about...          | Show this file |
|-------------------------------|----------------|
| Login / Registration logic    | backend/routes/authRoutes.js |
| Password hashing              | backend/models/User.js (line 55-58) |
| JWT verification              | backend/middleware/auth.js |
| Saving sensor data to DB      | backend/routes/sensorRoutes.js |
| Anomaly detection logic       | backend/services/anomalyDetector.js |
| Prediction algorithm          | backend/services/predictionEngine.js |
| Real-time WebSocket server    | backend/server.js (line 21-26, 56-62) |
| MQTT broker & hardware bridge | backend/services/mqttService.js |
| Data simulation               | backend/services/simulator.js |
| Database schemas / models     | backend/models/ (all 4 files) |
| ESP32 firmware / hardware     | hardware/esp32/.../smart_i_sense_firmware.ino |
| React routing (7 pages)       | frontend/src/App.jsx |
| Login page (UI)               | frontend/src/pages/LandingPage.jsx |
| Dashboard page (UI)           | frontend/src/pages/Dashboard.jsx |
| Real-time socket in frontend  | frontend/src/context/SocketContext.jsx |
| Authentication state (React)  | frontend/src/context/AuthContext.jsx |
| Sidebar navigation            | frontend/src/components/layout/Sidebar.jsx |
| Digital twin floor plan       | frontend/src/components/dashboard/DigitalTwin.jsx |
| Live activity feed            | frontend/src/components/dashboard/LiveFeed.jsx |
| All API endpoints (reference) | README.md (line 213 onwards) |
| Docker deployment             | docker-compose.yml |
| Environment variables         | backend/.env |

---

## PART 11: IF FACULTY ASKS TO MAKE LIVE CHANGES

**"Add a new field to the sensor data"**
→ Go to: backend/models/SensorData.js
→ Add a new field like: `temperature: { type: Number, default: 0 }`
→ Then update simulator.js to generate temperature values

**"Add a new API endpoint"**
→ Go to relevant file in backend/routes/
→ Add: router.get('/new-endpoint', async (req, res) => { ... })
→ Make sure it's registered in server.js

**"Add a new page to the frontend"**
→ Create file in frontend/src/pages/NewPage.jsx
→ Add the route in frontend/src/App.jsx
→ Add a link in frontend/src/components/layout/Sidebar.jsx

**"Change the alert threshold"**
→ Go to: backend/services/anomalyDetector.js
→ Line 6: Change ELECTRICITY_SPIKE_MULTIPLIER = 1.5 to any value

**"Add a new room"**
→ Settings page in the running app → Add Room button
→ OR go to backend/utils/seedData.js and add to the rooms array

---

## PART 12: PROJECT STRENGTHS TO HIGHLIGHT

1. REAL-TIME — Data updates every 5 seconds without refreshing the page
2. SECURE — JWT auth + bcrypt hashing, no plain-text passwords anywhere
3. SCALABLE — propertyId field allows monitoring multiple houses (SaaS-ready)
4. HARDWARE-READY — Real ESP32 firmware written and ready to flash
5. CONTAINERIZED — Full Docker deployment, runs on any machine
6. TESTED — Jest unit tests written for core backend logic
7. ACCESSIBLE — ARIA labels, keyboard navigation, skip links included
8. FULL STACK — Hardware → Backend → Database → Frontend — complete system

---

*DELETE THIS FILE AFTER YOUR VIVA*
*Good luck tomorrow! You've built a genuinely impressive system.*
