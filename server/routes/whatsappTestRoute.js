import express from 'express';
import { sendWhatsAppMessage } from '../configs/whatsapp.js';
import { formatOrderMessage, formatDeliveryNotification, formatDeliveryConfirmation } from '../utils/orderMessages.js';
import orderModel from '../models/orderModel.js';

const router = express.Router();

/**
 * Test endpoint to send a simple WhatsApp message
 * POST /api/whatsapp-test/simple
 */
router.post('/simple', async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.json({
                success: false,
                message: "Phone and message are required",
            });
        }

        const result = await sendWhatsAppMessage({
            phone,
            message,
        });

        return res.json(result);
    } catch (error) {
        return res.json({
            success: false,
            message: error.message,
        });
    }
});

/**
 * Test endpoint to send an order notification
 * POST /api/whatsapp-test/order-notification/:orderId
 */
router.post('/order-notification/:orderId', async (req, res) => {
    try {
        const { phone } = req.body;
        const { orderId } = req.params;

        if (!phone) {
            return res.json({
                success: false,
                message: "Phone number is required",
            });
        }

        // Fetch the order
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({
                success: false,
                message: "Order not found",
            });
        }

        // Format and send the order message
        const message = formatOrderMessage(order);
        const result = await sendWhatsAppMessage({
            phone,
            message,
        });

        return res.json(result);
    } catch (error) {
        return res.json({
            success: false,
            message: error.message,
        });
    }
});

/**
 * Test endpoint to send a delivery notification
 * POST /api/whatsapp-test/delivery-notification/:orderId
 */
router.post('/delivery-notification/:orderId', async (req, res) => {
    try {
        const { phone } = req.body;
        const { orderId } = req.params;

        if (!phone) {
            return res.json({
                success: false,
                message: "Phone number is required",
            });
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({
                success: false,
                message: "Order not found",
            });
        }

        const message = formatDeliveryNotification(order);
        const result = await sendWhatsAppMessage({
            phone,
            message,
        });

        return res.json(result);
    } catch (error) {
        return res.json({
            success: false,
            message: error.message,
        });
    }
});

/**
 * Test endpoint to send a delivery confirmation
 * POST /api/whatsapp-test/delivery-confirmation/:orderId
 */
router.post('/delivery-confirmation/:orderId', async (req, res) => {
    try {
        const { phone } = req.body;
        const { orderId } = req.params;

        if (!phone) {
            return res.json({
                success: false,
                message: "Phone number is required",
            });
        }

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({
                success: false,
                message: "Order not found",
            });
        }

        const message = formatDeliveryConfirmation(order);
        const result = await sendWhatsAppMessage({
            phone,
            message,
        });

        return res.json(result);
    } catch (error) {
        return res.json({
            success: false,
            message: error.message,
        });
    }
});

/**
 * Health check endpoint
 * GET /api/whatsapp-test/health
 */
router.get('/health', (req, res) => {
    const service = process.env.WHATSAPP_SERVICE || 'twilio';
    const isConfigured = (() => {
        if (service === 'twilio') {
            return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
        } else if (service === 'meta') {
            return !!(process.env.META_PHONE_NUMBER_ID && process.env.META_WHATSAPP_ACCESS_TOKEN);
        } else if (service === 'web') {
            return !!process.env.WHATSAPP_API_URL;
        }
        return false;
    })();

    res.json({
        success: true,
        service,
        isConfigured,
        message: isConfigured
            ? `✅ WhatsApp service (${service}) is configured`
            : `❌ WhatsApp service (${service}) is not properly configured`,
    });
});

export default router;
