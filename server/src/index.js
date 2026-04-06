import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/ai', aiRoutes);

// Liveness check — returns { status: 'ok' } to confirm the server is running.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler — catches any error passed via next(err) from route handlers.
// Uses err.status if set, otherwise defaults to 500, and returns a JSON error message.
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({ message: err.message ?? 'Internal server error' });
});

const PORT = process.env.PORT ?? 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

export default app;
