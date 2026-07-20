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






app.get('/auth/google', (req, res) => {
  //Build the scope list
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  // Decide on access_type. 'online' because we won't need a refresh token. Switch to offline later if needed.
  const access_type = 'online'; 

  // Generate Authentication URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type,
    scope: scopes,
  });

  // Redirect after authentication
  res.redirect(authUrl);    
});



app.get('/auth/google/callback', async (req, res) => {  
  let TokenResponse
  
  // Read the authorization code from the query string
  const code = req.query.code;

  // Check code either exists or is a string. If neither true, call error.
  if(!code || typeof code !== 'string') {
    return res.status(404).json({status: 'error', message: 'Malformed google auth code'})
  }

  // Try communicate with google server and send our code in exchange for token credentials.
  try {
  // Get token response and set credentials in oAuthClient
  TokenResponse = await oAuth2Client.getToken(code)
  oAuth2Client.setCredentials(TokenResponse.tokens)

  // Set Id_token to the id token extracted from the getToken token response
  const Id_token = TokenResponse.tokens.id_token

  // If id token is broken some how or is not a string return error status
  if(!Id_token || typeof Id_token !== 'string') {
    return res.status(404).json({status: 'error', message: 'Malformed Id token code'})
  }

  // Create login ticket with id token
  const loginTicket = await oAuth2Client.verifyIdToken({
    idToken: Id_token
  })

  // Extract google users email, name, sub from their jwt
  let email
  let name
  let sub
  const userPayload = loginTicket.getPayload()
  if (userPayload){
    email = userPayload.email
    name = userPayload.name
    sub = userPayload.sub
  } else {
    return res.status(400).json({status: "error", message: 'User payload is undefined'})
  }

  // Find or create user in postgres
  let selectedUser = await pool.query('SELECT id FROM users WHERE google_id = $1', [sub])  

  // If selected user doesn't exist, insert into table and reassign selected user to newly inserted user.
  if(selectedUser.rows.length == 0){
    selectedUser = await pool.query('INSERT INTO users (email, google_id) VALUES ($1, $2) RETURNING id', [email, sub]);
  }

  // Assign user ID to selected user ID
  const userId = selectedUser.rows[0].id

  // Create signed jwt token with userID
  const signedToken = jwt.sign({userId: userId}, String(process.env.JWT_SECRET), {expiresIn: '1h'})

  // Return signed jwt token
  return res.status(200).json({status: 'success', message: 'user logged in successfully', signedToken})


  } catch (error) {
    return res.status(400).json({status: 'error', message: "Error communicating with google"})
  }
})



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});