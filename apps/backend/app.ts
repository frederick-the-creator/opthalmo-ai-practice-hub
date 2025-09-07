import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import cors from 'cors';
import roomRouter from './controllers/room'
import recordingRouter from './controllers/recording'
import assessmentRouter from './controllers/assessment'

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL;
console.log('FRONTEND_URL:', FRONTEND_URL);

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/room', roomRouter)
app.use('/api/recording', recordingRouter)
app.use('/api/assessment', assessmentRouter)

export default app