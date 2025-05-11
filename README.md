# WakeSync: Intelligent Smart Home & Wake-Up Automation

WakeSync is a comprehensive smart home application designed to revolutionize your daily routines, starting with a personalized and intelligent wake-up experience. It seamlessly integrates device control, advanced routine automation, insightful data analytics, and AI-powered suggestions to create a truly smart and responsive living environment.

## Overview

At its core, WakeSync aims to simplify and enhance modern living by providing a centralized hub for managing smart home devices and automating daily tasks. The system is built with a focus on user experience, offering intuitive controls and valuable insights derived from your habits and device usage. With a foundation for future data science capabilities, WakeSync is poised to become an even more adaptive and intelligent assistant for your home.

## Key Features

WakeSync offers a rich set of features designed to cater to various aspects of smart home management and personal well-being:

### Smart Home Control & Management
*   **Device Management (`/dashboard/devices`):** Monitor and control all connected smart devices (lights, thermostats, speakers, etc.) with status indicators, filtering options, and individual parameter adjustments.
*   **House Simulation (`/dashboard/simulation`):** Visualize your home layout, place and move devices, resize rooms, and test wake-up scenarios in an interactive environment.
*   **Event Logs (`/dashboard/logs`):** Track all system activities and device events with detailed information and filtering capabilities.

### Personalized Automation & Routines
*   **Routine Management (`/dashboard/routines`):** Create, manage, and automate sequences of actions for your smart devices. Toggle routines on/off and trigger them manually.
*   **AI Routine Suggester (`/dashboard/routines`):** Leverage Genkit-powered AI to receive intelligent routine suggestions based on weather, calendar events, and user preferences.
*   **Smart Wake-Up Simulation (`/dashboard/simulation`):** Customize your wake-up experience with simulated sunrises, configurable soundscapes, and adjustable light intensity and duration.

### Health & Data Insights
*   **Wristband Integration (`/dashboard/wristband`):** Connect your smart wristband to track health metrics (sleep, activity, heart rate) and integrate this data into automated routines and analytics.
*   **Analytics Dashboard (`/dashboard/analytics`):** Gain valuable insights into your sleep patterns, energy levels, device usage, routine execution frequency, and estimated energy consumption through clear charts and data summaries.

### User Experience & Customization
*   **Intuitive Dashboard (`/dashboard`):** A central hub providing an overview of your smart home, quick access to key features, and recent activity.
*   **User Authentication (`/auth/*`):** Secure login, signup, and password recovery functionalities powered by Firebase.
*   **Personalized Settings (`/dashboard/settings`):** Manage your account, profile, notification preferences, theme (light/dark mode), and third-party integrations.
*   **Informational Pages:**
    *   **Landing Page (`/`):** Introduces WakeSync and its core benefits.
    *   **Features Page (`/features`):** Provides a detailed overview of all application functionalities.
    *   **Pricing Page (`/pricing`):** Outlines different subscription tiers and their benefits.
    *   **Learn More Page (`/learn-more`):** Offers insights into the project's mission and philosophy.

### Foundation for Data Science
*   **Data Science Suite (`/dashboard/datascience/*`):** Placeholder pages for future implementation of dataset management, data processing, model training (including Logistic Regression), and model evaluation, aiming to further enhance personalization and predictive automation.

## Tech Stack

*   **Frontend:** Next.js (React), TypeScript, Tailwind CSS, ShadCN UI Components
*   **Backend:**
    *   Next.js API Routes
    *   Node.js with Express (for local backend development, located in the `backend/` directory)
*   **Authentication:** Firebase Authentication
*   **AI/ML:** Genkit (for AI-powered suggestions)
*   **Database (Current & Planned):** JSON files for mock data and initial local persistence. Future enhancements may include Firebase Firestore or MongoDB for robust data storage.

## Getting Started

1.  **Clone the repository.**
2.  **Install dependencies for both frontend and backend:**
    ```bash
    npm install
    cd backend
    npm install
    cd ..
    ```
3.  **Set up Environment Variables:**
    *   Create a `.env` file in the root directory. Copy the contents from `.env.example` (if provided) or add the following:
        ```
        NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
        NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
        NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"

        # For Genkit AI features
        GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY_FOR_GENKIT"

        # Backend URL (if frontend needs to know where the local backend is)
        NEXT_PUBLIC_BACKEND_URL="http://localhost:3001/api"
        ```
        Replace placeholder values with your actual Firebase and Google API credentials.
    *   Create a `.env` file in the `backend/` directory (if you have specific backend configurations like `BACKEND_PORT`, though the `server.ts` uses a default of 3001).
        ```
        BACKEND_PORT=3001
        # Add any other backend-specific environment variables here
        ```
4.  **Run the development servers:**
    *   **Frontend (Next.js):**
        ```bash
        npm run dev
        ```
        This will typically start the frontend on `http://localhost:9002`.
    *   **Backend (Node.js/Express):**
        ```bash
        cd backend
        npm run dev
        ```
        This will typically start the local backend on the port specified in `backend/.env` or `http://localhost:3001`.
    *   **Genkit (for AI features, if used):**
        ```bash
        npm run genkit:dev
        ```

## Project Goals & Future Enhancements

WakeSync aims to be an intelligent, adaptable system for managing and optimizing your home environment. Future enhancements will focus on:

*   **Full Backend Implementation:** Transitioning from mock data and basic local persistence to a robust backend with a proper database for all features.
*   **Complete Data Science Suite:** Implementing the dataset management, data processing, model training, and evaluation functionalities.
*   **Expanded Device & Service Integrations:** Supporting a wider range of smart home devices and third-party services.
*   **Advanced Automation Logic:** Introducing more complex conditional triggers and actions for routines.
*   **Enhanced User Personalization:** Further leveraging data and AI to provide highly tailored experiences.

WakeSync is continuously evolving to make smart living simpler, more intuitive, and deeply integrated into your daily life.
