import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  query,
  limitToLast,
  get
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const db = window.firebase.db;
const { ref: dbRef, set: dbSet, onValue: dbOnValue, push: dbPush, get: dbGet } = window.firebase;

let selectedVehicle = null;

// Admin Auth
window.authenticate = function () {
  const user = document.getElementById('loginUser').value;
  const pass = document.getElementById('loginPass').value;
  if (user === 'admin' && pass === 'admin123') {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadVehicleOptions();
  } else {
    alert('Invalid Credentials');
  }
};

// Register Vehicle
document.getElementById('vehicleForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const vehicle = document.getElementById('vehicleNumber').value.trim();
  const numbers = document.getElementById('phoneNumbers').value
    .split(',')
    .map(n => n.trim());

  dbSet(dbRef(db, `vehicles/${vehicle}/numbers`), numbers)
    .then(() => {
      alert(`${vehicle} registered`);
      loadVehicleOptions();
    })
    .catch(err => alert('Error: ' + err.message));
});

// Load Vehicle Options
function loadVehicleOptions() {
  const selector = document.getElementById('vehicleSelector');
  dbOnValue(dbRef(db, 'vehicles'), snapshot => {
    const data = snapshot.val();
    selector.innerHTML = '';
    if (data) {
      Object.keys(data).forEach(vehicle => {
        if (vehicle !== 'selected_vehicle') {
          const opt = document.createElement('option');
          opt.value = vehicle;
          opt.textContent = vehicle;
          selector.appendChild(opt);
        }
      });
      selectedVehicle = selector.value;
      loadCrashLogs(selectedVehicle);
    }
  });
}

// Vehicle Change
document.getElementById('vehicleSelector').addEventListener('change', function () {
  selectedVehicle = this.value;
  loadCrashLogs(selectedVehicle);
});

// Set active vehicle in Firebase
document.getElementById('setActiveBtn').addEventListener('click', () => {
  if (!selectedVehicle) return alert("No vehicle selected");
  dbSet(dbRef(db, 'selected_vehicle'), selectedVehicle)
    .then(() => alert(`${selectedVehicle} is now the active vehicle`))
    .catch(err => alert('Error setting active vehicle: ' + err.message));
});

// Crash Logs
function loadCrashLogs(vehicle) {
  const logsRef = query(dbRef(db, `vehicles/${vehicle}/logs`), limitToLast(10));
  dbOnValue(logsRef, snapshot => {
    const logs = snapshot.val();
    const logList = document.getElementById('crashLogs');
    logList.innerHTML = '';
    if (logs) {
      Object.entries(logs).reverse().forEach(([_, data]) => {
        const li = document.createElement('li');
        li.innerText = `${new Date(data.timestamp * 1000).toLocaleString()} — ${data.event} at (${data.lat}, ${data.lon})`;
        logList.appendChild(li);
        updateMap(data.lat, data.lon);
      });
    } else {
      logList.innerHTML = '<li>No crash logs yet.</li>';
    }
  });
}

// Map Setup
let map = L.map('map').setView([20.5937, 78.9629], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let marker;

function updateMap(lat, lon) {
  if (!lat || !lon) return;
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lon]).addTo(map);
  map.setView([lat, lon], 14);
}
