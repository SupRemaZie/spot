/**
 * Connexion MongoDB Atlas (Singleton Pattern)
 * Gère la connexion unique et la reconnexion automatique
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Utilisation de la variable globale pour le cache en développement
// (évite les reconnexions multiples lors du hot-reload)
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  // Si déjà connecté et prêt, retourner immédiatement
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    
    // Vérifier que la connexion est vraiment prête
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready');
    }
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error('❌ Erreur de connexion MongoDB:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;

