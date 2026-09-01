const jsonServer = require('json-server');
const path = require('path');
const fs = require('fs');

const server = jsonServer.create();
const dbFile = path.join(__dirname, 'db.json');

// Ensure db.json exists
if (!fs.existsSync(dbFile)) {
  console.warn('[DB] db.json not found, creating an empty database structure.');
  const initialDb = {
    users: [],
    routes: [],
    buses: [],
    staff: [],
    bookings: []
  };
  fs.writeFileSync(dbFile, JSON.stringify(initialDb, null, 2), 'utf-8');
}

const router = jsonServer.router(dbFile);
const middlewares = jsonServer.defaults({
  logger: process.env.NODE_ENV !== 'production'
});

const PORT = parseInt(process.env.PORT, 10) || 6001;

// ── Health check endpoint for cloud monitoring & deployment probes ─────────
server.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'bmtc-db-api',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ── Production-grade CORS policy ───────────────────────────────────────────
server.use((req, res, next) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    'http://localhost:6173',
    'http://localhost:6175',
    'http://localhost:5173',
    'http://localhost:5175'
  ].filter(Boolean);

  const origin = req.headers.origin;

  // In development, or if origin matches allowed list / vercel preview domains, allow it
  const isVercelPreview = origin && origin.endsWith('.vercel.app');
  const isAllowed = !origin || allowedOrigins.includes(origin) || isVercelPreview || process.env.NODE_ENV !== 'production';

  if (isAllowed && origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

server.use(middlewares);
server.use(router);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[BMTC Database API] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`[BMTC Database API] Health check available at: http://0.0.0.0:${PORT}/health`);
});
