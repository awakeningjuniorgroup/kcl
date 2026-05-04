import "dotenv/config"; 
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

// Enterprise Middlewares
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

// Import Configs
import connectCloudinary from "./configs/cloudinary.js"; 

// Route Imports
import webhookRouter from "./routes/webhookRoute.js"; 
import addressRouter from "./routes/addressRoute.js";
import adminRouter from "./routes/adminRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import productRouter from "./routes/productRoute.js";
import riderRouter from "./routes/riderRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import settingsRouter from "./routes/settingsRoutes.js"; 
import userRouter from "./routes/userRoute.js";
import contentRouter from "./routes/contentRoute.js";
import cmsRouter from "./routes/cmsRoute.js"; 
import chatRouter from "./routes/chatRoute.js"; 
import payoutRouter from "./routes/payoutRoute.js";

// Middleware Imports
import { checkMaintenance } from "./middlewares/authRole.js"; 

const app = express();
const PORT = process.env.PORT || 4000;

// ==========================================
// 🛡️ CORS CONFIGURATION (MUST BE FIRST)
// ==========================================
const allowedOrigins = [
  "http://localhost:5173", 
  "https://horizon-business.vercel.app", 
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Autorise les requêtes sans origine (comme les outils de test ou apps mobiles)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy: Origin not allowed'), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  // 🟢 CRUCIAL : Autoriser explicitement votre header personnalisé "token"
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With", 
    "token"
  ]
}));

// ==========================================
// 🔌 SOCKET.IO (Note: Limited on Vercel)
// ==========================================
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.set("io", io);

io.on("connection", (socket) => {
    socket.on("join_order", (orderId) => socket.join(orderId));
    socket.on("register_user", (userId) => userId && socket.join(userId));
    socket.on("disconnect", () => console.log("🔌 Disconnected"));
});

// ==========================================
// 🚀 MIDDLEWARES & DB
// ==========================================
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
  await connectCloudinary();
};

app.use(helmet({ contentSecurityPolicy: false })); 
app.use(compression()); 
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Webhooks (Before JSON parser)
app.use("/api/webhooks", webhookRouter); 

app.use(express.json({ limit: '2mb' })); 
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(checkMaintenance);

// ==========================================
// 🗺️ API ROUTES
// ==========================================
app.use("/api/address", addressRouter);
app.use("/api/admin", adminRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/product", productRouter);
app.use("/api/rider", riderRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/settings", settingsRouter); 
app.use("/api/user", userRouter);        
app.use("/api/content", contentRouter);  
app.use("/api/cms", cmsRouter);          
app.use("/api/chat", chatRouter);        
app.use("/api/payout", payoutRouter);    

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "🌿 Horizon API is active." });
});

// Global Error Handler
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: err.message });
});

// ==========================================
// 🏁 SERVER INITIALIZATION
// ==========================================
if (process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    httpServer.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  });
} else {
  // For Vercel Serverless
  connectDB();
}

export default app;