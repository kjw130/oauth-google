# oauth-google-demo

A practice project demonstrating Google OAuth 2.0 login integrated with a JWT-based authentication system, backed by PostgreSQL.

## What it does

A user logs in with their Google account. The server exchanges Google's authorization code for tokens, verifies the identity token, and extracts the user's email and unique Google ID (`sub`). It then finds or creates a matching row in Postgres and issues its own signed JWT — so the rest of the app doesn't care whether a user logged in via Google or (eventually) email/password.

## Tech Stack
- TypeScript + Express
- PostgreSQL (pg)
- google-auth-library (OAuth2Client)
- jsonwebtoken
- tsx for dev runtime

## Setup
1. Clone the repo, `npm install` inside `api/`
2. Create a Google Cloud project, configure the OAuth consent screen, and generate OAuth credentials (Client ID + Secret), with redirect URI `http://localhost:3000/auth/google/callback`
3. Create a `.env` file with your Google credentials, DB config, and JWT secret
4. Create the Postgres database and `users` table (see `schema.sql`)
5. Run `npm run dev`

## Routes
- `GET /auth/google` — redirects to Google's consent screen
- `GET /auth/google/callback` — handles the OAuth callback, issues a JWT

## Notes
Uses `sub` (Google's stable user ID) rather than email as the lookup key, since email can change but `sub` cannot.
