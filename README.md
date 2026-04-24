# OIDC Service

A OpenID Connect (OIDC) authentication service built with TypeScript, Express, Drizzle ORM, PostgreSQL, and RSA key-based JWT signing. This project is intended as a reference implementation for auth flows and token issuance.

## Built with

- Node.js + TypeScript
- Express 5
- Drizzle ORM + PostgreSQL
- JSON Web Tokens (JWT) with RS256 signing
- `node-jose` for JWKS conversion
- `zod` for request validation

## Key features

- OIDC discovery endpoint: `/.well-known/openid-configuration`
- JWKS endpoint: `/.well-known/jwks.json`
- User registration and login endpoints
- RSA key-based JWT issuance and verification
- Protected `userinfo` endpoint using bearer token authorization
- PostgreSQL persistence via Drizzle ORM
- Static UI served from `public/`

## Repository structure

- `src/index.ts` - application bootstrap and server startup
- `src/auth/router.ts` - auth route definitions
- `src/auth/controller.ts` - route handlers and OIDC metadata responses
- `src/auth/service.ts` - business logic for signup, signin, and userinfo
- `src/auth/validator.ts` - request payload validation using `zod`
- `src/db/index.ts` - PostgreSQL connection and Drizzle ORM setup
- `src/db/schema.ts` - database schema definition for auth data
- `src/utils/cert.ts` - loads RSA public/private key files
- `public/` - frontend pages used by the auth flow
- `cert/` - RSA key artifacts (private/public key pair)
- `docker-compose.yml` - PostgreSQL local development container
- `key-gen.sh` - OpenSSL helper for generating RSA keys

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL
- OpenSSL (for generating RSA key pair)
- Optional: Docker / Docker Compose for local Postgres

## Environment variables

Create a `.env` file in the project root with the following values:

```env
DATABASE_URL=postgres://admin:admin@localhost:5432/oidc_auth
SERVER_URL=http://localhost
PORT=8082
```

### Environment variable details

- `DATABASE_URL` - PostgreSQL connection string
- `SERVER_URL` - public server URL used to build issuer and metadata URLs
- `PORT` - port where the Express app listens

## Database schema

The project stores auth users in a single `users` table with the following fields:

- `id` - UUID primary key
- `firstName` - user first name
- `lastName` - user last name
- `profileImageURL` - optional avatar/profile image URL
- `email` - user email address
- `emailVerified` - whether email has been verified
- `password` - SHA-256 password hash
- `salt` - random per-user salt used during hashing
- `createdAt` - row creation timestamp
- `updatedAt` - row update timestamp

## Local setup

Install dependencies:

```bash
npm install
```

### Start PostgreSQL locally with Docker

Use the provided Docker Compose file to launch a local database instance:

```bash
docker compose up -d
```

This starts a Postgres 17 container with these defaults:

- user: `admin`
- password: `admin`
- database: `oidc_auth`
- port: `5432`

### Generate RSA key pair

The app requires `cert/private-key.pem` and `cert/public-key.pub`.

Generate them with the provided script:

```bash
sh key-gen.sh
```

Or use OpenSSL manually:

```bash
mkdir -p cert
openssl genpkey -algorithm RSA -out cert/private-key.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in cert/private-key.pem -pubout -out cert/public-key.pub
```

### Build and run

Compile the TypeScript source:

```bash
npx tsc
```

Start the server:

```bash
node dist/index.js
```

For development with automatic restart:

```bash
npm run dev
```

## Endpoints

### Health and metadata

- `GET /` - basic health message
- `GET /health` - health check response
- `GET /.well-known/openid-configuration` - OIDC discovery metadata
- `GET /.well-known/jwks.json` - JSON Web Key Set for verifying tokens

### Authentication flow

- `GET /o/authenticate` - serves the authentication page
- `POST /o/authenticate/sign-up` - register a new user
- `POST /o/authenticate/sign-in` - authenticate and receive JWT
- `GET /o/userinfo` - protected endpoint returning user profile data

## API reference

### Sign up

Request:

```http
POST /o/authenticate/sign-up
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "profileImageURL": "https://example.com/avatar.png"
}
```

Response:

```json
HTTP/1.1 201 Created
{
  "ok": true
}
```

### Sign in

Request:

```http
POST /o/authenticate/sign-in
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "secret123"
}
```

Response:

```json
HTTP/1.1 200 OK
{
  "token": "<jwt-token>"
}
```

### Userinfo

Request:

```http
GET /o/userinfo
Authorization: Bearer <jwt-token>
```

Response:

```json
HTTP/1.1 200 OK
{
  "sub": "...",
  "email": "jane@example.com",
  "email_verified": false,
  "given_name": "Jane",
  "family_name": "Doe",
  "name": "Jane Doe",
  "picture": null
}
```

## How auth works

1. `sign-up` stores a user record with a SHA-256 hashed password and random salt.
2. `sign-in` validates credentials, then issues an RS256 JWT signed with `cert/private-key.pem`.
3. `userinfo` validates the bearer token with `cert/public-key.pub` and returns the stored profile.
4. `/.well-known/jwks.json` exposes the signing key for external verification.

## Production considerations

This README documents the service as implemented, but the project is not fully hardened for production. Recommended improvements:

- Replace SHA-256 password hashing with a strong adaptive algorithm such as `bcrypt` or `argon2`
- Store secrets and keys in a secure vault or secret manager
- Add HTTPS/TLS termination for client traffic
- Implement database migrations and schema versioning
- Add logging, monitoring, and observability
- Add automated tests for auth and token flows
- Harden CORS, rate limiting, and input validation

## Notes

- There is no dedicated test suite currently included.
- The OpenID Connect metadata and JWKS endpoints are simplified for sample usage.
- `SERVER_URL` should match the base URL used for issuer and metadata generation.

## License

ISC
