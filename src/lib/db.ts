/**
 * MongoDB connection helper.
 *
 * Connection caching strategy:
 *   In development, Next.js hot-reloads modules on every file change, which
 *   would create a new MongoDB connection on every request. We cache the
 *   connection on the global object so all hot-reloads share one.
 *
 *   In production, connections are reused across requests within the same
 *   serverless function instance.
 *
 * Why bufferCommands: false?
 *   By default Mongoose buffers commands while disconnected. We want failures
 *   to be loud and fast, not silently queued.
 */
import "@/models/index";
import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined. Check .env.local.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
