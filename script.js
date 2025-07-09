// ===================================
// NutriSync - Script Principal
// ===================================

// État de l'application
let appState = {
    syncCode: null,
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
    shoppingList: {
        fresh: [],
        protein: [],
        dairy: [],
        grains: [],
        pantry: [],
        other: []
    },
    settings: {
        apiKeys: {}
    }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Fonction d'initialisation principale
function initializeApp() {
    // Charger l'état sauvegardé
    loadState();
    
    // Générer ou récupérer le code de sync
    initializeSyncCode();
    
    // Mettre à jour la date
    updateCurrentDate();
    
    // Initialiser l'hydratation
    initializeHydration();
    
    // Mettre à jour le dashboard
    updateDashboard();
    
    // Sauvegarder automatiquement toutes les 30 secondes
    setInterval(saveState, 30000);
}

// Gestion du code de synchronisation
function initializeSyncCode() {
    let code = localStorage.getItem('nutriSyncCode');
    
    if (!code) {
        // Générer un nouveau code
        code = 'NUTRI-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        localStorage.setItem('nutriSyncCode', code);
    }
    
    appState.syncCode = code;
    document.getElementById('syncCode').textContent = code;
}

// Afficher/cacher info sync
function toggleSyncInfo() {
    const infoBox = document.getElementById('syncInfoBox');
    infoBox.classList.toggle('show');
}

// Copier le code de sync
function copySyncCode() {
    const code = appState.syncCode;
    navigator.clipboard.writeText(code).then(() => {
        showSuccess('Code copié !');
    });
}

// Afficher le modal de sync
function showSyncModal() {
    document.getElementById('syncModal').classList.add('active');
}

// Synchroniser avec un code existant
function syncWithCode() {
    const code = document.getElementById('existingSyncCode').value.trim().toUpperCase();
    
    if (!code || !code.startsWith('NUTRI-')) {
        showSuccess('Code invalide', 'error');
        return;
    }
    
    if (confirm('Cela remplacera toutes vos données actuelles. Continuer ?')) {
        // Ici vous pourriez charger les données depuis un serveur
        localStorage.setItem('nutriSyncCode', code);
        appState.syncCode = code;
        showSuccess('Synchronisation réussie !');
        closeModal('syncModal');
        location.reload();
    }
}

// Mettre à jour la date courante
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('fr-FR', options);
    document.getElementById('currentDate').textContent = today;
}

// Navigation entre les pages
function showPage(pageId) {
    // Cacher toutes les pages
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la page sélectionnée
    document.getElementById(pageId).classList.add('active');
    
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Sauvegarder l'état
    saveState();
}

// ===================================
// HYDRATATION
// ===================================

function initializeHydration() {
    const container = document.getElementById('hydrationGlasses');
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
    saveState();
}

function resetHydration() {
    appState.hydration.glasses = 0;
    initializeHydration();
    updateDashboard();
    saveState();
    showSuccess('Hydratation réinitialisée');
}

function updateHydrationStatus() {
    const totalCl = appState.hydration.glasses * appState.hydration.glassVolume;
    document.getElementById('hydrationStatus').textContent = 
        `${appState.hydration.glasses}/8 verres = ${totalCl}cl / ${appState.hydration.dailyGoal}cl`;
}

// ===================================
// DASHBOARD
// ===================================

function updateDashboard() {
    // Mettre à jour les calories
    document.getElementById('consumedCalories').textContent = appState.nutrition.calories;
    document.getElementById('remainingCalories').textContent = 
        Math.max(0, appState.nutrition.targetCalories - appState.nutrition.calories);
    
    // Mettre à jour les barres de progression
    updateProgressBar('calories', appState.nutrition.calories, appState.nutrition.targetCalories);
    updateProgressBar('proteins', appState.nutrition.proteins, appState.nutrition.targetProteins);
    updateProgressBar('hydration', 
        appState.hydration.glasses * appState.hydration.glassVolume, 
        appState.hydration.dailyGoal
    );
    
    // Mettre à jour les textes de progression
    document.getElementById('caloriesProgress').textContent = 
        `${appState.nutrition.calories} / ${appState.nutrition.targetCalories}`;
    document.getElementById('proteinsProgress').textContent = 
        `${appState.nutrition.proteins}g / ${appState.nutrition.targetProteins}g`;
    document.getElementById('hydrationProgress').textContent = 
        `${appState.hydration.glasses * appState.hydration.glassVolume}cl / ${appState.hydration.dailyGoal}cl`;
}

function updateProgressBar(type, current, target) {
    const percentage = Math.min((current / target) * 100, 100);
    const bar = document.getElementById(`${type}Bar`);
    if (bar) {
        bar.style.width = percentage + '%';
    }
}

function selectGoal(goal) {
    appState.user.goal = goal;
    
    // Mettre à jour l'UI
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });
    event.target.closest('.stat-card').classList.add('active');
    
    saveState();
}

// ===================================
// PROFIL
// ===================================

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

function calculateNeeds() {
    const gender = document.getElementById('gender').value;
    const age = parseInt(document.getElementById('age').value);
    const height = parseInt(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const activity = document.getElementById('activity').value;
    const goal = document.getElementById('goal').value;
    
    // Calcul du métabolisme de base (Mifflin-St Jeor)
    let bmr;
    if (gender === 'homme') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    // Multiplicateurs d'activité
    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        athlete: 1.9
    };
    
    let tdee = bmr * activityMultipliers[activity];
    
    // Ajustements selon l'objectif
    const goalAdjustments = {
        'cut': -500,
        'cut-moderate': -250,
        'maintenance': 0,
        'bulk-moderate': 250,
        'bulk': 500
    };
    
    const targetCalories = Math.round(tdee + goalAdjustments[goal]);
    
    // Calcul des macros
    const proteinCalories = (targetCalories * appState.user.proteinPercent) / 100;
    const fatCalories = (targetCalories * appState.user.fatPercent) / 100;
    const carbCalories = (targetCalories * appState.user.carbPercent) / 100;
    
    appState.nutrition.targetCalories = targetCalories;
    appState.nutrition.targetProteins = Math.round(proteinCalories / 4);
    appState.nutrition.targetFats = Math.round(fatCalories / 9);
    appState.nutrition.targetCarbs = Math.round(carbCalories / 4);
    
    // Mettre à jour l'UI
    document.getElementById('metabolicRate').textContent = Math.round(tdee);
    updateDashboard();
    
    showSuccess(`Besoins calculés: ${targetCalories} kcal/jour`);
}

function saveProfile() {
    // Sauvegarder les valeurs du profil
    appState.user.gender = document.getElementById('gender').value;
    appState.user.age = parseInt(document.getElementById('age').value);
    appState.user.height = parseInt(document.getElementById('height').value);
    appState.user.weight = parseFloat(document.getElementById('weight').value);
    appState.user.activity = document.getElementById('activity').value;
    appState.user.goal = document.getElementById('goal').value;
    
    saveState();
    showSuccess('Profil sauvegardé !');
}

// ===================================
// ALIMENTS
// ===================================

function searchFood() {
    const query = document.getElementById('foodSearchInput').value.trim();
    
    if (!query) {
        showSuccess('Veuillez entrer un nom d\'aliment', 'error');
        return;
    }
    
    // Ici vous appelleriez votre API
    // Pour l'exemple, nous affichons des résultats fictifs
    const mockResults = [
        { name: 'Poulet grillé', calories: 165, proteins: 31, carbs: 0, fats: 3.6 },
        { name: 'Riz blanc cuit', calories: 130, proteins: 2.7, carbs: 28, fats: 0.3 },
        { name: 'Brocoli cuit', calories: 35, proteins: 2.4, carbs: 7, fats: 0.4 }
    ];
    
    displaySearchResults(mockResults);
    showSuccess('Recherche terminée');
}

function displaySearchResults(results) {
    const resultsDiv = document.getElementById('searchResults');
    const resultsList = document.getElementById('searchResultsList');
    
    resultsList.innerHTML = '';
    
    results.forEach(food => {
        const resultItem = document.createElement('div');
        resultItem.style.cssText = 'padding: 15px; background: white; margin-bottom: 10px; border-radius: 8px; cursor: pointer; border: 1px solid #e0e0e0;';
        resultItem.innerHTML = `
            <h4>${food.name}</h4>
            <p>Pour 100g: ${food.calories} kcal | P: ${food.proteins}g | G: ${food.carbs}g | L: ${food.fats}g</p>
        `;
        resultItem.onclick = () => addFood(food);
        resultsList.appendChild(resultItem);
    });
    
    resultsDiv.style.display = 'block';
}

function addFood(food) {
    const quantity = prompt('Quantité en grammes:', '100');
    if (!quantity || isNaN(quantity)) return;
    
    const factor = parseFloat(quantity) / 100;
    
    // Ajouter aux totaux du jour
    appState.nutrition.calories += Math.round(food.calories * factor);
    appState.nutrition.proteins += Math.round(food.proteins * factor);
    appState.nutrition.carbs += Math.round(food.carbs * factor);
    appState.nutrition.fats += Math.round(food.fats * factor);
    
    // Ajouter à la liste des repas
    appState.meals.push({
        name: food.name,
        quantity: parseFloat(quantity),
        calories: Math.round(food.calories * factor),
        proteins: Math.round(food.proteins * factor),
        carbs: Math.round(food.carbs * factor),
        fats: Math.round(food.fats * factor),
        time: new Date().toLocaleTimeString()
    });
    
    updateDashboard();
    updateTodayMeals();
    saveState();
    
    showSuccess(`${food.name} ajouté !`);
}

function updateTodayMeals() {
    const mealsDiv = document.getElementById('todayMeals');
    
    if (appState.meals.length === 0) {
        mealsDiv.innerHTML = `
            <p>Aucun repas ajouté</p>
            <button class="btn btn-primary" onclick="showPage('foods')">
                Ajouter un repas
            </button>
        `;
    } else {
        let html = '<div style="max-height: 300px; overflow-y: auto;">';
        
        appState.meals.forEach((meal, index) => {
            html += `
                <div style="padding: 15px; background: #f5f5f5; margin-bottom: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${meal.name}</strong> (${meal.quantity}g)
                        <br>
                        <small>${meal.calories} kcal | P: ${meal.proteins}g | G: ${meal.carbs}g | L: ${meal.fats}g</small>
                        <br>
                        <small style="color: #666;">${meal.time}</small>
                    </div>
                    <button onclick="removeMeal(${index})" style="background: #ff5252; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">×</button>
                </div>
            `;
        });
        
        html += '</div>';
        mealsDiv.innerHTML = html;
    }
}

function removeMeal(index) {
    const meal = appState.meals[index];
    
    // Soustraire des totaux
    appState.nutrition.calories -= meal.calories;
    appState.nutrition.proteins -= meal.proteins;
    appState.nutrition.carbs -= meal.carbs;
    appState.nutrition.fats -= meal.fats;
    
    // Supprimer de la liste
    appState.meals.splice(index, 1);
    
    updateDashboard();
    updateTodayMeals();
    saveState();
    
    showSuccess('Repas supprimé');
}

function showAddFoodModal() {
    document.getElementById('addFoodModal').classList.add('active');
}

function addCustomFood() {
    const name = document.getElementById('foodName').value;
    const quantity = parseFloat(document.getElementById('foodQuantity').value);
    const calories = parseFloat(document.getElementById('foodCalories').value);
    const proteins = parseFloat(document.getElementById('foodProteins').value);
    const carbs = parseFloat(document.getElementById('foodCarbs').value);
    const fats = parseFloat(document.getElementById('foodFats').value);
    
    if (!name || !quantity) {
        showSuccess('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    const food = {
        name: name,
        calories: calories || 0,
        proteins: proteins || 0,
        carbs: carbs || 0,
        fats: fats || 0
    };
    
    // Fermer le modal
    closeModal('addFoodModal');
    
    // Ajouter l'aliment avec la quantité spécifiée
    const factor = quantity / 100;
    
    appState.nutrition.calories += Math.round(food.calories * factor);
    appState.nutrition.proteins += Math.round(food.proteins * factor);
    appState.nutrition.carbs += Math.round(food.carbs * factor);
    appState.nutrition.fats += Math.round(food.fats * factor);
    
    appState.meals.push({
        name: food.name,
        quantity: quantity,
        calories: Math.round(food.calories * factor),
        proteins: Math.round(food.proteins * factor),
        carbs: Math.round(food.carbs * factor),
        fats: Math.round(food.fats * factor),
        time: new Date().toLocaleTimeString()
    });
    
    updateDashboard();
    updateTodayMeals();
    saveState();
    
    // Réinitialiser le formulaire
    document.getElementById('foodName').value = '';
    document.getElementById('foodQuantity').value = '100';
    document.getElementById('foodCalories').value = '';
    document.getElementById('foodProteins').value = '';
    document.getElementById('foodCarbs').value = '';
    document.getElementById('foodFats').value = '';
    
    showSuccess(`${name} ajouté !`);
}

function startBarcodeScanner() {
    showSuccess('Scanner non disponible dans cette démo', 'error');
}

function analyzeFood(event) {
    showSuccess('Analyse photo non disponible dans cette démo', 'error');
}

// ===================================
// ANALYTICS
// ===================================

function addWeightEntry() {
    const weight = parseFloat(document.getElementById('newWeight').value);
    
    if (!weight || isNaN(weight)) {
        showSuccess('Veuillez entrer un poids valide', 'error');
        return;
    }
    
    appState.weightHistory.push({
        date: new Date().toISOString().split('T')[0],
        weight: weight
    });
    
    // Mettre à jour le poids actuel
    appState.user.weight = weight;
    document.getElementById('weight').value = weight;
    
    saveState();
    showSuccess('Poids enregistré !');
    
    // Vider le champ
    document.getElementById('newWeight').value = '';
}

function exportPDF() {
    showSuccess('Export PDF en cours de développement', 'error');
}

function exportCSV() {
    let csv = 'Date,Repas,Quantité,Calories,Protéines,Glucides,Lipides\n';
    
    appState.meals.forEach(meal => {
        csv += `${new Date().toLocaleDateString()},${meal.name},${meal.quantity}g,${meal.calories},${meal.proteins},${meal.carbs},${meal.fats}\n`;
    });
    
    downloadFile(csv, 'nutrisync_export.csv', 'text/csv');
    showSuccess('Export CSV réussi !');
}

function exportJSON() {
    const data = JSON.stringify(appState, null, 2);
    downloadFile(data, 'nutrisync_data.json', 'application/json');
    showSuccess('Export JSON réussi !');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===================================
// CHAT IA
// ===================================

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Ajouter le message de l'utilisateur
    addChatMessage(message, 'user');
    input.value = '';
    
    // Réponse simulée
    setTimeout(() => {
        const responses = [
            "D'après votre profil, je recommande d'augmenter votre apport en protéines.",
            "Pour atteindre votre objectif, maintenez un déficit calorique de 500 kcal/jour.",
            "N'oubliez pas de boire au moins 2L d'eau par jour !",
            "Privilégiez les glucides complexes autour de vos entraînements."
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
    const name = sender === 'ai' ? 'Coach IA' : 'Vous';
    
    messageDiv.innerHTML = `
        <p><strong>${icon} ${name}</strong></p>
        <p>${message}</p>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function askQuestion(question) {
    document.getElementById('chatInput').value = question;
    sendMessage();
}

// Ajouter l'événement Enter pour le chat
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

// ===================================
// PLANNING
// ===================================

function generateWeekPlan() {
    showSuccess('Génération du planning en cours...');
    
    // Simuler la génération
    setTimeout(() => {
        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        const meals = ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner'];
        
        let planHTML = '<h3>📅 Votre planning de la semaine</h3>';
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
                        <span style="color: #666;">Repas équilibré généré</span>
                    </div>
                `;
            });
            
            planHTML += `
                    </div>
                </div>
            `;
        });
        
        planHTML += '</div>';
        planHTML += `
            <button class="btn btn-primary" style="margin-top: 20px;" onclick="generateShoppingListFromPlan()">
                🛒 Générer la liste de courses
            </button>
        `;
        
        document.getElementById('weekPlan').innerHTML = planHTML;
        document.getElementById('weekPlan').style.display = 'block';
        
        appState.weekPlan = { generated: true };
        saveState();
        showSuccess('Planning généré !');
    }, 2000);
}

function generateShoppingListFromPlan() {
    showPage('shopping');
    setTimeout(() => generateShoppingList(), 500);
}

// ===================================
// LISTE DE COURSES
// ===================================

function generateShoppingList() {
    if (!appState.weekPlan) {
        showSuccess('Créez d\'abord un planning de repas', 'error');
        return;
    }
    
    showSuccess('Génération de la liste en cours...');
    
    // Simuler la génération
    setTimeout(() => {
        // Réinitialiser la liste
        appState.shoppingList = {
            fresh: [
                { name: 'Tomates', quantity: 1, unit: 'kg', price: 2.99 },
                { name: 'Brocoli', quantity: 500, unit: 'g', price: 3.50 },
                { name: 'Bananes', quantity: 6, unit: 'pcs', price: 2.50 }
            ],
            protein: [
                { name: 'Poulet', quantity: 1.5, unit: 'kg', price: 12.99 },
                { name: 'Oeufs', quantity: 12, unit: 'pcs', price: 3.99 }
            ],
            dairy: [
                { name: 'Yaourt grec', quantity: 4, unit: 'pcs', price: 4.50 },
                { name: 'Lait', quantity: 1, unit: 'l', price: 1.59 }
            ],
            grains: [
                { name: 'Riz complet', quantity: 1, unit: 'kg', price: 2.99 },
                { name: 'Flocons d\'avoine', quantity: 500, unit: 'g', price: 1.99 }
            ],
            pantry: [
                { name: 'Huile d\'olive', quantity: 1, unit: 'l', price: 8.99 }
            ],
            other: []
        };
        
        displayShoppingList();
        document.getElementById('shoppingListContainer').style.display = 'block';
        document.getElementById('emptyShoppingList').style.display = 'none';
        
        saveState();
        showSuccess('Liste générée !');
    }, 1500);
}

function displayShoppingList() {
    const container = document.getElementById('shoppingListContainer');
    container.innerHTML = '';
    
    const categories = {
        fresh: '🥬 Fruits & Légumes',
        protein: '🥩 Protéines',
        dairy: '🥛 Produits Laitiers',
        grains: '🌾 Féculents',
        pantry: '🥫 Épicerie',
        other: '📦 Autres'
    };
    
    let totalPrice = 0;
    let totalItems = 0;
    
    Object.entries(appState.shoppingList).forEach(([category, items]) => {
        if (items.length > 0) {
            const section = document.createElement('div');
            section.style.cssText = 'background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);';
            
            section.innerHTML = `<h3 style="margin-bottom: 15px;">${categories[category]}</h3>`;
            
            items.forEach((item, index) => {
                totalPrice += item.price || 0;
                totalItems++;
                
                section.innerHTML += `
                    <div style="display: flex; align-items: center; padding: 10px; background: #f5f5f5; margin-bottom: 10px; border-radius: 8px;">
                        <input type="checkbox" style="margin-right: 15px;">
                        <div style="flex: 1;">
                            <strong>${item.name}</strong>
                            <small style="color: #666;"> - ${item.quantity} ${item.unit}</small>
                        </div>
                        <span style="color: #4caf50; font-weight: bold;">${(item.price || 0).toFixed(2)}€</span>
                    </div>
                `;
            });
            
            container.appendChild(section);
        }
    });
    
    // Ajouter le total
    const totalSection = document.createElement('div');
    totalSection.style.cssText = 'background: #7c3aed; color: white; padding: 20px; border-radius: 15px; margin-top: 20px; text-align: center;';
    totalSection.innerHTML = `
        <h3>Total estimé: ${totalPrice.toFixed(2)}€</h3>
        <p>${totalItems} articles</p>
    `;
    container.appendChild(totalSection);
    
    // Ajouter les boutons d'action
    const actionsSection = document.createElement('div');
    actionsSection.style.cssText = 'display: flex; gap: 10px; margin-top: 20px;';
    actionsSection.innerHTML = `
        <button class="btn btn-primary" onclick="exportShoppingList()">📱 Exporter</button>
        <button class="btn btn-success" onclick="printShoppingList()">🖨️ Imprimer</button>
    `;
    container.appendChild(actionsSection);
}

function showAddItemModal() {
    document.getElementById('addItemModal').classList.add('active');
}

function addShoppingItem() {
    const name = document.getElementById('itemName').value;
    const quantity = parseFloat(document.getElementById('itemQuantity').value);
    const unit = document.getElementById('itemUnit').value;
    const category = document.getElementById('itemCategory').value;
    
    if (!name || !quantity) {
        showSuccess('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    appState.shoppingList[category].push({
        name: name,
        quantity: quantity,
        unit: unit,
        price: 0
    });
    
    displayShoppingList();
    document.getElementById('shoppingListContainer').style.display = 'block';
    document.getElementById('emptyShoppingList').style.display = 'none';
    
    closeModal('addItemModal');
    
    // Réinitialiser le formulaire
    document.getElementById('itemName').value = '';
    document.getElementById('itemQuantity').value = '1';
    
    saveState();
    showSuccess('Article ajouté !');
}

function exportShoppingList() {
    let text = '🛒 LISTE DE COURSES\n\n';
    
    const categories = {
        fresh: '🥬 Fruits & Légumes',
        protein: '🥩 Protéines',
        dairy: '🥛 Produits Laitiers',
        grains: '🌾 Féculents',
        pantry: '🥫 Épicerie',
        other: '📦 Autres'
    };
    
    Object.entries(appState.shoppingList).forEach(([category, items]) => {
        if (items.length > 0) {
            text += `${categories[category]}\n`;
            items.forEach(item => {
                text += `☐ ${item.name} - ${item.quantity} ${item.unit}\n`;
            });
            text += '\n';
        }
    });
    
    downloadFile(text, 'liste_courses.txt', 'text/plain');
    showSuccess('Liste exportée !');
}

function printShoppingList() {
    window.print();
}

// ===================================
// PARAMÈTRES
// ===================================

function saveSettings() {
    const openaiKey = document.getElementById('openaiKey').value;
    
    if (openaiKey) {
        appState.settings.apiKeys.openai = openaiKey;
    }
    
    saveState();
    showSuccess('Paramètres sauvegardés !');
}

function exportData() {
    const data = JSON.stringify(appState, null, 2);
    downloadFile(data, 'nutrisync_backup.json', 'application/json');
    showSuccess('Données exportées !');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                appState = data;
                saveState();
                location.reload();
            } catch (error) {
                showSuccess('Erreur lors de l\'import', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function resetApp() {
    if (confirm('Êtes-vous sûr de vouloir tout réinitialiser ?')) {
        localStorage.clear();
        location.reload();
    }
}

// ===================================
// UTILITAIRES
// ===================================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showSuccess(message, type = 'success') {
    const successEl = document.getElementById('successMessage');
    successEl.textContent = message;
    
    // Définir la couleur selon le type
    if (type === 'error') {
        successEl.style.background = '#f44336';
    } else {
        successEl.style.background = '#4caf50';
    }
    
    successEl.classList.add('show');
    
    setTimeout(() => {
        successEl.classList.remove('show');
    }, 3000);
}

// ===================================
// SAUVEGARDE ET CHARGEMENT
// ===================================

function saveState() {
    try {
        localStorage.setItem('nutriSyncState', JSON.stringify(appState));
    } catch (error) {
        console.error('Erreur de sauvegarde:', error);
    }
}

function loadState() {
    try {
        const savedState = localStorage.getItem('nutriSyncState');
        if (savedState) {
            const state = JSON.parse(savedState);
            appState = { ...appState, ...state };
            
            // Mettre à jour l'UI avec les données chargées
            if (appState.user) {
                document.getElementById('gender').value = appState.user.gender || 'homme';
                document.getElementById('age').value = appState.user.age || 31;
                document.getElementById('height').value = appState.user.height || 180;
                document.getElementById('weight').value = appState.user.weight || 96;
                document.getElementById('goal').value = appState.user.goal || 'cut';
                document.getElementById('activity').value = appState.user.activity || 'light';
                document.getElementById('proteinSlider').value = appState.user.proteinPercent || 30;
                document.getElementById('fatSlider').value = appState.user.fatPercent || 25;
            }
            
            updateMacros();
            updateTodayMeals();
        }
    } catch (error) {
        console.error('Erreur de chargement:', error);
    }
}
