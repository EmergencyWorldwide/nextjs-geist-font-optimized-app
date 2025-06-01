// Game state
let gameState = {
    budget: 1000000,
    buildings: [],
    vehicles: []
};

// Building types and costs
const buildingTypes = {
    police: {
        name: 'Police Station',
        price: 250000,
        vehicles: [
            { type: 'Police Car', price: 50000, speed: 120 },
            { type: 'SWAT Van', price: 100000, speed: 90 }
        ]
    },
    fire: {
        name: 'Fire Station',
        price: 300000,
        vehicles: [
            { type: 'Fire Truck', price: 75000, speed: 80 },
            { type: 'Ladder Truck', price: 120000, speed: 70 }
        ]
    },
    hospital: {
        name: 'Hospital',
        price: 400000,
        vehicles: [
            { type: 'Ambulance', price: 60000, speed: 100 },
            { type: 'Medical Helicopter', price: 200000, speed: 250 }
        ]
    }
};

// Initialize map
const map = L.map('map').setView([40.7128, -74.0060], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Initialize game
function initGame() {
    loadGameState();
    updateBudgetDisplay();
    setupEventListeners();
}

// Load game state from localStorage
function loadGameState() {
    const savedState = localStorage.getItem('911SimulatorState');
    if (savedState) {
        gameState = JSON.parse(savedState);
        updateBudgetDisplay();
        // Restore buildings and vehicles on the map
        gameState.buildings.forEach(building => {
            addBuildingToMap(building.type, building.position);
        });
    }
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('911SimulatorState', JSON.stringify(gameState));
}

// Update budget display
function updateBudgetDisplay() {
    document.getElementById('budget').textContent = gameState.budget.toLocaleString();
}

// Setup event listeners
function setupEventListeners() {
    // Building selection
    document.querySelectorAll('.building-item').forEach(item => {
        item.addEventListener('click', () => {
            const buildingType = item.dataset.type;
            const price = parseInt(item.dataset.price);
            
            if (gameState.budget >= price) {
                enableBuildingPlacement(buildingType, price);
            } else {
                alert('Insufficient funds to purchase this building!');
            }
        });
    });

    // Modal close button
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('buildingModal').style.display = 'none';
    });

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('buildingModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Enable building placement mode
function enableBuildingPlacement(buildingType, price) {
    const placementHandler = (e) => {
        const position = e.latlng;
        
        // Place building
        addBuildingToMap(buildingType, position);
        
        // Update game state
        gameState.budget -= price;
        gameState.buildings.push({
            type: buildingType,
            position: position,
            vehicles: []
        });
        
        // Update UI
        updateBudgetDisplay();
        saveGameState();
        
        // Remove click handler
        map.off('click', placementHandler);
    };
    
    map.once('click', placementHandler);
}

// Add building to map
function addBuildingToMap(type, position) {
    const building = buildingTypes[type];
    const buildingEmojis = {
        police: '🚓',
        fire: '🚒',
        hospital: '🏥'
    };

    const marker = L.marker(position, {
        icon: L.divIcon({
            className: 'building-marker',
            html: `<span style="font-size: 2em">${buildingEmojis[type]}</span>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })
    }).addTo(map);

    // Add click handler to open building modal
    marker.on('click', () => openBuildingModal(type, position));
}

// Open building modal
function openBuildingModal(type, position) {
    const building = buildingTypes[type];
    const modal = document.getElementById('buildingModal');
    const title = document.getElementById('modalTitle');
    const vehicleOptions = document.querySelector('.vehicle-options');
    
    title.textContent = building.name;
    vehicleOptions.innerHTML = '';
    
    // Add vehicle purchase options
    building.vehicles.forEach(vehicle => {
        const vehicleOption = document.createElement('div');
        vehicleOption.className = 'vehicle-option';
        vehicleOption.innerHTML = `
            <h4>${vehicle.type}</h4>
            <div class="vehicle-details">
                <p class="price">💰 $${vehicle.price.toLocaleString()}</p>
                <p class="speed">⚡ ${vehicle.speed} km/h</p>
            </div>
            <button class="purchase-btn">Purchase Vehicle</button>
        `;
        
        vehicleOptions.appendChild(vehicleOption);
        
        // Add click handler to the purchase button
        const purchaseBtn = vehicleOption.querySelector('.purchase-btn');
        purchaseBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent modal from closing
            purchaseVehicle(type, position, vehicle);
        });
    });
    
    modal.style.display = 'block';
}

// Purchase vehicle
function purchaseVehicle(buildingType, buildingPosition, vehicle) {
    if (gameState.budget >= vehicle.price) {
        // Update game state
        gameState.budget -= vehicle.price;
        gameState.vehicles.push({
            type: vehicle.type,
            buildingType: buildingType,
            position: buildingPosition,
            status: 'ready'
        });
        
        // Update UI
        updateBudgetDisplay();
        saveGameState();
        
        // Show success message
        alert(`Successfully purchased ${vehicle.type}!`);
    } else {
        alert('Insufficient funds to purchase this vehicle!');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
