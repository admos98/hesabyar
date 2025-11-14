# HesabYar (حساب‌یار - Accountant's Helper)

HesabYar is a sophisticated, production-ready Progressive Web App (PWA) for personal and small-business financial management, inventory tracking, and sales. It is designed to be mobile-first, intuitive, and powerful.

This is a full-stack application featuring a React frontend and a Vercel Serverless Function backend that uses a GitHub Gist as a JSON datastore.

## Technology Stack

*   **Frontend:** React 18 (Vite), TypeScript
*   **Routing:** React Router v6
*   **Styling:** Tailwind CSS
*   **State Management:**
    *   **Server State:** TanStack Query (React Query) for data fetching, caching, and mutations.
    *   **Client State:** Zustand for UI state (e.g., POS cart).
*   **Forms:** React Hook Form & Zod for robust validation.
*   **Backend:** Vercel Serverless Functions (TypeScript/Node.js).
*   **Database:** GitHub Gist as a JSON datastore.
*   **UI Components:** Radix UI primitives for accessibility.
*   **Icons:** Lucide React.
*   **Notifications:** Sonner (Toasts).

## Project Setup

### 1. Prerequisites

*   Node.js (v18 or later)
*   A Vercel account for deployment.
*   A GitHub account.

### 2. Environment Variables

This project requires several environment variables to function correctly, both for the Gist database and the AI-powered OCR feature.

**A. Create a GitHub Gist & Personal Access Token (PAT):**

Follow these steps to set up your Gist-based database:

1.  **Create Gist:** Go to [gist.github.com](https://gist.github.com), create a **secret** Gist with a filename like `hesabyar.db.json`.
2.  **Initial Content:** The content of the Gist must be the following JSON structure. **Do not leave it empty.**
    ```json
    {
      "vendors": [],
      "purchaseItems": [],
      "receipts": [],
      "shoppingLists": [],
      "sellableItems": [],
      "recipes": [],
      "sales": [],
      "recurringExpenses": []
    }
    ```
3.  **Get Gist ID:** After creating, copy the ID from the URL (`https://gist.github.com/your-username/GIST_ID`).
4.  **Create PAT:** Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic). Generate a new token with only the `gist` scope. Copy the token immediately.

**B. Get a Gemini API Key:**

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Create a new API key. This will be used for the receipt scanning feature.

**C. Set Environment Variables on Vercel:**

1.  Create a new project on Vercel and link your GitHub repository.
2.  In the project settings, go to "Environment Variables".
3.  Add the following three variables:
    *   `GIST_ID`: The ID of the Gist you created.
    *   `GITHUB_TOKEN`: The Personal Access Token you generated.
    *   `API_KEY`: Your Google Gemini API Key.

### 3. Running Locally

1.  Clone the repository:
    ```bash
    git clone <your-repo-url>
    cd hesab-yar
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  To run the Vercel backend locally, install the Vercel CLI:
    ```bash
    npm i -g vercel
    ```
4.  Create a `.env.local` file in the root of the project and add your variables:
    ```
    GIST_ID="your_gist_id"
    GITHUB_TOKEN="your_github_token"
    API_KEY="your_gemini_api_key"
    ```
5.  Start the development server using the Vercel CLI. This will run both your frontend and your serverless functions in the `/api` directory.
    ```bash
    vercel dev
    ```
    The app will be available at `http://localhost:3000`.

### 4. Deployment

Deployment is handled automatically by Vercel. Simply push your changes to the main branch of your GitHub repository. Vercel will build the frontend and deploy the serverless functions from the `/api` directory, using the environment variables you configured in the Vercel dashboard.
