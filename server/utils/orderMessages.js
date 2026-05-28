/**
 * Format order details for WhatsApp message
 */
export const formatOrderMessage = (order) => {
    const items = order.items
        .map((item) => `• ${item.product.name} (x${item.quantity})`)
        .join("\n");

    const message = `
━━━━━━━━━━━━━━━━━━━━━━━━
✅ *NOUVELLE COMMANDE REÇUE*
━━━━━━━━━━━━━━━━━━━━━━━━

📦 *ID Commande:* #${order._id.toString().slice(-8).toUpperCase()}

🛍️ *Produits:*
${items}

💰 *Total Commande:* FCFA ${order.amount.toLocaleString()}
   - Articles: FCFA ${(order.amount - order.deliveryFee).toLocaleString()}
   - Livraison: FCFA ${order.deliveryFee.toLocaleString()}

📍 *Lieu de Livraison:*
${order.address?.street || "N/A"}, ${order.address?.city || "N/A"}
${order.address?.phone || ""}

💳 *Mode de Paiement:* ${order.paymentMethod}

🚚 *Statut:* ${order.status}

━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ Commande passée le: ${new Date(order.date).toLocaleString("fr-CM")}
━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    return message;
};

/**
 * Format delivery notification
 */
export const formatDeliveryNotification = (order) => {
    return `
✅ *VOTRE COMMANDE EST EN ROUTE*

📦 Commande #${order._id.toString().slice(-8).toUpperCase()}
🏍️ Livreur en route vers vous
⏱️ Temps estimé: 30-45 minutes

Numéro du livreur: ${order.riderId?.phone || "N/A"}
    `.trim();
};

/**
 * Format delivery confirmation
 */
export const formatDeliveryConfirmation = (order) => {
    return `
✅ *COMMANDE LIVRÉE AVEC SUCCÈS*

📦 Commande #${order._id.toString().slice(-8).toUpperCase()}
✅ Livrée le: ${new Date(order.deliveredAt).toLocaleString("fr-CM")}

Merci d'avoir choisi notre service! 🙏

Avez-vous des questions? Répondez à ce message.
    `.trim();
};
