// API Configuration
const API_URL = 'http://localhost:5001/api';
let currentToken = null;
let currentVehicle = null;

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('active');
    }
}

// Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_URL}/Auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Username: username, Password: password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Credenciais inválidas');
        }

        const data = await response.json();
        currentToken = data.token;
        
        // Store token
        localStorage.setItem('token', currentToken);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Show check-in screen
        showScreen('checkin-screen');
    } catch (error) {
        errorElement.textContent = error.message;
        errorElement.classList.add('show');
    }
});

// Check-in Form
document.getElementById('checkin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const plate = document.getElementById('plate').value.toUpperCase();
    const mileage = document.getElementById('mileage').value;
    const fuelLevel = document.getElementById('fuel-level').value;
    const observations = document.getElementById('observations').value;

    try {
        // First, find or create customer
        const customerResponse = await fetch(`${API_URL}/Customers?search=${plate}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (!customerResponse.ok) throw new Error('Erro ao buscar cliente');
        
        const customers = await customerResponse.json();
        let customerId;

        if (customers.length > 0) {
            customerId = customers[0].id;
        } else {
            // Create new customer
            const createCustomerResponse = await fetch(`${API_URL}/Customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    name: 'Cliente Não Identificado',
                    document: plate,
                    phone: '',
                    email: ''
                })
            });

            if (!createCustomerResponse.ok) throw new Error('Erro ao criar cliente');
            const newCustomer = await createCustomerResponse.json();
            customerId = newCustomer.id;
        }

        // Find or create vehicle
        const vehicleResponse = await fetch(`${API_URL}/Vehicles?plate=${plate}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        if (!vehicleResponse.ok) throw new Error('Erro ao buscar veículo');
        
        const vehicles = await vehicleResponse.json();
        let vehicleId;

        if (vehicles.length > 0) {
            vehicleId = vehicles[0].id;
            currentVehicle = vehicles[0];
        } else {
            // Create new vehicle
            const createVehicleResponse = await fetch(`${API_URL}/Vehicles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    plate: plate,
                    brand: '',
                    model: '',
                    year: new Date().getFullYear(),
                    color: '',
                    customerId: customerId
                })
            });

            if (!createVehicleResponse.ok) throw new Error('Erro ao criar veículo');
            const newVehicle = await createVehicleResponse.json();
            vehicleId = newVehicle.id;
            currentVehicle = newVehicle;
        }

        // Create service order
        const serviceOrderResponse = await fetch(`${API_URL}/ServiceOrders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                number: `OS-${Date.now()}`,
                vehicleId: vehicleId,
                customerId: customerId,
                status: 'Aguardando',
                description: observations || 'Check-in via app mobile',
                estimatedTime: 0,
                value: 0,
                mileage: parseInt(mileage),
                fuelLevel: parseInt(fuelLevel)
            })
        });

        if (!serviceOrderResponse.ok) throw new Error('Erro ao criar ordem de serviço');
        
        const serviceOrder = await serviceOrderResponse.json();

        // Update vehicle info for checklist
        document.getElementById('vehicle-plate').textContent = plate;
        document.getElementById('vehicle-customer').textContent = currentVehicle?.customerName || 'Cliente';

        // Show checklist screen
        showScreen('checklist-screen');

    } catch (error) {
        alert(error.message);
    }
});

// Checklist Form
document.getElementById('checklist-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const checklistItems = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById(`item${i}`);
        if (checkbox) {
            checklistItems.push({
                item: checkbox.nextElementSibling.textContent,
                checked: checkbox.checked
            });
        }
    }

    const notes = document.getElementById('checklist-notes').value;

    try {
        // Get the last service order for this vehicle
        const serviceOrdersResponse = await fetch(
            `${API_URL}/ServiceOrders?vehicleId=${currentVehicle?.id}`,
            { headers: { 'Authorization': `Bearer ${currentToken}` } }
        );

        if (!serviceOrdersResponse.ok) throw new Error('Erro ao buscar ordem de serviço');
        
        const serviceOrders = await serviceOrdersResponse.json();
        const latestOrder = serviceOrders[0];

        if (!latestOrder) throw new Error('Nenhuma ordem de serviço encontrada');

        // Create checklist
        const checklistResponse = await fetch(`${API_URL}/Checklists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                serviceOrderId: latestOrder.id,
                vehicleId: currentVehicle.id,
                items: checklistItems,
                notes: notes,
                responsibleUser: 'App Mobile'
            })
        });

        if (!checklistResponse.ok) throw new Error('Erro ao salvar checklist');

        // Show success
        document.getElementById('success-message').textContent = 
            `Check-in e checklist do veículo ${currentVehicle?.plate || ''} registrados com sucesso!`;
        showScreen('success-screen');

    } catch (error) {
        alert(error.message);
    }
});

// Back Button
document.getElementById('back-btn')?.addEventListener('click', () => {
    showScreen('checkin-screen');
});

// New Check-in
document.getElementById('new-checkin-btn')?.addEventListener('click', () => {
    // Reset forms
    document.getElementById('checkin-form')?.reset();
    document.getElementById('checklist-form')?.reset();
    document.getElementById('plate').value = '';
    
    showScreen('checkin-screen');
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentToken = null;
    currentVehicle = null;
    document.getElementById('login-form')?.reset();
    showScreen('login-screen');
});

// Check if already logged in
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (token) {
        currentToken = token;
        showScreen('checkin-screen');
    } else {
        showScreen('login-screen');
    }
});