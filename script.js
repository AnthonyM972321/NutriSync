// NutriSync - JavaScript

// State management with JSONStorage integration
let appState = {
    syncCode: null,
    lastSync: null,
    user: {
        gender: 'homme',
        age: 31,
        height: 180,
        weight: 96,
        goal: 'cut',
        activity: 'light',
        proteinPercent: 30,
        fatPercent: 25,
        carbPercent: 45
    },
    nutrition: {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
        targetCalories: 1836,
        targetProteins: 138,
        targetCarbs: 206,
        targetFats: 51
    },
    hydration: {
        glasses: 0,
        targetGlasses: 8,
        glassVolume: 25,
        dailyGoal: 200
    },
    meals: [],
    weekPlan: null,
    weightHistory: [],
    streak: 0,
    settings: {
        glassSize: 25,
        hydrationGoal: 200,
        apiKeys: {} // API keys stored locally only
    },
    fasting: {
        isActive: false,
        startTime: null,
        targetHours: 16,
        elapsed: 0
    },
    recipes: [],
    progressPhotos: {
        before: null,
        after: null
    },
    voiceCoach: {
        isActive: false,
        language: 'fr-FR'
    },
    micronutrients: {
        vitamins: {
            A: 0, C: 0, D: 0, E: 0, K: 0,
            B1: 0, B2: 0, B3: 0, B6: 0, B12: 0
        },
        minerals: {
            calcium: 0, iron: 0, magnesium: 0,
            phosphorus: 0, potassium: 0, sodium: 0,
            zinc: 0, copper: 0, selenium: 0
        }
    }
};

// Auto-save timer
let autoSaveInterval = null;
let syncInProgress = false;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeSync();
    updateCurrentDate();
    initializeHydration();
    updateDashboard();
    loadFromLocalStorage();
    initializeWeightChart();
    updateDataSize();
    
    // Start auto-save every 30 seconds
    startAutoSave();
});

// Sync Functions
function generateSyncCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'NUTRI-';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function initializeSync() {
    // Check if we have a sync code in localStorage
    const storedCode = localStorage.getItem('nutriSyncCode');
    
    if (storedCode) {
        appState.syncCode = storedCode;
        loadFromCloud(storedCode);
    } else {
        // Generate new sync code
        appState.syncCode = generateSyncCode();
        localStorage.setItem('nutriSyncCode', appState.syncCode);
        saveToCloud();
    }
    
    updateSyncUI();
}

function updateSyncUI() {
    const syncCodeElements = document.querySelectorAll('#syncCode, #cloudSyncCode');
    syncCodeElements.forEach(el => {
        if (el) el.textContent = appState.syncCode;
    });
    
    const lastSyncElements = document.querySelectorAll('#lastSync, #cloudLastSync');
    lastSyncElements.forEach(el => {
        if (el && appState.lastSync) {
            const timeDiff = Date.now() - appState.lastSync;
            const seconds = Math.floor(timeDiff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            
            if (hours > 0) {
                el.textContent = `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
            } else if (minutes > 0) {
                el.textContent = `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
            } else {
                el.textContent = 'Il y a quelques secondes';
            }
        }
    });
}

async function saveToCloud() {
    if (syncInProgress) return;
    
    syncInProgress = true;
    updateSyncBadge('syncing');
    
    try {
        // Prepare data (exclude sensitive info)
        const dataToSync = {
            ...appState,
            settings: {
                ...appState.settings,
                apiKeys: {} // Don't sync API keys
            }
        };
        
        // Save to JSONStorage
        const response = await fetch(`https://api.jsonstorage.net/v1/json/${appState.syncCode}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSync)
        });
        
        if (response.ok) {
            appState.lastSync = Date.now();
            updateSyncBadge('success');
            updateSyncUI();
        } else {
            // If PUT fails, try POST (first time)
            const postResponse = await fetch('https://api.jsonstorage.net/v1/json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSync)
            });
            
            if (postResponse.ok) {
                appState.lastSync = Date.now();
                updateSyncBadge('success');
                updateSyncUI();
            } else {
                updateSyncBadge('error');
            }
        }
    } catch (error) {
        console.error('Sync error:', error);
        updateSyncBadge('error');
    } finally {
        syncInProgress = false;
    }
}

async function loadFromCloud(syncCode) {
    try {
        const response = await fetch(`https://api.jsonstorage.net/v1/json/${syncCode}`);
        
        if (response.ok) {
            const cloudData = await response.json();
            
            // Merge with local state (preserve API keys)
            const localApiKeys = appState.settings.apiKeys;
            appState = {
                ...cloudData,
                settings: {
                    ...cloudData.settings,
                    apiKeys: localApiKeys
                }
            };
            
            updateDashboard();
            initializeHydration();
            updateAllUI();
            
            showSuccess('Données synchronisées depuis le cloud !');
        }
    } catch (error) {
        console.error('Load error:', error);
    }
}

function updateSyncBadge(status) {
    const badge = document.getElementById('syncBadge');
    const statusText = document.getElementById('syncStatus');
    
    if (!badge || !statusText) return;
    
    switch (status) {
        case 'syncing':
            badge.className = 'sync-badge syncing';
            statusText.textContent = 'Synchronisation...';
            break;
        case 'success':
            badge.className = 'sync-badge';
            statusText.textContent = 'Données synchronisées';
            break;
        case 'error':
            badge.className = 'sync-badge error';
            statusText.textContent = 'Erreur de sync';
            break;
    }
}

function toggleSyncInfo() {
    const infoBox = document.getElementById('syncInfoBox');
    infoBox.classList.toggle('show');
}

function copySyncCode() {
    const code = appState.syncCode;
    navigator.clipboard.writeText(code).then(() => {
        const btn = event.target;
        btn.textContent = '✓ Copié !';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.textContent = '📋 Copier';
            btn.classList.remove('copied');
        }, 2000);
    });
}

function showSyncModal() {
    document.getElementById('syncModal').classList.add('active');
}

async function syncWithCode() {
    const code = document.getElementById('existingSyncCode').value.trim().toUpperCase();
    
    if (!code || !code.startsWith('NUTRI-')) {
        alert('Code invalide. Le format doit être NUTRI-XXXXX');
        return;
    }
    
    if (confirm('Cela remplacera toutes vos données actuelles. Continuer ?')) {
        localStorage.setItem('nutriSyncCode', code);
        appState.syncCode = code;
        await loadFromCloud(code);
        closeModal('syncModal');
        location.reload();
    }
}

function startAutoSave() {
    // Save every 30 seconds
    autoSaveInterval = setInterval(() => {
        saveToCloud();
        saveToLocalStorage();
    }, 30000);
}

function forceSync() {
    saveToCloud();
    showSuccess('Synchronisation forcée !');
}

// Update current date
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('fr-FR', options);
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = today;
    }
}

// Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Save to cloud when changing pages
    saveToCloud();
}

// Hydration tracking
function initializeHydration() {
    const container = document.getElementById('hydrationGlasses');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < appState.hydration.targetGlasses; i++) {
        const glass = document.createElement('div');
        glass.className = 'glass';
        glass.onclick = () => toggleGlass(i);
        if (i < appState.hydration.glasses) {
            glass.classList.add('filled');
        }
        container.appendChild(glass);
    }
    
    updateHydrationStatus();
}

function toggleGlass(index) {
    if (index === appState.hydration.glasses - 1) {
        appState.hydration.glasses--;
    } else if (index === appState.hydration.glasses) {
        appState.hydration.glasses++;
    }
    
    initializeHydration();
    updateDashboard();
    saveToCloud();
}

function resetHydration() {
    appState.hydration.glasses = 0;
    initializeHydration();
    updateDashboard();
    saveToCloud();
    showSuccess('Hydratation réinitialisée');
}

function updateHydrationStatus() {
    const totalCl = appState.hydration.glasses * appState.hydration.glassVolume;
    const statusEl = document.getElementById('hydrationStatus');
    if (statusEl) {
        statusEl.textContent = `${appState.hydration.glasses}/8 verres = ${totalCl}cl`;
    }
}

// Dashboard updates
function updateDashboard() {
    // Update calories
    updateElement('consumedCalories', appState.nutrition.calories);
    updateElement('remainingCalories', appState.nutrition.targetCalories - appState.nutrition.calories);
    
    // Update progress bars
    updateProgressBar('calories', appState.nutrition.calories, appState.nutrition.targetCalories);
    updateProgressBar('proteins', appState.nutrition.proteins, appState.nutrition.targetProteins);
    updateProgressBar('hydration', 
        appState.hydration.glasses * appState.hydration.glassVolume, 
        appState.hydration.dailyGoal
    );
    
    // Update progress text
    updateElement('caloriesProgress', `${appState.nutrition.calories} / ${appState.nutrition.targetCalories}`);
    updateElement('proteinsProgress', `${appState.nutrition.proteins}g / ${appState.nutrition.targetProteins}g`);
    updateElement('hydrationProgress', 
        `${appState.hydration.glasses * appState.hydration.glassVolume}cl / ${appState.hydration.dailyGoal}cl`
    );
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function updateProgressBar(type, current, target) {
    const percentage = Math.min((current / target) * 100, 100);
    const bar = document.getElementById(`${type}Bar`);
    if (bar) bar.style.width = percentage + '%';
}

// Profile and calculations
function updateMacros() {
    const proteinPercent = parseInt(document.getElementById('proteinSlider').value);
    const fatPercent = parseInt(document.getElementById('fatSlider').value);
    const carbPercent = 100 - proteinPercent - fatPercent;
    
    document.getElementById('proteinPercent').textContent = proteinPercent;
    document.getElementById('fatPercent').textContent = fatPercent;
    document.getElementById('carbPercent').textContent = carbPercent;
    
    appState.user.proteinPercent = proteinPercent;
    appState.user.fatPercent = fatPercent;
    appState.user.carbPercent = carbPercent;
}

function calculateProteinRatio() {
    const weight = parseFloat(document.getElementById('weight').value);
    const proteinPerKg = parseFloat(document.getElementById('proteinPerKg').value);
    const totalProtein = weight * proteinPerKg;
    
    const estimatedCalories = appState.nutrition.targetCalories || 2000;
    const proteinCalories = totalProtein * 4;
    const proteinPercent = Math.round((proteinCalories / estimatedCalories) * 100);
    
    document.getElementById('proteinRatioResult').textContent = 
        `Résultat : ${proteinPercent}% de protéines`;
    
    document.getElementById('proteinSlider').value = proteinPercent;
    updateMacros();
}

function calculateNeeds() {
    const gender = document.getElementById('gender').value;
    const age = parseInt(document.getElementById('age').value);
    const height = parseInt(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const activity = document.getElementById('activity').value;
    const goal = document.getElementById('goal').value;
    
    // Calculate BMR (Mifflin-St Jeor)
    let bmr;
    if (gender === 'homme') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    // Activity multipliers
    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        athlete: 1.9
    };
    
    let tdee = bmr * activityMultipliers[activity];
    
    // Goal adjustments
    const goalAdjustments = {
        'cut': -500,
        'cut-moderate': -250,
        'maintenance': 0,
        'bulk-moderate': 250,
        'bulk': 500
    };
    
    const targetCalories = Math.round(tdee + goalAdjustments[goal]);
    
    // Calculate macros
    const proteinCalories = (targetCalories * appState.user.proteinPercent) / 100;
    const fatCalories = (targetCalories * appState.user.fatPercent) / 100;
    const carbCalories = (targetCalories * appState.user.carbPercent) / 100;
    
    appState.nutrition.targetCalories = targetCalories;
    appState.nutrition.targetProteins = Math.round(proteinCalories / 4);
    appState.nutrition.targetFats = Math.round(fatCalories / 9);
    appState.nutrition.targetCarbs = Math.round(carbCalories / 4);
    
    // Update UI
    document.getElementById('metabolicRate').textContent = Math.round(tdee);
    updateDashboard();
    saveProfile();
    
    showSuccess(`Besoins calculés: ${targetCalories} kcal/jour`);
}

function saveProfile() {
    // Update state from form
    appState.user.gender = document.getElementById('gender').value;
    appState.user.age = parseInt(document.getElementById('age').value);
    appState.user.height = parseInt(document.getElementById('height').value);
    appState.user.weight = parseFloat(document.getElementById('weight').value);
    appState.user.activity = document.getElementById('activity').value;
    appState.user.goal = document.getElementById('goal').value;
    
    saveToCloud();
    showSuccess('Profil sauvegardé !');
}

// Open Food Facts Integration
async function searchOpenFoodFacts() {
    const query = document.getElementById('foodSearchInput').value.trim();
    if (!query) {
        alert('Veuillez entrer un nom d\'aliment');
        return;
    }
    
    showSuccess('Recherche en cours...');
    
    try {
        // Search in Open Food Facts API
        const response = await fetch(`https://fr.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`);
        
        if (!response.ok) {
            throw new Error('Erreur de recherche');
        }
        
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
            displaySearchResults(data.products);
        } else {
            showSuccess('Aucun produit trouvé');
            document.getElementById('searchResults').style.display = 'none';
        }
    } catch (error) {
        console.error('Search error:', error);
        showSuccess('Erreur lors de la recherche');
    }
}

function displaySearchResults(products) {
    const resultsDiv = document.getElementById('searchResults');
    const resultsList = document.getElementById('searchResultsList');
    
    resultsList.innerHTML = products.map(product => {
        const name = product.product_name || 'Produit sans nom';
        const brand = product.brands || '';
        const calories = product.nutriments?.['energy-kcal_100g'] || 0;
        const proteins = product.nutriments?.proteins_100g || 0;
        const carbs = product.nutriments?.carbohydrates_100g || 0;
        const fats = product.nutriments?.fat_100g || 0;
        
        return `
            <div class="food-result-item" onclick="addProductToMeal('${name}', '${brand}', ${calories}, ${proteins}, ${carbs}, ${fats})">
                <div class="food-info">
                    <h4>${name}</h4>
                    <p class="food-brand">${brand}</p>
                    <p>Pour 100g: ${calories} kcal | P: ${proteins}g | G: ${carbs}g | L: ${fats}g</p>
                </div>
                <button class="btn btn-success" style="padding: 5px 15px;">
                    + Ajouter
                </button>
            </div>
        `;
    }).join('');
    
    resultsDiv.style.display = 'block';
}

function addProductToMeal(name, brand, calories, proteins, carbs, fats) {
    const quantity = prompt('Quantité en grammes:', '100');
    if (!quantity || isNaN(quantity)) return;
    
    const factor = parseFloat(quantity) / 100;
    
    appState.nutrition.calories += Math.round(calories * factor);
    appState.nutrition.proteins += Math.round(proteins * factor * 10) / 10;
    appState.nutrition.carbs += Math.round(carbs * factor * 10) / 10;
    appState.nutrition.fats += Math.round(fats * factor * 10) / 10;
    
    appState.meals.push({
        name: `${name} ${brand ? '(' + brand + ')' : ''}`.trim(),
        quantity: parseFloat(quantity),
        calories: Math.round(calories * factor),
        proteins: Math.round(proteins * factor * 10) / 10,
        carbs: Math.round(carbs * factor * 10) / 10,
        fats: Math.round(fats * factor * 10) / 10,
        time: new Date().toLocaleTimeString()
    });
    
    updateDashboard();
    saveToCloud();
    showSuccess(`${name} ajouté !`);
    
    // Hide search results
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('foodSearchInput').value = '';
}

// Barcode Scanner Functions
async function searchByBarcode() {
    const barcode = document.getElementById('barcodeInput').value.trim();
    if (!barcode) {
        alert('Veuillez entrer un code-barres');
        return;
    }
    
    showSuccess('Recherche du produit...');
    
    try {
        // Search by barcode in Open Food Facts
        const response = await fetch(`https://fr.openfoodfacts.org/api/v0/product/${barcode}.json`);
        
        if (!response.ok) {
            throw new Error('Produit non trouvé');
        }
        
        const data = await response.json();
        
        if (data.status === 1 && data.product) {
            displayBarcodeResult(data.product);
        } else {
            showSuccess('Produit non trouvé dans la base de données');
        }
    } catch (error) {
        console.error('Barcode search error:', error);
        showSuccess('Erreur lors de la recherche du code-barres');
    }
}

function displayBarcodeResult(product) {
    const name = product.product_name || 'Produit sans nom';
    const brand = product.brands || '';
    const serving = product.serving_size ? parseInt(product.serving_size) : 100;
    const calories = product.nutriments?.['energy-kcal_100g'] || 0;
    const proteins = product.nutriments?.proteins_100g || 0;
    const carbs = product.nutriments?.carbohydrates_100g || 0;
    const fats = product.nutriments?.fat_100g || 0;
    
    const infoDiv = document.getElementById('barcodeProductInfo');
    infoDiv.innerHTML = `
        <h4>${name}</h4>
        <p style="color: #666; margin-bottom: 15px;">${brand}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
            <p><strong>Pour 100g :</strong></p>
            <p>Calories: ${calories} kcal</p>
            <p>Protéines: ${proteins}g</p>
            <p>Glucides: ${carbs}g</p>
            <p>Lipides: ${fats}g</p>
        </div>
    `;
    
    // Store product data for adding
    window.currentBarcodeProduct = {
        name, brand, calories, proteins, carbs, fats
    };
    
    document.getElementById('barcodeResultModal').classList.add('active');
}

function addBarcodeProduct() {
    if (window.currentBarcodeProduct) {
        const { name, brand, calories, proteins, carbs, fats } = window.currentBarcodeProduct;
        addProductToMeal(name, brand, calories, proteins, carbs, fats);
        closeModal('barcodeResultModal');
        document.getElementById('barcodeInput').value = '';
    }
}

function startBarcodeScanner() {
    showSuccess('Scanner de code-barres activé (nécessite API caméra)');
}

// Chat functionality
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    input.value = '';
    
    // Check if OpenAI API key is set
    const apiKey = appState.settings.apiKeys.openai;
    if (!apiKey) {
        addChatMessage("Pour utiliser le chat IA, veuillez d'abord configurer votre clé API OpenAI dans les paramètres.", 'ai');
        return;
    }
    
    // Simulate AI response for now
    setTimeout(() => {
        const responses = [
            "D'après votre profil, je recommande d'augmenter votre apport en protéines à 2.2g par kg de poids corporel pour optimiser la perte de gras tout en préservant votre masse musculaire.",
            "Pour atteindre votre objectif de perte de poids, maintenez un déficit calorique de 500 kcal/jour. Cela devrait vous permettre de perdre environ 0.5kg par semaine de façon saine.",
            "N'oubliez pas de boire au moins 2L d'eau par jour. L'hydratation est cruciale pour le métabolisme et la récupération musculaire.",
            "Je vous conseille de répartir vos protéines sur 4-5 repas dans la journée pour une meilleure synthèse protéique.",
            "Privilégiez les glucides complexes (avoine, riz complet, patate douce) autour de vos entraînements pour optimiser vos performances."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addChatMessage(randomResponse, 'ai');
    }, 1000);
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const icon = sender === 'ai' ? '🤖' : '👤';
    messageDiv.innerHTML = `
        <p><strong>${icon} ${sender === 'ai' ? 'Coach IA' : 'Vous'}</strong></p>
        <p>${message}</p>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add enter key support for chat
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});

// Recipe generation
function generateRecipe() {
    const apiKey = appState.settings.apiKeys.openai;
    if (!apiKey) {
        showSuccess('Veuillez configurer votre clé API OpenAI dans les paramètres');
        return;
    }
    showSuccess('Génération de recette en cours...');
}

// Week planning
function generateWeekPlan() {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const meals = ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner'];
    
    let planHTML = '<h3 style="margin-bottom: 20px;">📅 Votre planning de la semaine</h3>';
    planHTML += '<div style="display: grid; gap: 20px;">';
    
    days.forEach(day => {
        planHTML += `
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <h4 style="color: #7c3aed; margin-bottom: 15px;">${day}</h4>
                <div style="display: grid; gap: 10px;">
        `;
        
        meals.forEach(meal => {
            planHTML += `
                <div style="background: #f5f5f5; padding: 10px; border-radius: 8px;">
                    <strong>${meal}:</strong> 
                    <span style="color: #666;">Généré par IA selon vos préférences</span>
                </div>
            `;
        });
        
        planHTML += `
                </div>
            </div>
        `;
    });
    
    planHTML += '</div>';
    
    document.getElementById('weekPlan').innerHTML = planHTML;
    document.getElementById('weekPlan').style.display = 'block';
    
    appState.weekPlan = { generated: new Date().toISOString() };
    saveToCloud();
    showSuccess('Planning de la semaine généré !');
}

// Food management
function showAddFoodModal() {
    document.getElementById('addFoodModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function addCustomFood() {
    const name = document.getElementById('foodName').value;
    const quantity = parseFloat(document.getElementById('foodQuantity').value);
    const calories = parseFloat(document.getElementById('foodCalories').value);
    const proteins = parseFloat(document.getElementById('foodProteins').value);
    const carbs = parseFloat(document.getElementById('foodCarbs').value);
    const fats = parseFloat(document.getElementById('foodFats').value);
    
    if (!name || !quantity) {
        alert('Veuillez remplir tous les champs requis');
        return;
    }
    
    // Add to daily totals
    appState.nutrition.calories += calories;
    appState.nutrition.proteins += proteins;
    appState.nutrition.carbs += carbs;
    appState.nutrition.fats += fats;
    
    // Add to meals list
    appState.meals.push({
        name,
        quantity,
        calories,
        proteins,
        carbs,
        fats,
        time: new Date().toLocaleTimeString()
    });
    
    updateDashboard();
    closeModal('addFoodModal');
    saveToCloud();
    showSuccess(`${name} ajouté !`);
    
    // Clear form
    document.getElementById('foodName').value = '';
    document.getElementById('foodQuantity').value = '100';
    document.getElementById('foodCalories').value = '';
    document.getElementById('foodProteins').value = '';
    document.getElementById('foodCarbs').value = '';
    document.getElementById('foodFats').value = '';
}

// Smart Suggestions
function generateSmartSuggestions() {
    const remainingProteins = appState.nutrition.targetProteins - appState.nutrition.proteins;
    const remainingCalories = appState.nutrition.targetCalories - appState.nutrition.calories;
    
    const suggestions = [
        {
            name: 'Blanc de poulet grillé',
            quantity: '150g',
            proteins: 46,
            calories: 247,
            icon: '🍗'
        },
        {
            name: 'Shake protéiné',
            quantity: '1 scoop',
            proteins: 25,
            calories: 120,
            icon: '🥤'
