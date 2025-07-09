// ===================================
// NutriSync - Intégrations API
// ===================================

// Configuration des APIs
const API_CONFIG = {
    openFoodFacts: 'https://world.openfoodfacts.org/api/v0',
    openAI: 'https://api.openai.com/v1'
};

// ===================================
// SERVICE OPEN FOOD FACTS
// ===================================

async function searchOpenFoodFacts(query) {
    try {
        const response = await fetch(
            `${API_CONFIG.openFoodFacts}/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`
        );
        
        if (!response.ok) {
            throw new Error('Erreur de recherche');
        }
        
        const data = await response.json();
        
        if (data.products && data.products.length > 0) {
            return data.products.map(product => ({
                name: product.product_name || 'Produit sans nom',
                brand: product.brands || '',
                calories: product.nutriments?.['energy-kcal_100g'] || 0,
                proteins: product.nutriments?.proteins_100g || 0,
                carbs: product.nutriments?.carbohydrates_100g || 0,
                fats: product.nutriments?.fat_100g || 0,
                fiber: product.nutriments?.fiber_100g || 0,
                sugar: product.nutriments?.sugars_100g || 0,
                sodium: product.nutriments?.sodium_100g || 0,
                image: product.image_url
            }));
        }
        
        return [];
    } catch (error) {
        console.error('Erreur OpenFoodFacts:', error);
        return [];
    }
}

async function getProductByBarcode(barcode) {
    try {
        const response = await fetch(
            `${API_CONFIG.openFoodFacts}/product/${barcode}.json`
        );
        
        if (!response.ok) {
            throw new Error('Produit non trouvé');
        }
        
        const data = await response.json();
        
        if (data.status === 1 && data.product) {
            const product = data.product;
            return {
                name: product.product_name || 'Produit sans nom',
                brand: product.brands || '',
                calories: product.nutriments?.['energy-kcal_100g'] || 0,
                proteins: product.nutriments?.proteins_100g || 0,
                carbs: product.nutriments?.carbohydrates_100g || 0,
                fats: product.nutriments?.fat_100g || 0,
                fiber: product.nutriments?.fiber_100g || 0,
                sugar: product.nutriments?.sugars_100g || 0,
                sodium: product.nutriments?.sodium_100g || 0,
                image: product.image_url,
                nutriscore: product.nutriscore_grade
            };
        }
        
        return null;
    } catch (error) {
        console.error('Erreur recherche code-barres:', error);
        return null;
    }
}

// ===================================
// SERVICE OPENAI (si clé API configurée)
// ===================================

async function askOpenAI(message, apiKey) {
    if (!apiKey) {
        throw new Error('Clé API OpenAI non configurée');
    }
    
    try {
        const response = await fetch(`${API_CONFIG.openAI}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un coach nutritionnel expert. Donne des conseils personnalisés et motivants.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur OpenAI');
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Erreur OpenAI:', error);
        throw error;
    }
}

async function generateMealPlanWithAI(preferences, apiKey) {
    if (!apiKey) {
        throw new Error('Clé API OpenAI non configurée');
    }
    
    const prompt = `Génère un planning de repas pour une semaine avec ces préférences:
    - Calories par jour: ${preferences.calories}
    - Protéines: ${preferences.proteins}g
    - Objectif: ${preferences.goal}
    
    Format: Planning simple et réaliste avec des repas français.`;
    
    try {
        const response = await askOpenAI(prompt, apiKey);
        return response;
    } catch (error) {
        console.error('Erreur génération planning:', error);
        throw error;
    }
}

// ===================================
// SCANNER DE CODE-BARRES
// ===================================

class BarcodeScanner {
    constructor() {
        this.scanning = false;
        this.stream = null;
    }
    
    async start(videoElement, onDetected) {
        try {
            // Demander l'accès à la caméra
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            
            videoElement.srcObject = this.stream;
            this.scanning = true;
            
            // Utiliser l'API BarcodeDetector si disponible
            if ('BarcodeDetector' in window) {
                const barcodeDetector = new BarcodeDetector({
                    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
                });
                
                const detectLoop = async () => {
                    if (!this.scanning) return;
                    
                    try {
                        const barcodes = await barcodeDetector.detect(videoElement);
                        
                        if (barcodes.length > 0) {
                            onDetected(barcodes[0].rawValue);
                            this.stop();
                            return;
                        }
                    } catch (error) {
                        console.error('Erreur détection:', error);
                    }
                    
                    requestAnimationFrame(detectLoop);
                };
                
                detectLoop();
            } else {
                throw new Error('Scanner non supporté sur ce navigateur');
            }
        } catch (error) {
            console.error('Erreur caméra:', error);
            throw error;
        }
    }
    
    stop() {
        this.scanning = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}

// ===================================
// ANALYSE D'IMAGE (MOCK)
// ===================================

async function analyzeImage(file, apiKey) {
    // Dans une vraie application, vous utiliseriez l'API OpenAI Vision
    // Pour cette démo, nous retournons des données simulées
    
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                data: {
                    name: 'Assiette analysée',
                    calories: 450,
                    proteins: 25,
                    carbs: 45,
                    fats: 15,
                    items: [
                        'Poulet grillé (150g)',
                        'Riz blanc (100g)',
                        'Légumes vapeur (150g)'
                    ]
                }
            });
        }, 2000);
    });
}

// ===================================
// SYNCHRONISATION CLOUD
// ===================================

async function syncToCloud(syncCode, data) {
    try {
        // Utiliser JSONStorage ou un service similaire
        const response = await fetch(`https://api.jsonstorage.net/v1/json/${syncCode}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                lastSync: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur de synchronisation');
        }
        
        return { success: true };
    } catch (error) {
        console.error('Erreur sync:', error);
        return { success: false, error: error.message };
    }
}

async function loadFromCloud(syncCode) {
    try {
        const response = await fetch(`https://api.jsonstorage.net/v1/json/${syncCode}`);
        
        if (!response.ok) {
            throw new Error('Code non trouvé');
        }
        
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Erreur chargement:', error);
        return { success: false, error: error.message };
    }
}

// ===================================
// EXPORT DES FONCTIONS
// ===================================

// Rendre les fonctions disponibles globalement
window.searchOpenFoodFacts = searchOpenFoodFacts;
window.getProductByBarcode = getProductByBarcode;
window.askOpenAI = askOpenAI;
window.generateMealPlanWithAI = generateMealPlanWithAI;
window.BarcodeScanner = BarcodeScanner;
window.analyzeImage = analyzeImage;
window.syncToCloud = syncToCloud;
window.loadFromCloud = loadFromCloud;
