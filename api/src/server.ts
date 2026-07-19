import 'dotenv/config';
import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import {OAuth2Client} from 'google-auth-library';
const app = express();
app.use(express.json());
const port = process.env.PORT;



const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? +process.env.DB_PORT : 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});


const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);


// This should go into its own type file in a real project.
declare global {
  namespace Express {
    interface Request {
      token?: JwtPayload;
    }
  }
}



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});