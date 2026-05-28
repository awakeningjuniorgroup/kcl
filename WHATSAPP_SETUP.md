# =====================================================

# 🚀 WHATSAPP INTEGRATION SETUP GUIDE

# =====================================================

## 📋 Table des matières

1. [Configuration Twilio (Recommandée)](#twilio)
2. [Configuration Meta WhatsApp Business API](#meta)
3. [Configuration WhatsApp Web (Gratuit)](#web)
4. [Tester l'intégration](#test)

---

## <a name="twilio"></a>1️⃣ CONFIGURATION TWILIO (Recommandée pour Production)

### Étape 1: Créer un compte Twilio

1. Allez sur [https://www.twilio.com](https://www.twilio.com)
2. Cliquez sur **"Sign up"**
3. Remplissez le formulaire avec vos informations
4. Vérifiez votre email

### Étape 2: Configurer WhatsApp Sandbox

1. Accédez à **Console → Phone Numbers → Manage**
2. Cherchez **"Try it out"** → **WhatsApp Sandbox**
3. Vous verrez un numéro Twilio (ex: `+1415223456789`)
4. Envoyez `join bright-morning` au numéro Twilio via WhatsApp
5. Twilio vous confirmera que vous êtes connecté

### Étape 3: Obtenir les Credentials

1. Allez à **Account Settings** (coin supérieur droit)
2. Copiez votre **Account SID** (commence par `AC...`)
3. Copiez votre **Auth Token**
4. Le numéro Twilio WhatsApp sandbox est votre `TWILIO_WHATSAPP_NUMBER`

### Étape 4: Ajouter au .env

```env
# Twilio Configuration
WHATSAPP_SERVICE=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+1415223456789

# Votre numéro d'admin (où recevoir les notifications)
ADMIN_WHATSAPP_NUMBER=+237690316394
```

### Étape 5: Installer le package

```bash
cd server
npm install axios
```

---

## <a name="meta"></a>2️⃣ CONFIGURATION META WHATSAPP BUSINESS API

### Avantage

- Numéro de téléphone professionnel
- Branding personnalisé
- Meilleure scalabilité

### Étape 1: Créer un compte Meta

1. Allez sur [https://www.meta.com/fr/](https://www.meta.com/fr/)
2. Connectez-vous avec votre compte Facebook
3. Allez à **Business Suite** → **Settings** → **WhatsApp**

### Étape 2: Obtenir un Numéro WhatsApp Business

1. Suivez les étapes de configuration
2. Connectez un numéro de téléphone professionnel
3. Attendez l'approbation (24-48 heures)

### Étape 3: Générer un Access Token

1. Allez à **Developers** → **My Apps**
2. Sélectionnez votre application
3. Générez un **Access Token**
4. Copiez votre **Phone Number ID**

### Étape 4: Ajouter au .env

```env
# Meta WhatsApp Configuration
WHATSAPP_SERVICE=meta
META_PHONE_NUMBER_ID=104320205435435
META_WHATSAPP_ACCESS_TOKEN=EAAbxxxxxxxxxxxxxx

ADMIN_WHATSAPP_NUMBER=+237690316394
```

---

## <a name="web"></a>3️⃣ CONFIGURATION WHATSAPP WEB (Gratuit mais Plus Complexe)

### ⚠️ Avantage & Inconvénient

- ✅ Gratuit (pas de frais mensuels)
- ❌ Moins fiable, peut être bloqué par WhatsApp
- ❌ Nécessite une instance séparée

### Étape 1: Installer WhatsApp Web API

```bash
# Dans un dossier séparé
mkdir whatsapp-api
cd whatsapp-api
npm init -y
npm install whatsapp-web.js express axios
```

### Étape 2: Créer le serveur API

```javascript
// whatsapp-api/server.js
import { Client, LocalAuth } from "whatsapp-web.js";
import express from "express";
import qrcode from "qrcode-terminal";

const app = express();
app.use(express.json());

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("ready", () => console.log("✅ WhatsApp Web connecté!"));
client.on("qr", (qr) => {
  console.log("📱 Scannez ce QR Code avec WhatsApp:");
  qrcode.generate(qr, { small: true });
});

app.post("/send-message", async (req, res) => {
  const { phone, message } = req.body;
  try {
    const chatId = `${phone}@c.us`;
    await client.sendMessage(chatId, message);
    res.json({ success: true, messageId: Date.now() });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

client.initialize();
app.listen(3001, () => console.log("WhatsApp API sur port 3001"));
```

### Étape 3: Ajouter au .env principal

```env
# WhatsApp Web Configuration
WHATSAPP_SERVICE=web
WHATSAPP_API_URL=http://localhost:3001

ADMIN_WHATSAPP_NUMBER=+237690316394
```

---

## <a name="test"></a>🧪 TESTER L'INTÉGRATION

### Option 1: Via la console

```bash
# Terminal 1 - Démarrer le serveur
cd server
npm run server

# Terminal 2 - Envoyer un test
node -e "
import { sendWhatsAppMessage } from './configs/whatsapp.js';
sendWhatsAppMessage({
    phone: '+237690316394',
    message: '✅ Test WhatsApp Integration'
}).then(r => console.log(r));
"
```

### Option 2: Créer une route de test

Ajoutez ceci dans `server/routes/testRoute.js`:

```javascript
import express from "express";
import { sendWhatsAppMessage } from "../configs/whatsapp.js";
import { formatOrderMessage } from "../utils/orderMessages.js";

const router = express.Router();

router.post("/test-whatsapp", async (req, res) => {
  try {
    const { phone, message } = req.body;
    const result = await sendWhatsAppMessage({
      phone: phone || process.env.ADMIN_WHATSAPP_NUMBER,
      message: message || "Test message - Intégration WhatsApp fonctionne! ✅",
    });
    res.json(result);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

export default router;
```

Puis appelez dans `server.js`:

```javascript
import testRoute from "./routes/testRoute.js";
app.use("/api/test", testRoute);
```

Testez avec curl:

```bash
curl -X POST http://localhost:5000/api/test/test-whatsapp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+237690316394", "message": "Test Message"}'
```

---

## 📋 STRUCTURE DES MESSAGES ENVOYÉS

### 1. À la création d'une commande (Admin)

```
━━━━━━━━━━━━━━━━━━━━━━━━
✅ *NOUVELLE COMMANDE REÇUE*
━━━━━━━━━━━━━━━━━━━━━━━━

📦 *ID Commande:* #A1B2C3D4
🛍️ *Produits:*
• Tomate (x2)
• Huile de palme (x1)

💰 *Total Commande:* FCFA 45,000
   - Articles: FCFA 40,000
   - Livraison: FCFA 5,000

📍 *Lieu de Livraison:*
Rue principale, Yaoundé
+237690316394
```

### 2. Confirmation au client

```
✅ Votre commande #A1B2C3D4 a été reçue!

💰 Total: FCFA 45,000

Vous recevrez une notification quand elle sera en route.
```

---

## ⚙️ CONFIGURATION AVANCÉE

### Envoyer à plusieurs numéros

Modifiez `server/controllers/orderController.js`:

```javascript
const adminNumbers = [
  process.env.ADMIN_WHATSAPP_NUMBER,
  process.env.SECONDARY_ADMIN_NUMBER,
];

for (const number of adminNumbers) {
  if (number) {
    await sendWhatsAppMessage({
      phone: number,
      message: formatOrderMessage(newOrder),
    });
  }
}
```

### Envoyer des images

Modifiez `server/configs/whatsapp.js`:

```javascript
export const sendWhatsAppWithImage = async (options) => {
  // Pour Twilio: ajouter MediaUrl
  // Pour Meta: utiliser type: "image"
  // Voir les docs officielles pour plus de détails
};
```

---

## 🐛 TROUBLESHOOTING

### "Twilio credentials missing"

- Vérifiez que les variables .env sont présentes
- Redémarrez le serveur (`npm run server`)

### "Invalid phone number"

- Assurez-vous que le numéro inclut le code pays
- Format: `+237690316394` (pas `0690316394`)

### "Message not sent"

- Vérifiez que le numéro a joiné le sandbox Twilio
- Pour Meta, vérifiez que le numéro est approuvé

### WhatsApp Web bloqué

- WhatsApp peut bloquer les envois en masse
- Utilisez Twilio ou Meta pour production

---

## 📞 SUPPORT

- **Twilio Docs**: https://www.twilio.com/docs/whatsapp
- **Meta WhatsApp Docs**: https://developers.facebook.com/docs/whatsapp
- **WhatsApp Web.js**: https://wwebjs.dev/
