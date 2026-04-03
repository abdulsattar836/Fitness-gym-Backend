require("dotenv").config(); // 👈 FIRST LINE
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const http = require("http");

// Swagger
const basicAuth = require("express-basic-auth");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swaggerConfig");
const { SwaggerTheme } = require("swagger-themes");
const theme = new SwaggerTheme();

// Routes
const userRouter = require("./Route/user_routes");

// Utils
const AppError = require("./utils/appError");
const globalErrorHandler = require("./Controller/error_controller");

// Socket
const { initializeSocket } = require("./socket.io/webSocket");

const app = express();
const server = http.createServer(app);
initializeSocket(server); // initialize socket connections

// ==================================================
// 🔹 SWAGGER
// ==================================================
const swaggerOptions = {
  explorer: true,
  customCss: theme.getBuffer("dark") + ".swagger-ui .topbar { display:none }",
};

app.use(
  "/api-docs",
  basicAuth({
    users: { [process.env.SWAGGER_USERNAME]: process.env.SWAGGER_PASSWORD },
    challenge: true,
    realm: "Imb4T3st4pp",
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerOptions),
);

// ==================================================
// 🔹 MIDDLEWARES
// ==================================================
app.enable("trust proxy");

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ==================================================
// 🔹 SERVE STATIC FILES
// ==================================================
app.use("/", express.static(path.join(__dirname, "files")));

// ==================================================
// 🔹 ROUTES
// ==================================================
app.use("/api/v1/user", userRouter);

// ==================================================
// 🔹 404 HANDLER
// ==================================================
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// ==================================================
// 🔹 GLOBAL ERROR HANDLER
// ==================================================
app.use(globalErrorHandler);

// ==================================================
// 🔹 MONGODB CONNECTION WITH CACHED PROMISE
// ==================================================
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.mongo_uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((mongoose) => {
        console.log("✅ MongoDB connected");
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1); // exit if DB connection fails
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// ==================================================
// 🔹 START SERVER AFTER DB CONNECTED
// ==================================================
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

module.exports = app;
