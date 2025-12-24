const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const stripeKeysRoutes = require("./routes/stripeKeys");
const {
  testConnection,
  initializeDatabase,
  pool,
} = require("./config/database");
const { setupUsers } = require("./scripts/setupUsers");
const stripeKeysCache = require("./utils/stripeKeysCache");
const { decrypt } = require("./utils/encryption");

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

app.use(helmet());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS" || req.path === "/api/health",
});
app.use(globalLimiter);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/stripe", stripeKeysRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("Failed to connect to database. Server will not start.");
      process.exit(1);
    }

    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error(
        "Failed to initialize database tables. Server will not start."
      );
      process.exit(1);
    }

    try {
      console.log(
        "🚀 Setting up users table and admin user..."
      );
      await setupUsers();
      console.log("✅ Users setup completed successfully!");
    } catch (error) {
      console.error(
        "⚠️  Users setup failed, but continuing server startup:",
        error.message
      );
    }

    const loadKeysIntoCache = async () => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(
            "SELECT user_id, secret_key, publishable_key FROM stripe_keys WHERE is_active = true"
          );

          if (result.rows.length > 0) {
            let loadedCount = 0;
            let failedCount = 0;
            for (const row of result.rows) {
              const {
                user_id,
                secret_key: encryptedSecretKey,
                publishable_key,
              } = row;
              try {
                const decryptedSecretKey = decrypt(encryptedSecretKey);
                stripeKeysCache.updateUserKeys(
                  user_id,
                  decryptedSecretKey,
                  publishable_key
                );
                loadedCount++;
              } catch (decryptError) {
                failedCount++;
                console.warn(`Failed to decrypt keys for user ${user_id}. This may happen if ENCRYPTION_KEY environment variable was not set consistently. Keys will need to be re-entered.`);
              }
            }
            if (loadedCount > 0) {
              console.log(`Stripe keys loaded into cache for ${loadedCount} user(s)`);
            }
            if (failedCount > 0) {
              console.warn(`Failed to load keys for ${failedCount} user(s). Please re-enter the keys.`);
              if (!process.env.ENCRYPTION_KEY) {
                console.warn('⚠️  ENCRYPTION_KEY environment variable is not set. This causes encryption keys to change on each server restart, making encrypted data unrecoverable. Please set ENCRYPTION_KEY to a fixed 64-character hex string.');
              }
            }
          } else {
            console.log("No active Stripe keys found in database");
          }
        } finally {
          client.release();
        }
      } catch (error) {
        console.error("Error loading keys into cache:", error.message);
      }
    };

    await loadKeysIntoCache();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log("Database connection established and tables initialized");
      console.log(
        "📧 Admin credentials: admin@example.com / password123"
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

