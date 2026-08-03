const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Initialize Firebase Admin
let adminInitialized = false;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    adminInitialized = true;
    console.log('✅ Firebase Admin SDK initialized with FIREBASE_SERVICE_ACCOUNT_JSON');
  } catch (err) {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
  }
}

if (!adminInitialized && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    const resolvedPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    const serviceAccount = require(resolvedPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    adminInitialized = true;
    console.log(`✅ Firebase Admin SDK initialized with FIREBASE_SERVICE_ACCOUNT_PATH (${resolvedPath})`);
  } catch (err) {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT_PATH:', err.message);
  }
}

if (!adminInitialized && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || 'key-id',
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || 'client-id',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    adminInitialized = true;
    console.log('✅ Firebase Admin SDK initialized with environment variables');
  } catch (err) {
    console.error('Firebase initialization error:', err.message);
    console.warn('⚠️  Falling back to development mode');
  }
}

if (!adminInitialized) {
  try {
    // For development mode - use minimal config without cert
    const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-healthcard-project';
    
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: projectId,
        // Don't provide credentials - let it fail gracefully for Firestore
      });
      console.log(`📚 Firebase initialized in development mode (Project: ${projectId})`);
      console.log('⚠️  Note: Firestore operations will be limited. For full functionality:');
      console.log('   1. Set up a Firebase project at https://console.firebase.google.com');
      console.log('   2. Download service account key and set FIREBASE_SERVICE_ACCOUNT_JSON');
      console.log('   Or use Firestore Emulator: FIREBASE_EMULATOR_HOST=127.0.0.1:8080');
    }
    adminInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();
db.settings({
  ignoreUndefinedProperties: true,
});

// Log successful initialization
console.log('✅ Firestore database connection ready');

module.exports = { admin, db };
