import 'dotenv/config';
import mongoose from 'mongoose';
import app from '../server/src/app.js';

// Cache the Mongoose connection across warm serverless invocations.
// Without caching each invocation would open a new connection pool,
// quickly exhausting Atlas's free-tier connection limit.
if (!global._mongoConn) global._mongoConn = { promise: null };

async function connectDB() {
  if (!global._mongoConn.promise) {
    global._mongoConn.promise = mongoose.connect(process.env.MONGODB_URI);
  }
  await global._mongoConn.promise;
}

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
