import { useState, useEffect, useMemo } from 'react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue } from 'firebase/database'
import { FaLightbulb, FaFan, FaUser, FaSignOutAlt, FaChartLine, FaMicrochip, FaLightbulb as FaLightbulbOutline } from 'react-icons/fa'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuJGSjLcZ7WClsVTNcp0N3NbX0xcJQa5U",
  authDomain: "smart-home-d4c97.firebaseapp.com",
  databaseURL: "https://smart-home-d4c97-default-rtdb.asia-southeast1.firebaseapp.com",
  projectId: "smart-home-d4c97",
  storageBucket: "smart-home-d4c97.firebasestorage.app",
  messagingSenderId: "701811414672",
  appId: "1:701811414672:web:2bccfcf84cc34a12cc6a15"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

const MAX_DATA_POINTS = 10

function App() {
  const [activeTab, setActiveTab] = useState('sensors')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' })
  const [sensorHistory, setSensorHistory] = useState({
    temperature: [],
    humidity: [],
    timestamps: []
  })
  
  const [homeState, setHomeState] = useState({
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
  })

  // Authentication handler
  const handleLogin = (e) => {
    e.preventDefault()
    if (loginCredentials.username === 'admin' && loginCredentials.password === '1234') {
      setIsAuthenticated(true)
      setShowLoginModal(false)
      localStorage.setItem('isAuthenticated', 'true')
    } else {
      alert('Invalid credentials. Please try again.')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('isAuthenticated')
  }

  // Effect for authentication persistence
  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated')
    if (auth) {
      setIsAuthenticated(true)
    }
  }, [])

  // WebSocket and Firebase data handling
  useEffect(() => {
    let ws
    let reconnectTimeout
    let isConnected = false

    const connectWebSocket = () => {
      if (isConnected) return
      
      ws = new WebSocket('ws://localhost:5000')
      
      ws.onopen = () => {
        console.log('Connected to WebSocket')
        isConnected = true
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data) {
            setHomeState(data)
            // Update sensor history
            setSensorHistory(prev => {
              const newTimestamp = new Date().toLocaleTimeString()
              return {
                temperature: [...prev.temperature, data.sensors.temperature].slice(-MAX_DATA_POINTS),
                humidity: [...prev.humidity, data.sensors.humidity].slice(-MAX_DATA_POINTS),
                timestamps: [...prev.timestamps, newTimestamp].slice(-MAX_DATA_POINTS)
              }
            })
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        isConnected = false
      }
      
      ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...')
        isConnected = false
        reconnectTimeout = setTimeout(connectWebSocket, 3000)
      }
    }

    connectWebSocket()
    
    return () => {
      isConnected = false
      if (ws) {
        ws.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [])

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 10
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 10
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 25, 40, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'normal'
        },
        bodyFont: {
          size: 13
        },
        displayColors: false
      }
    }
  }

  const temperatureData = {
    labels: sensorHistory.timestamps,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: sensorHistory.temperature,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const humidityData = {
    labels: sensorHistory.timestamps,
    datasets: [
      {
        label: 'Humidity (%)',
        data: sensorHistory.humidity,
        borderColor: 'rgba(53, 162, 235, 1)',
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-800/70 backdrop-blur-md border-b border-gray-700 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-cyan-400">SmartNest</h1>
            </div>

            <div className="flex items-center">
              {/* Clock and Location */}
              <div className="hidden md:block mr-8">
                <div className="text-right">
                  <div className="text-cyan-400 font-mono">
                    {new Date().toLocaleTimeString()}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Bengaluru, IN
                  </div>
                </div>
              </div>

              {/* User Profile */}
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors duration-200"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors duration-200"
                >
                  <FaUser />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-8 space-y-12">
        {/* Sensor Data Section */}
        <section>
          <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Sensor Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Temperature Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700 hover:border-cyan-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-cyan-400">Temperature</h3>
                <motion.span
                  key={homeState.sensors.temperature}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-mono text-white"
                >
                  {homeState.sensors.temperature?.toFixed(1)}°C
                </motion.span>
              </div>
              <div className="mt-2 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
            </div>

            {/* Humidity Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700 hover:border-cyan-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-cyan-400">Humidity</h3>
                <motion.span
                  key={homeState.sensors.humidity}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-mono text-white"
                >
                  {homeState.sensors.humidity?.toFixed(1)}%
                </motion.span>
              </div>
              <div className="mt-2 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
            </div>

            {/* Light Sensor Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700 hover:border-cyan-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-cyan-400">Room Light</h3>
                <motion.span
                  key={homeState.sensors.ldr}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-mono text-white"
                >
                  {homeState.sensors.ldr ? 'Dark' : 'Bright'}
                </motion.span>
              </div>
              <div className="mt-2 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        <section>
          <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Temperature Chart */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-cyan-400 mb-4">Temperature History</h3>
              <div className="h-[300px]">
                <Line options={chartOptions} data={temperatureData} />
              </div>
            </div>

            {/* Humidity Chart */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-cyan-400 mb-4">Humidity History</h3>
              <div className="h-[300px]">
                <Line options={chartOptions} data={humidityData} />
              </div>
            </div>
          </div>
        </section>

        {/* Devices Section */}
        <section>
          <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Devices</h2>
          <div className="space-y-6">
            {/* LED Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((index) => {
                const colors = {
                  1: { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500' },
                  2: { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500' },
                  3: { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500' },
                  4: { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500' }
                }
                const isOn = homeState.leds?.[index] || homeState.controls?.leds?.[index]

                return (
                  <motion.div
                    key={`led-${index}`}
                    className={`p-6 rounded-xl flex flex-col items-center gap-3 transition-all duration-300
                      ${isOn ? `${colors[index].bg} border-2 ${colors[index].border} shadow-lg` : 'bg-gray-700/50 border border-gray-600'}
                    `}
                  >
                    <FaLightbulb className={`text-2xl ${isOn ? colors[index].text : 'text-gray-400'}`} />
                    <span className="text-sm">{['Green', 'Yellow', 'Orange', 'Red'][index - 1]} LED</span>
                  </motion.div>
                )
              })}
            </div>

            {/* Fan Status */}
            <motion.div
              className={`p-6 rounded-xl flex items-center justify-center gap-4 transition-all duration-300
                ${(homeState.fan || homeState.controls?.fan)
                  ? 'bg-cyan-500/20 border-2 border-cyan-500 shadow-lg'
                  : 'bg-gray-700/50 border border-gray-600'}
              `}
            >
              <FaFan className={`text-3xl ${(homeState.fan || homeState.controls?.fan) ? 'text-cyan-400 animate-spin' : 'text-gray-400'}`} />
              <span className="text-lg">Fan {(homeState.fan || homeState.controls?.fan) ? 'ON' : 'OFF'}</span>
            </motion.div>
          </div>
        </section>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 w-full max-w-md"
            >
              <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Login</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Username</label>
                  <input
                    type="text"
                    value={loginCredentials.username}
                    onChange={(e) => setLoginCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Password</label>
                  <input
                    type="password"
                    value={loginCredentials.password}
                    onChange={(e) => setLoginCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition-colors duration-200"
                  >
                    Login
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
