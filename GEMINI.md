# Project Overview

This is a full-stack JavaScript application for managing a fleet of vehicles. It includes features for vehicle tracking, maintenance, and driver management. The application is built with a React frontend, a serverless backend using Netlify Functions, and a PostgreSQL database.

**Frontend:**

*   **Framework:** React
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **Routing:** React Router
*   **Authentication:** The frontend uses JWTs (JSON Web Tokens) for authentication and has a role-based access control system.

**Backend:**

*   **Platform:** Netlify Functions
*   **Database:** PostgreSQL (using `@neondatabase/serverless`)
*   **Authentication:** The backend handles user authentication, password hashing with `bcrypt`, and JWT generation.

**Modules:**

The application is divided into several modules based on user roles:

*   **AdminModule:** For administrative tasks.
*   **DriverModule:** For drivers to manage their trips and vehicles.
*   **ManagerModule:** For managers to oversee the fleet.
*   **ShopModule:** For mechanics and shop personnel to manage vehicle maintenance.

# Building and Running

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server and the application will be available at `http://localhost:5173`.

3.  **Build for Production:**
    ```bash
    npm run build
    ```
    This will create a `dist` directory with the production-ready files.

# Development Conventions

*   **Serverless Functions:** Backend logic is implemented as serverless functions in the `netlify/functions` directory.
*   **API Routing:** The `netlify.toml` file configures a redirect from `/api/*` to the corresponding serverless function. For example, a request to `/api/login` is handled by `netlify/functions/login.js`.
*   **Authentication:** The application uses a role-based access control system. The `ProtectedRoute` component in the frontend restricts access to certain routes based on the user's role.
*   **Database:** The application uses a PostgreSQL database. The connection string is stored in the `DATABASE_URL` or `NETLIFY_DATABASE_URL` environment variable.

# Testing

This project uses [Jest](https://jestjs.io/) for testing.

1.  **Install Testing Dependencies:**
    ```bash
    npm install --save-dev jest babel-jest @babel/preset-env
    ```

2.  **Configure Jest and Babel:**
    *   Create a `babel.config.cjs` file with the following content:
        ```javascript
        module.exports = {
          presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
        };
        ```
    *   Add the following to your `package.json`:
        ```json
        "scripts": {
          "test": "jest"
        },
        "jest": {
          "transform": {
            "^.+\\.js$": "babel-jest"
          }
        }
        ```

3.  **Run Tests:**
    ```bash
    npm test
    ```
