import express from 'express';

import cors from 'cors';
import dotenv from 'dotenv'
import mongoose from 'mongoose';
import userRouter from './router/userRouter.js'

const app = express()

app.use(cors())

dotenv.config({
    path: "./.env"
})

app.use(express.json())

const PORT = Number(process.env.PORT) || 9000

mongoose
  .connect(process.env.MONGO_URI, {
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB:', err));

app.listen(PORT, (req, res) => {
    console.log(`server started on port ${PORT}`);
});


app.get('/',(req,res)=>{
    res.status(200)
    res.json({
        msg: 'Welcome to Express server!'
    })
})

app.use('/users', userRouter)