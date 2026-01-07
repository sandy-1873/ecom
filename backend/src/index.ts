import express, { Request, Response } from 'express';
import userRoutes from './routes/userRoute';
import 'dotenv/config';
import userTokenValidator from "./middlewares/auth";
const app = express();
const port = process.env.APP_PORT;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
});

app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
