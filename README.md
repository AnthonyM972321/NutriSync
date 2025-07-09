# NutriSync 🥗

Application de suivi nutritionnel avec intelligence artificielle.

## 🚀 Installation

### Méthode 1 : Utilisation directe

1. Téléchargez tous les fichiers
2. Ouvrez `index.html` dans votre navigateur
3. C'est prêt !

### Méthode 2 : Avec un serveur local

```bash
# Si vous avez Python
python -m http.server 8000

# Ou avec Node.js
npx http-server
```

Puis ouvrez http://localhost:8000

## 📱 Installation sur mobile

1. Ouvrez l'application dans Chrome ou Safari
2. Cliquez sur le menu (3 points)
3. Sélectionnez "Ajouter à l'écran d'accueil"

## ✨ Fonctionnalités

- **Dashboard complet** : Suivi calories, protéines, hydratation
- **Calcul automatique** : Besoins nutritionnels personnalisés
- **Recherche d'aliments** : Base de données Open Food Facts
- **Planning de repas** : Génération automatique
- **Liste de courses** : Créée depuis votre planning
- **Analytics** : Graphiques et export de données
- **Chat IA** : Conseils personnalisés (nécessite clé OpenAI)
- **Synchronisation** : Code unique pour tous vos appareils

## 🔧 Configuration

### Clé API OpenAI (optionnelle)

Pour activer le chat IA :

1. Allez dans Paramètres
2. Entrez votre clé API OpenAI
3. Sauvegardez

Obtenez une clé sur : https://platform.openai.com/api-keys

## 📊 Utilisation

### 1. Configuration initiale

- Allez dans **Profil**
- Entrez vos informations (âge, poids, taille, etc.)
- Cliquez sur **Calculer mes besoins**

### 2. Ajouter des aliments

- Allez dans **Aliments**
- Recherchez ou scannez un code-barres
- Ou ajoutez manuellement

### 3. Créer un planning

- Allez dans **Planning**
- Cliquez sur **Générer mon planning**

### 4. Générer la liste de courses

- Allez dans **Courses**
- Cliquez sur **Générer la liste**

## 💾 Sauvegarde

Vos données sont :
- Sauvegardées automatiquement en local
- Synchronisables avec votre code unique
- Exportables en JSON/CSV

## 🔐 Sécurité

- Toutes les données restent sur votre appareil
- Aucun tracking ou publicité
- Clés API stockées localement

## 🐛 Résolution de problèmes

### L'application ne se charge pas

Vérifiez que tous les fichiers sont présents :
- index.html
- styles.css
- script.js
- integrations.js
- manifest.json

### Les données ne se sauvegardent pas

Vérifiez que votre navigateur autorise le localStorage.

### Le scanner ne fonctionne pas

Le scanner nécessite HTTPS ou localhost.

## 📄 License

MIT - Utilisez librement !

## 👨‍💻 Auteur

Créé avec ❤️ par Anthony

---

**Besoin d'aide ?** Ouvrez une issue sur GitHub !
