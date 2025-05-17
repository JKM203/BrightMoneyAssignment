# Banking System API

A RESTful API for a simple banking system, built with Node.js, Express, and PostgreSQL.

## Features

- User registration and authentication (JWT-based)
- Loan application and EMI schedule management
- Payment processing for EMIs
- Transaction and statement retrieval
- Secure password hashing (bcrypt)
- Middleware for authentication and error handling

## Project Structure

```
.env
app.js
queries.sql
package.json
config/
  db.config.js
controllers/
  auth.controller.js
  bank.controller.js
database/
  index.js
routes/
  auth.routes.js
  bank.routes.js
utils/
  auth.middleware.js
  response.util.js
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL

### Setup

1. **Clone the repository**

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Configure environment variables**

   Edit the `.env` file as needed:
   ```
   PORT=3000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=banking_system
   DB_USER=postgres
   DB_PASSWORD=your_password

   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=1d
   JWT_COOKIE_EXPIRES_IN=1
   ```

4. **Initialize the database**

   - Create the database in PostgreSQL:
     ```sql
     CREATE DATABASE banking_system;
     ```
   - CREATE Schemas

5. **Start the server**
   ```sh
   npm run dev
   ```

   The API will be available at `http://localhost:3000/`.

## API Endpoints

### Auth

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/auth/profile` — Get user profile (requires authentication)

### Bank

- `POST /api/bank/get-loan` — Apply for a loan (requires authentication)
- `POST /api/bank/make-payment` — Make EMI payment (requires authentication)
- `POST /api/bank/get-statement` — Get loan statement (requires authentication)

## Environment Variables

See `.env` for all configuration options.

## License

MIT