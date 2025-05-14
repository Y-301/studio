
# WakeSync Backend

This directory contains the Node.js and Express backend for the WakeSync application. It handles API requests, data management, device interactions, and routine automation, all intended for local development and simulation.

## Prerequisites

- Node.js (v18.x or later recommended)
- npm (usually comes with Node.js) or Yarn

## Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```
3.  **Environment Variables:**
    Create a `.env` file in the `backend/` directory. You can copy `backend/.env.example` if it exists, or create it manually.
    Key variables:
    ```env
    BACKEND_PORT=3001
    NODE_ENV=development
    JWT_SECRET="YOUR_REALLY_STRONG_JWT_SECRET_KEY_HERE" 
    # ^ IMPORTANT: Change this for any real deployment scenario, even local if concerned.
    # For local dev, a simple string is fine but remember its purpose.
    ```
    - `BACKEND_PORT`: The port the backend server will run on (default is 3001).
    - `NODE_ENV`: Set to `development` for local development, `production` for deployment.
    - `JWT_SECRET`: A secret key used for signing and verifying JSON Web Tokens for authentication. **Generate a strong, random string for this.**

## Running the Backend

-   **Development Mode (with Nodemon for auto-restarts):**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    This will start the server, typically on `http://localhost:3001`. Nodemon will watch for file changes in the `src/` directory and automatically restart the server.

-   **Production Mode (requires building first):**
    1.  Build the TypeScript code:
        ```bash
        npm run build
        ```
    2.  Start the server:
        ```bash
        npm run start
        ```

## Project Structure

-   `src/`: Contains the TypeScript source code for the backend.
    -   `config/`: Configuration loading (e.g., environment variables).
    -   `controllers/`: Request handlers that interact with services and respond to API calls.
    -   `data/`: JSON files used as a simple database for mock data (users.json, devices.json, etc., and status.json).
    -   `middleware/`: Custom middleware (e.g., `authMiddleware.ts` for JWT authentication).
    -   `models/`: TypeScript interfaces defining data structures.
    -   `routes/`: Express route definitions (authRoutes.ts, deviceRoutes.ts, dataRoutes.ts, etc.).
    -   `services/`: Business logic, data manipulation, and interaction with data files.
    -   `utils/`: Utility functions (e.g., `jsonDb.ts`, `authUtils.ts`).
    -   `server.ts`: The main entry point for the Express application.
-   `dist/`: Contains the compiled JavaScript code after running `npm run build`.
-   `uploads/`: Temporary directory for CSV file uploads (should be in `.gitignore`).

## Core Services Overview

-   **`authService.ts`**: Manages user signup (password hashing) and login (JWT generation).
-   **`deviceService.ts`**: Manages smart devices, including CRUD operations and status updates from `devices.json`.
-   **`routineService.ts`**: Handles routine creation, updates, deletion, and triggering from `routines.json`.
-   **`schedulerService.ts`**: Manages cron jobs for time-based routine triggers.
-   **`simulationService.ts`**: Deals with house floor plan data from `floorplan.json`.
-   **`settingsService.ts`**: Manages user-specific application settings from `settings.json`.
-   **`wristbandService.ts`**: Simulates and processes data from a smart wristband, logging events.
-   **`logService.ts`**: Provides a basic console logging utility.
-   **`dataManagementService.ts`**: Handles CSV data import/export and manages `status.json`.

## API Endpoints

The main API routes are defined in `src/routes/index.ts` and further broken down. Common base path is `/api`.
-   `/api/auth/signup`, `/api/auth/login`: For user authentication.
-   `/api/data/upload-csv/devices`, `/api/data/export-csv/devices`, `/api/data/app-status`: For CSV data management and app status.
-   Other endpoints like `/api/devices`, `/api/routines` are now protected and require a JWT.

## Data Storage (JSON Files & CSV)

This backend primarily uses JSON files in the `backend/data/` directory to simulate a database.
-   `users.json`: Stores registered users and hashed passwords.
-   `devices.json`, `routines.json`, etc.: Store application-specific data.
-   `status.json`: Stores simple application status flags (e.g., `isSeededByCsv`).

CSV files can be uploaded via the `/api/data/upload-csv/devices` endpoint to populate `devices.json`. Data can be exported via `/api/data/export-csv/devices`.

**Recommendation for More Robust Local Storage: SQLite**

While JSON files are simple for this local-first demo, they are not ideal for concurrent access, complex queries, or data integrity. For a more robust local backend, consider migrating to **SQLite**.

**Steps to migrate to SQLite (Conceptual):**
1.  Install SQLite3 driver: `npm install sqlite3` and `@types/sqlite3`.
2.  Create a `database.sqlite` file.
3.  Update `src/utils/jsonDb.ts` (or create a new `sqliteDb.ts`) with functions to connect to SQLite and perform CRUD operations (e.g., using `db.run()`, `db.get()`, `db.all()`).
4.  Modify services (`deviceService.ts`, etc.) to use these SQLite functions instead of reading/writing JSON files.
5.  Create initial table schemas for users, devices, routines, etc.
6.  Update CSV import logic to insert/update data into SQLite tables.

## Testing

(Conceptual - No automated tests are implemented in this version)
-   **Unit Tests:** Use Jest or Mocha to test individual service functions.
-   **Integration Tests:** Use Supertest to test API endpoints.

## Linting and Formatting

ESLint and Prettier are configured.
- Run ESLint: `npm run lint`
- Run Prettier: `npm run format`

This local backend provides a self-contained environment for developing and testing the WakeSync frontend without external dependencies like Firebase.
