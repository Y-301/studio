# WakeSync Backend

This directory contains the Node.js and Express backend for the WakeSync application. It handles API requests, data management, device interactions, and routine automation.

## Prerequisites

- Node.js (v18.x or later recommended)
- npm (usually comes with Node.js)

## Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:**
    Create a `.env` file in the `backend/` directory. You can copy `backend/.env.example` if it exists, or create it manually.
    A key variable is:
    ```env
    BACKEND_PORT=3001
    NODE_ENV=development
    ```
    - `BACKEND_PORT`: The port the backend server will run on (default is 3001).
    - `NODE_ENV`: Set to `development` for local development, `production` for deployment. This can influence logging levels or other behaviors.

## Running the Backend

-   **Development Mode (with Nodemon for auto-restarts):**
    ```bash
    npm run dev
    ```
    This will start the server, typically on `http://localhost:3001` (or the port specified in `BACKEND_PORT`). Nodemon will watch for file changes in the `src/` directory and automatically restart the server.

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
    -   `data/`: JSON files used as a simple database for mock data.
    -   `models/`: TypeScript interfaces defining data structures (e.g., Device, Routine).
    -   `routes/`: Express route definitions, mapping API paths to controller functions.
    -   `services/`: Business logic, data manipulation, and interaction with external services or data sources.
    -   `utils/`: Utility functions (e.g., for JSON database interaction).
    -   `server.ts`: The main entry point for the Express application.
-   `dist/`: Contains the compiled JavaScript code after running `npm run build`.
-   `data/`: (Outside `src/`, in `backend/data/`) Stores the JSON files used as a mock database.

## Core Services Overview

-   **`deviceService.ts`**: Manages smart devices, including CRUD operations, status updates, and simulating device changes.
-   **`routineService.ts`**: Handles routine creation, updates, deletion, and triggering (manual and scheduled).
-   **`schedulerService.ts`**: Manages cron jobs for time-based routine triggers and one-time scheduled actions.
-   **`simulationService.ts`**: Deals with house floor plan data and potentially simulating wake-up scenarios (wake-up logic is primarily in `wakeUpController.ts`).
-   **`settingsService.ts`**: Manages user-specific application settings.
-   **`wristbandService.ts`**: Simulates and processes data from a smart wristband.
-   **`logService.ts`**: Provides a basic logging utility.

## API Endpoints

The main API routes are defined in `src/routes/index.ts` and further broken down in specific route files (e.g., `deviceRoutes.ts`, `routineRoutes.ts`). Common base path is `/api`.

Examples:
-   `/api/devices`: For device management.
-   `/api/routines`: For routine management.
-   `/api/settings/:userId`: For user settings.
-   `/api/wake-up`: To trigger wake-up simulations.
-   `/api/simulation/floorplan`: For managing house floor plan data.
-   `/api/dashboard/summary`: For fetching dashboard overview data.

## Data Simulation

The backend includes data simulation for:
-   **Device State Changes:** `deviceService.ts` (`simulateDeviceChanges`) periodically alters the status of devices for a mock user.
-   **Wristband Data:** `wristbandService.ts` (`simulateAndProcessWristbandData`) generates fake heart rate, steps, and sleep state events.
These simulations are typically active in development mode to provide dynamic data to the frontend. Check `server.ts` for simulation configuration and toggle flags.

## Testing (Conceptual)

While comprehensive tests are not yet implemented, testing would typically involve:

-   **Unit Tests:** Using a framework like Jest or Mocha to test individual functions and services in isolation (e.g., testing a specific function in `deviceService.ts`). Mocking dependencies would be crucial.
    ```bash
    # Example (conceptual)
    # npm test -- src/services/deviceService.test.ts
    ```
-   **Integration Tests:** Testing the interaction between different parts of the backend, such as a route calling a controller, which then uses a service (e.g., testing the `/api/devices` endpoint). Supertest is a common library for API endpoint testing.
-   **Mock Data:** Test files would utilize mock data (similar to what's in `backend/data/` or custom test-specific mocks) to provide consistent inputs for tests.

To run tests (once implemented), you would typically add a `test` script to `package.json`:
```json
"scripts": {
  // ... other scripts
  "test": "jest" // or your chosen test runner
}
```

## Linting and Formatting

ESLint and Prettier configurations are provided to help maintain code quality and consistency.
- Run ESLint: `npm run lint` (add this script to package.json: `"lint": "eslint src --ext .ts"`)
- Run Prettier: `npm run format` (add this script to package.json: `"format": "prettier --write src/**/*.ts"`)

## Further Development

This backend provides a basic structure. Future enhancements would include:
-   Integration with a persistent database (e.g., PostgreSQL, MongoDB, Firebase Firestore).
-   Robust authentication and authorization mechanisms.
-   Comprehensive error handling and input validation for all API endpoints.
-   More sophisticated data simulation for edge cases.
-   Implementation of data science features if required.
