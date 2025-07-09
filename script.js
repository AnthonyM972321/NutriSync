// NutriSync - Application complète

// State management
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
    currentMealType: 'breakfast',
    settings: {
        glassSize: 25,
        hydrationGoal: 200,
        apiKeys: {}
    }
};

// Configuration
const STORAGE_KEY = 'nutrisync_data';
let autoSaveInterval = null;
let syncInProgress = false;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeSync();
    updateCurrentDate();
    initializeHydration();
    updateDashboard();
    loadFromLocalStorage();
    updateSyncUI();
    checkFirstTime();
    startAutoSave();
    
    // Add enter key support for chat
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});

// Check if first time user
function checkFirstTime() {
    const hasVisited = localStorage.getItem('nutriSyncVisited');
    if (!hasVisited) {
        document.getElementById('firstTimeModal').classList.add('active');
        document.getElementById('firstTimeCode').textContent = appState.syncCode;
        localStorage.setItem('nutriSyncVisited', 'true');
    }
}

function closeFirstTimeModal() {
    document.getElementById('firstTimeModal').classList.remove('active');
}

function copyFirstTimeCode() {
    const code = appState.syncCode;
    navigator.clipboard.writeText(code).then(() => {
        const btn = event.target;
        btn.textContent = '✓ Copié !';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = '📋 Copier le code';
            btn.classList.remove('copied');
        }, 2000);
    });
}

// Sync Functions
function generateSyncCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'NUTRI-';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function initializeSync() {
    const storedCode = localStorage.getItem('nutriSyncCode');
    if (storedCode) {
        appState.syncCode = storedCode;
        await loadFromCloud();
    } else {
        appState.syncCode = generateSyncCode();
        localStorage.setItem('nutriSyncCode', appState.syncCode);
        await saveToCloud();
    }
    updateSyncUI();
}

async function saveToCloud() {
    if (syncInProgress) return;
    syncInProgress = true;
    updateSyncBadge('syncing');
    
    try {
        const storageKey = `nutrisync_${appState.syncCode}`;
        localStorage.setItem(storageKey, JSON.stringify(appState));
        appState.lastSync = Date.now();
        updateSyncBadge('success');
        updateSyncUI();
        saveToLocalStorage();
    } catch (error) {
        console.error('Sync error:', error);
        updateSyncBadge('error');
        saveToLocalStorage();
    } finally {
        syncInProgress = false;
    }
}

async function loadFromCloud() {
    if (!appState.syncCode) return;
    
    try {
        const storageKey = `nutrisync_${appState.syncCode}`;
        const cloudData = localStorage.getItem(storageKey);
        
        if (cloudData) {
            const parsedData = JSON.parse(cloudData);
            const localApiKeys = appState.settings.apiKeys;
            appState = {
                ...parsedData,
                settings: {
                    ...parsedData.settings,
                    apiKeys: localApiKeys
                }
            };
            updateDashboard();
            initializeHydration();
            updateAllUI();
            showSuccess('Données synchronisées !');
        }
    } catch (error) {
        console.error('Load error:', error);
        loadFromLocalStorage();
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

function updateSyncUI() {
    const syncCodeElements = document.querySelectorAll('#syncCode, #analyticsCode');
    syncCodeElements.forEach(el => {
        if (el) el.textContent = appState.syncCode;
    });
    
    const lastSyncElements = document.querySelectorAll('#lastSyncTime');
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
        const storageKey = `nutrisync_${code}`;
        const syncData = localStorage.getItem(storageKey);
        
        if (syncData) {
            try {
                const parsedData = JSON.parse(syncData);
                appState = parsedData;
                appState.syncCode = code;
                localStorage.setItem('nutriSyncCode', code);
                updateAllUI();
                showSuccess('Synchronisation réussie !');
                closeModal('syncModal');
            } catch (error) {
                alert('Erreur lors de la synchronisation');
            }
        } else {
            alert('Aucune donnée trouvée pour ce code');
        }
    }
}

function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        saveToCloud();
    }, 30000);
}

function forceSync() {
    saveToCloud();
    showSuccess('Synchronisation forcée !');
}

// Local Storage Functions
function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            const currentSyncCode = appState.syncCode;
            appState = {
                ...parsedData,
                syncCode: currentSyncCode || parsedData.syncCode
            };
            updateAllUI();
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
    }
}

// Update all UI elements
function updateAllUI() {
    updateDashboard();
    initializeHydration();
    updateProfileForm();
    updateAnalytics();
    updateMealsList();
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
    
    // Find and activate the clicked nav item
    if (event && event.target) {
        event.target.closest('.nav-item').classList.add('active');
    }
    
    // Save state
    saveToCloud();
}

// Goal selection
function setGoal(goal) {
    appState.user.goal = goal;
    
    // Update UI
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });
    event.target.closest('.stat-card').classList.add('active');
    
    // Recalculate needs if profile is complete
    if (appState.user.weight && appState.user.height) {
        calculateNeeds();
    }
    
    saveToCloud();
}

// Meal type selection
let currentMealType = 'breakfast';

function selectMealType(type, event) {
    currentMealType = type;
    appState.currentMealType = type;
    
    // Update UI
    document.querySelectorAll('.meal-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.meal-btn').classList.add('active');
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
    updateElement('consumedCalories', appState.nutrition.calories);
    updateElement('remainingCalories', Math.max(0, appState.nutrition.targetCalories - appState.nutrition.calories));
    updateElement('metabolicRate', appState.nutrition.targetCalories + 1000);
    
    updateProgressBar('calories', appState.nutrition.calories, appState.nutrition.targetCalories);
    updateProgressBar('proteins', appState.nutrition.proteins, appState.nutrition.targetProteins);
    updateProgressBar('hydration', 
        appState.hydration.glasses * appState.hydration.glassVolume, 
        appState.hydration.dailyGoal
    );
    
    updateElement('caloriesProgress', `${appState.nutrition.calories} / ${appState.nutrition.targetCalories}`);
    updateElement('proteinsProgress', `${appState.nutrition.proteins}g / ${appState.nutrition.targetProteins}g`);
    updateElement('hydrationProgress', 
        `${appState.hydration.glasses * appState.hydration.glassVolume}cl / ${appState.hydration.dailyGoal}cl`
    );
    
    updateMealsList();
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function updateProgressBar(type, current, target) {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const bar = document.getElementById(`${type}Bar`);
    if (bar) bar.style.width = percentage + '%';
}

// Update meals list
function updateMealsList() {
    const mealsContainer = document.getElementById('todaysMeals');
    if (!mealsContainer) return;
    
    if (appState.meals.length === 0) {
        mealsContainer.innerHTML = `
            <p>Aucun repas ajouté aujourd'hui</p>
            <button class="btn btn-primary" style="margin-top: 20px;" onclick="showPage('foods')">
                Ajouter un repas
            </button>
        `;
    } else {
        let mealsHTML = '<div style="display: flex; flex-direction: column; gap: 10px;">';
        appState.meals.forEach((meal, index) => {
            mealsHTML += `
                <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${meal.name}</strong> (${meal.quantity}g)<br>
                        <span style="font-size: 14px; color: #666;">
                            ${meal.calories} kcal | P: ${meal.proteins}g | G: ${meal.carbs}g | L: ${meal.fats}g
                        </span>
                    </div>
                    <button class="btn" style="background: #f44336; color: white; padding: 5px 15px;" onclick="removeMeal(${index})">
                        ✕
                    </button>
                </div>
            `;
        });
        mealsHTML += '</div>';
        mealsContainer.innerHTML = mealsHTML;
    }
}

function removeMeal(index) {
    const meal = appState.meals[index];
    appState.nutrition.calories -= meal.calories;
    appState.nutrition.proteins -= meal.proteins;
    appState.nutrition.carbs -= meal.carbs;
    appState.nutrition.fats -= meal.fats;
    appState.meals.splice(index, 1);
    updateDashboard();
    saveToCloud();
    showSuccess('Repas supprimé');
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
    const weight = parseFloat(document.getElementById('weight').value) || appState.user.weight;
    const proteinPerKg = parseFloat(document.getElementById('proteinPerKg').value);
    const totalProtein = weight * proteinPerKg;
    
    const estimatedCalories = appState.nutrition.targetCalories || 2000;
    const proteinCalories = totalProtein * 4;
    const proteinPercent = Math.round((proteinCalories / estimatedCalories) * 100);
    
    document.getElementById('proteinRatioResult').textContent = 
        `Résultat : ${proteinPercent}% de protéines (${Math.round(totalProtein)}g/jour)`;
    
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
    
    appState.user.gender = gender;
    appState.user.age = age;
    appState.user.height = height;
    appState.user.weight = weight;
    appState.user.activity = activity;
    appState.user.goal = goal;
    
    // Calculate BMR (Mifflin-St Jeor)
    let bmr;
    if (gender === 'homme') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        athlete: 1.9
    };
    
    let tdee = bmr * activityMultipliers[activity];
    
    const goalAdjustments = {
        'cut': -500,
        'cut-moderate': -250,
        'maintenance': 0,
        'bulk-moderate': 250,
        'bulk': 500
    };
    
    const targetCalories = Math.round(tdee + goalAdjustments[goal]);
    
    const proteinCalories = (targetCalories * appState.user.proteinPercent) / 100;
    const fatCalories = (targetCalories * appState.user.fatPercent) / 100;
    const carbCalories = (targetCalories * appState.user.carbPercent) / 100;
    
    appState.nutrition.targetCalories = targetCalories;
    appState.nutrition.targetProteins = Math.round(proteinCalories / 4);
    appState.nutrition.targetFats = Math.round(fatCalories / 9);
    appState.nutrition.targetCarbs = Math.round(carbCalories / 4);
    
    updateDashboard();
    showSuccess(`Besoins calculés: ${targetCalories} kcal/jour`);
    saveToCloud();
}

function saveProfile() {
    calculateNeeds();
    showSuccess('Profil sauvegardé !');
}

function updateProfileForm() {
    if (document.getElementById('gender')) {
        document.getElementById('gender').value = appState.user.gender;
        document.getElementById('age').value = appState.user.age;
        document.getElementById('height').value = appState.user.height;
        document.getElementById('weight').value = appState.user.weight;
        document.getElementById('activity').value = appState.user.activity;
        document.getElementById('goal').value = appState.user.goal;
        document.getElementById('proteinSlider').value = appState.user.proteinPercent;
        document.getElementById('fatSlider').value = appState.user.fatPercent;
        updateMacros();
    }
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
        const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&countries_tags=fr`);
        
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
        const name = product.product_name || product.product_name_fr || 'Produit sans nom';
        const brand = product.brands || '';
        const calories = product.nutriments?.['energy-kcal_100g'] || 0;
        const proteins = product.nutriments?.proteins_100g || 0;
        const carbs = product.nutriments?.carbohydrates_100g || 0;
        const fats = product.nutriments?.fat_100g || 0;
        
        return `
            <div class="food-result-item" onclick="addProductToMeal('${escapeHtml(name)}', '${escapeHtml(brand)}', ${calories}, ${proteins}, ${carbs}, ${fats})">
                <div class="food-info">
                    <h4>${escapeHtml(name)}</h4>
                    <p class="food-brand">${escapeHtml(brand)}</p>
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

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function addProductToMeal(name, brand, calories, proteins, carbs, fats) {
    const quantity = prompt('Quantité en grammes:', '100');
    if (!quantity || isNaN(quantity)) return;
    
    const factor = parseFloat(quantity) / 100;
    
    const meal = {
        name: `${name} ${brand ? '(' + brand + ')' : ''}`.trim(),
        quantity: parseFloat(quantity),
        calories: Math.round(calories * factor),
        proteins: Math.round(proteins * factor * 10) / 10,
        carbs: Math.round(carbs * factor * 10) / 10,
        fats: Math.round(fats * factor * 10) / 10,
        time: new Date().toLocaleTimeString(),
        type: currentMealType
    };
    
    appState.nutrition.calories += meal.calories;
    appState.nutrition.proteins += meal.proteins;
    appState.nutrition.carbs += meal.carbs;
    appState.nutrition.fats += meal.fats;
    appState.meals.push(meal);
    
    updateDashboard();
    saveToCloud();
    showSuccess(`${name} ajouté !`);
    
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
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        
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
    const name = product.product_name || product.product_name_fr || 'Produit sans nom';
    const brand = product.brands || '';
    const calories = product.nutriments?.['energy-kcal_100g'] || 0;
    const proteins = product.nutriments?.proteins_100g || 0;
    const carbs = product.nutriments?.carbohydrates_100g || 0;
    const fats = product.nutriments?.fat_100g || 0;
    
    const infoDiv = document.getElementById('barcodeProductInfo');
    infoDiv.innerHTML = `
        <h4>${escapeHtml(name)}</h4>
        <p style="color: #666; margin-bottom: 15px;">${escapeHtml(brand)}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
            <p><strong>Pour 100g :</strong></p>
            <p>Calories: ${calories} kcal</p>
            <p>Protéines: ${proteins}g</p>
            <p>Glucides: ${carbs}g</p>
            <p>Lipides: ${fats}g</p>
        </div>
    `;
    
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

// Custom food
function showAddFoodModal() {
    document.getElementById('addFoodModal').classList.add('active');
}

function addCustomFood() {
    const name = document.getElementById('foodName').value;
    const quantity = parseFloat(document.getElementById('foodQuantity').value);
    const calories = parseFloat(document.getElementById('foodCalories').value) || 0;
    const proteins = parseFloat(document.getElementById('foodProteins').value) || 0;
    const carbs = parseFloat(document.getElementById('foodCarbs').value) || 0;
    const fats = parseFloat(document.getElementById('foodFats').value) || 0;
    
    if (!name || !quantity) {
        alert('Veuillez remplir au moins le nom et la quantité');
        return;
    }
    
    const meal = {
        name,
        quantity,
        calories: Math.round(calories),
        proteins: Math.round(proteins * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fats: Math.round(fats * 10) / 10,
        time: new Date().toLocaleTimeString(),
        type: currentMealType
    };
    
    appState.nutrition.calories += meal.calories;
    appState.nutrition.proteins += meal.proteins;
    appState.nutrition.carbs += meal.carbs;
    appState.nutrition.fats += meal.fats;
    appState.meals.push(meal);
    
    updateDashboard();
    closeModal('addFoodModal');
    saveToCloud();
    showSuccess(`${name} ajouté !`);
    
    document.getElementById('foodName').value = '';
    document.getElementById('foodQuantity').value = '100';
    document.getElementById('foodCalories').value = '';
    document.getElementById('foodProteins').value = '';
    document.getElementById('foodCarbs').value = '';
    document.getElementById('foodFats').value = '';
}

// Chat functionality
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    
    setTimeout(() => {
        const response = generateAIResponse(message);
        addChatMessage(response, 'ai');
    }, 1000);
}

function generateAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    const remainingCalories = appState.nutrition.targetCalories - appState.nutrition.calories;
    const remainingProteins = appState.nutrition.targetProteins - appState.nutrition.proteins;
    
    if (lowerMessage.includes('protéine') || lowerMessage.includes('protein')) {
        if (remainingProteins > 50) {
            return `Il vous reste ${remainingProteins}g de protéines à consommer aujourd'hui. Je recommande des sources maigres comme le blanc de poulet (31g/100g), le thon (30g/100g), ou les oeufs (13g/100g).`;
        } else if (remainingProteins > 0) {
            return `Vous êtes proche de votre objectif de protéines ! Il vous reste ${remainingProteins}g. Un yaourt grec (10g) ou une poignée d'amandes (6g) pourrait compléter parfaitement.`;
        } else {
            return `Excellent ! Vous avez atteint votre objectif de protéines pour aujourd'hui (${appState.nutrition.proteins}g/${appState.nutrition.targetProteins}g).`;
        }
    }
    
    if (lowerMessage.includes('calorie') || lowerMessage.includes('manger')) {
        if (remainingCalories > 500) {
            return `Il vous reste ${remainingCalories} calories à consommer. C'est suffisant pour un repas complet ! Privilégiez un équilibre entre protéines, glucides complexes et bonnes graisses.`;
        } else if (remainingCalories > 0) {
            return `Il vous reste ${remainingCalories} calories. Parfait pour une collation équilibrée !`;
        } else {
            return `Vous avez atteint votre objectif calorique (${appState.nutrition.calories} kcal).`;
        }
    }
    
    const responses = [
        "Pour optimiser votre perte de gras tout en préservant la masse musculaire, maintenez un déficit calorique modéré (300-500 kcal) et consommez au moins 1.8-2.2g de protéines par kg de poids corporel.",
        "N'oubliez pas l'importance du timing nutritionnel : consommez des protéines et glucides dans les 2h suivant votre entraînement pour optimiser la récupération.",
        "Les micronutriments sont essentiels ! Assurez-vous de manger une variété de légumes colorés pour couvrir vos besoins en vitamines et minéraux.",
        "Le sommeil est crucial pour vos objectifs. Visez 7-9h par nuit pour optimiser la récupération musculaire et la régulation hormonale."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function askQuestion(question) {
    document.getElementById('chatInput').value = question;
    sendMessage();
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

// Week planning
function generateWeekPlan() {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const meals = [
        { type: 'Petit-déjeuner', icon: '🥐' },
        { type: 'Déjeuner', icon: '🍝' },
        { type: 'Collation', icon: '🍓' },
        { type: 'Dîner', icon: '🍖' }
    ];
    
    const mealSuggestions = {
        'cut': {
            'Petit-déjeuner': ['Omelette aux légumes', 'Yaourt grec avec fruits rouges', 'Porridge protéiné'],
            'Déjeuner': ['Salade de poulet grillé', 'Buddha bowl quinoa', 'Poisson blanc et légumes vapeur'],
            'Collation': ['Pomme et amandes', 'Cottage cheese', 'Légumes et houmous'],
            'Dîner': ['Saumon et brocolis', 'Poulet aux épices et salade', 'Tofu sauté aux légumes']
        },
        'bulk': {
            'Petit-déjeuner': ['Pancakes protéinés', 'Bol de granola complet', 'Oeufs et avocat toast'],
            'Déjeuner': ['Pâtes au poulet', 'Riz et boeuf teriyaki', 'Burger maison avec patates douces'],
            'Collation': ['Shake protéiné et banane', 'Beurre de cacahuète et pain complet', 'Mix de noix et fruits secs'],
            'Dîner': ['Steak et pommes de terre', 'Pâtes carbonara allégées', 'Pizza maison protéinée']
        }
    };
    
    const userGoal = appState.user.goal.includes('bulk') ? 'bulk' : 'cut';
    const suggestions = mealSuggestions[userGoal] || mealSuggestions['cut'];
    
    let planHTML = '<h3 style="margin-bottom: 20px;">📅 Votre planning de la semaine</h3>';
    planHTML += '<div style="display: grid; gap: 20px;">';
    
    days.forEach(day => {
        planHTML += `
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <h4 style="color: #7c3aed; margin-bottom: 15px;">${day}</h4>
                <div style="display: grid; gap: 10px;">
        `;
        
        meals.forEach(meal => {
            const randomMeal = suggestions[meal.type][Math.floor(Math.random() * suggestions[meal.type].length)];
            planHTML += `
                <div style="background: #f5f5f5; padding: 10px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">${meal.icon}</span>
                    <div style="flex: 1;">
                        <strong>${meal.type}:</strong><br>
                        <span style="color: #666;">${randomMeal}</span>
                    </div>
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
    
    saveToCloud();
    showSuccess('Planning de la semaine généré !');
}

// Analytics
function updateAnalytics() {
    updateElement('totalMeals', appState.meals.length);
    updateElement('avgCalories', appState.nutrition.calories);
    updateElement('streak', 0);
}

// Settings
function updateGlassSize() {
    const newSize = parseInt(document.getElementById('glassSize').value);
    appState.settings.glassSize = newSize;
    appState.hydration.glassVolume = newSize;
    appState.hydration.targetGlasses = Math.ceil(appState.hydration.dailyGoal / newSize);
    
    initializeHydration();
    updateDashboard();
    saveToCloud();
    showSuccess('Taille des verres mise à jour');
}

function updateHydrationGoal() {
    const newGoal = parseInt(document.getElementById('hydrationGoal').value);
    appState.settings.hydrationGoal = newGoal;
    appState.hydration.dailyGoal = newGoal;
    appState.hydration.targetGlasses = Math.ceil(newGoal / appState.hydration.glassVolume);
    
    initializeHydration();
    updateDashboard();
    saveToCloud();
    showSuccess('Objectif d\'hydratation mis à jour');
}

function saveSettings() {
    const openaiKey = document.getElementById('openaiKey').value;
    if (openaiKey) {
        appState.settings.apiKeys.openai = openaiKey;
    }
    
    saveToLocalStorage();
    showSuccess('Paramètres sauvegardés !');
}

// Data export/import
function exportData() {
    const dataStr = JSON.stringify(appState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nutrisync-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showSuccess('Données exportées !');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (confirm('Cela remplacera toutes vos données actuelles. Continuer ?')) {
                    appState = importedData;
                    updateAllUI();
                    saveToCloud();
                    showSuccess('Données importées avec succès !');
                }
            } catch (error) {
                alert('Erreur lors de l\'import des données');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function resetData() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes vos données ?')) {
        const currentSyncCode = appState.syncCode;
        appState = {
            syncCode: currentSyncCode,
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
            currentMealType: 'breakfast',
            settings: {
                glassSize: 25,
                hydrationGoal: 200,
                apiKeys: {}
            }
        };
        
        updateAllUI();
        saveToCloud();
        showSuccess('Données réinitialisées !');
    }
}

// Modal functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Success message
function showSuccess(message) {
    const successEl = document.getElementById('successMessage');
    successEl.textContent = message;
    successEl.classList.add('show');
    
    setTimeout(() => {
        successEl.classList.remove('show');
    }, 3000);
}
