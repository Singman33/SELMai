const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// const rateLimit = require('express-rate-limit'); // Désactivé
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const serviceRoutes = require('./routes/services');
const negotiationRoutes = require('./routes/negotiations');
const transactionRoutes = require('./routes/transactions');
const notificationRoutes = require('./routes/notifications');
const categoryRoutes = require('./routes/categories');
const ratingRoutes = require('./routes/ratings');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration pour les proxies (Docker/reverse proxy)
app.set('trust proxy', 1);

// Middleware CORS (en premier pour gérer les preflight requests)
const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origin (Postman, mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Liste des origines explicitement autorisées
    const allowedOrigins = [
      // Développement local
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      // Docker interne
      'http://backend:3001',
      'http://frontend:3000',
      'http://frontend:80',
      // Production - selmai.fr
      'http://selmai.fr',
      'https://selmai.fr',
      'http://selmai.fr:80',
      'http://selmai.fr:8080',
      'https://selmai.fr:443',
      'https://selmai.fr:8443',
      'http://www.selmai.fr',
      'https://www.selmai.fr',
      'http://www.selmai.fr:80',
      'http://www.selmai.fr:8080',
      'https://www.selmai.fr:443',
      'https://www.selmai.fr:8443',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Vérifier si l'origine est dans la liste autorisée
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // Permettre tout domaine sur les ports 80, 8080, 3000 et 443 (pour les domaines personnalisés)
    try {
      const url = new URL(origin);
      const allowedPorts = ['80', '8080', '3000', '443', '8443', ''];
      if (allowedPorts.includes(url.port)) {
        callback(null, true);
        return;
      }
    } catch (e) {
      // URL invalide, bloquer
    }

    console.log('❌ CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'X-Kuma-Revision'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Log CORS requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});

// Fallback pour les requêtes OPTIONS
app.options('*', (req, res) => {
  console.log('🔧 Manual OPTIONS handler for:', req.path);
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Sécurité avec configuration compatible CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting désactivé pour le développement
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limite chaque IP à 100 requêtes par windowMs
//   skip: (req) => req.method === 'OPTIONS' // Ignorer les preflight requests
// });
// app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ratings', ratingRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SELMai API is running' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur SELMai démarré sur le port ${PORT}`);
});