# Smart Home Automation System (Gesture & Web Controlled)

A complete smart home automation solution for Raspberry Pi 5, featuring:
- **Hand gesture control** for 4 colored LEDs and a DC motor fan
- **Real-time web interface** (React + Vite + Firebase)
- **Live sensor monitoring** (Temperature, Humidity, LDR)
- **Bidirectional sync** between hardware and web
- **Robust backend** (Node.js, Express, WebSocket, Firebase Admin)

---

## Features

- **Gesture Control:**
  - Fist gesture activates a 5-second detection window
  - 1-4 fingers toggle respective LEDs (Green, Yellow, Orange, Red)
  - Last 3 fingers (middle, ring, pinky) toggle the fan (25% duty cycle)
  - 2-second cooldown after each action
  - Blue LED (GPIO 16) indicates hand detection (solid = detected, blinking = not detected)

- **Web Interface:**
  - Control all LEDs and fan from any device
  - See real-time sensor data (temperature, humidity, LDR)
  - UI colors match physical LED colors
  - State always in sync with hardware

- **Sensors & Automation:**
  - DHT11 for temperature & humidity
  - LDR for light detection
  - Automatic fan activation if temperature > 35°C or humidity > 70%
---

## Project Structure

```
Smart-Home-Automation/
├── backend/           # Node.js/Express/WebSocket server
│   ├── server.js
│   ├── firebase_credentials.json
│   └── ...
├── public/            # Static assets
├── src/               # React frontend
│   ├── App.jsx
│   ├── App.css
│   └── ...
├── all1.py            # Main Raspberry Pi gesture/sensor/motor code
├── requirements.txt   # Python dependencies
└── ...
```

---

## Setup & Usage

### 1. Hardware
- Raspberry Pi 5
- 4x LEDs (Green, Yellow, Orange, Red) + resistors
- 1x Blue LED (hand detection)
- 1x DC motor + driver
- DHT11 sensor
- LDR sensor
- Camera (for gesture detection)

### 2. Software

#### Backend (Node.js)
```sh
cd Smart-Home-Automation/backend
npm install
node server.js
```

#### Frontend (React + Vite)
```sh
cd Smart-Home-Automation
npm install
npm run dev
```

#### Raspberry Pi (Python)
```sh
pip install -r requirements.txt
python all1.py
```

- Place your Firebase credentials in `backend/firebase_credentials.json` and set `FIREBASE_DATABASE_URL` in `.env`.

---

## Firebase Database Structure

```
home: {
  controls: {
    fan: false,
    leds: [null, false, false, false, false]
  },
  fan: false,
  leds: [null, false, false, false, false],
  sensors: {
    temperature: 0,
    humidity: 0,
    ldr: false
  }
}
```
```
---

## Screenshots

<!-- > ![Web UI Example](./public/vite.svg) -->
---
## Collaboration
```
---

## License
MIT
