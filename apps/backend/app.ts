import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import cors from 'cors';
import roomRouter from './routes/practiceRoom'
import roundRouter from './routes/practiceRound'
import profileRouter from './routes/profile'
import recordingRouter from './routes/recording'
import assessmentRouter from './routes/assessment'
import proposalsRouter from './routes/proposal'

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL;
console.log('FRONTEND_URL:', FRONTEND_URL);

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/practice-room', roomRouter)
app.use('/api/practice-round', roundRouter)
app.use('/api/profile', profileRouter)
app.use('/api/recording', recordingRouter)
app.use('/api/proposal', proposalsRouter)
app.use('/api/assessment', assessmentRouter)

export default app