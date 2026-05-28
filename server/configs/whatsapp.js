import axios from "axios";

/**
 * WhatsApp Integration using Twilio
 * 
 * Setup:
 * 1. Sign up at https://www.twilio.com
 * 2. Get a WhatsApp-enabled phone number
 * 3. Add your number to environment variables
 * 4. Install: npm install twilio axios
 */

// Option 1: Using Twilio (Recommended)
export const sendWhatsAppViaTwilio = async (options) => {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., whatsapp:+1234567890
        
        if (!accountSid || !authToken || !fromNumber) {
            console.error("❌ Twilio credentials missing in .env");
            return { success: false, message: "WhatsApp not configured" };
        }

        const toNumber = `whatsapp:+${options.phone.replace(/\D/g, '')}`; // Ensure proper format

        const response = await axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
                From: fromNumber,
                To: toNumber,
                Body: options.message,
            },
            {
                auth: {
                    username: accountSid,
                    password: authToken,
                },
            }
        );

        console.log("✅ WhatsApp sent via Twilio:", response.data.sid);
        return { success: true, messageId: response.data.sid };
    } catch (error) {
        console.error("❌ Twilio WhatsApp Error:", error.response?.data || error.message);
        return { success: false, message: error.message };
    }
};

// Option 2: Using Meta WhatsApp Business API (Alternative)
export const sendWhatsAppViaMeta = async (options) => {
    try {
        const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
        const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

        if (!phoneNumberId || !accessToken) {
            console.error("❌ Meta WhatsApp credentials missing in .env");
            return { success: false, message: "WhatsApp not configured" };
        }

        const phone = options.phone.replace(/\D/g, '');
        const response = await axios.post(
            `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
            {
                messaging_product: "whatsapp",
                to: phone,
                type: "text",
                text: {
                    body: options.message,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        console.log("✅ WhatsApp sent via Meta:", response.data.messages[0].id);
        return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
        console.error("❌ Meta WhatsApp Error:", error.response?.data || error.message);
        return { success: false, message: error.message };
    }
};

// Option 3: Using WhatsAppWeb (Free but requires setup)
// For this, you'd use whatsapp-web.js npm package
export const sendWhatsAppViaWeb = async (options) => {
    try {
        const apiUrl = process.env.WHATSAPP_API_URL; // e.g., http://localhost:3001

        if (!apiUrl) {
            console.error("❌ WhatsApp Web API URL missing");
            return { success: false, message: "WhatsApp API not configured" };
        }

        const response = await axios.post(`${apiUrl}/send-message`, {
            phone: options.phone,
            message: options.message,
        });

        return { success: true, messageId: response.data.messageId };
    } catch (error) {
        console.error("❌ WhatsApp Web Error:", error.message);
        return { success: false, message: error.message };
    }
};

// Choose which service to use (set in .env)
export const sendWhatsAppMessage = async (options) => {
    const service = process.env.WHATSAPP_SERVICE || "twilio"; // Default to Twilio

    if (service === "meta") {
        return sendWhatsAppViaMeta(options);
    } else if (service === "web") {
        return sendWhatsAppViaWeb(options);
    } else {
        return sendWhatsAppViaTwilio(options);
    }
};
