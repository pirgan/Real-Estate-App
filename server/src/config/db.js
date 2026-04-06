import mongoose from 'mongoose';

// Connects Mongoose to the MongoDB Atlas cluster specified by MONGODB_URI.
// Logs the connected host on success; throws on connection failure so the server can exit cleanly.
const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;
