# Dependency Grid

A MERN application for managing project dependencies via a single-column editable data grid.

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React, Vite, Material UI, Axios   |
| Backend   | Node.js, Express.js               |
| Database  | MongoDB, Mongoose                 |

## Project Structure

```
dependency-grid/
├── frontend/            # React + Vite frontend
│   ├── src/
│   │   ├── components/  # DependencyGrid, DependencyRow, DependencyForm, SearchBar
│   │   ├── pages/       # DependencyPage
│   │   ├── services/    # dependencyApi (Axios client)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/             # Express.js backend
│   ├── controllers/     # dependencyController
│   ├── routes/          # dependencyRoutes
│   ├── services/        # dependencyService
│   ├── app.js
│   └── server.js
├── database/            # MongoDB models & connection
│   ├── connection.js
│   └── Dependency.js
├── seed.js              # Sample data seeder
├── package.json
├── .env
└── README.md
```

## Prerequisites

- **Node.js** >= 18
- **MongoDB** running locally on `mongodb://localhost:27017`

## Installation

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run install:frontend
```

## Environment Variables

The `.env` file is pre-configured:

```
PORT=5002
MONGODB_URI=mongodb://localhost:27017/dependency_grid_db
NODE_ENV=development
```

## Seed Data

```bash
npm run seed
```

## Running the Application

```bash
# Start both frontend and backend concurrently
npm run dev
```

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:5002

## API Endpoints

| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/dependencies`     | Get all dependencies     |
| GET    | `/api/dependencies?search=query` | Search dependencies |
| POST   | `/api/dependencies`     | Create a new dependency  |
| PUT    | `/api/dependencies/:id` | Update a dependency      |
| DELETE | `/api/dependencies/:id` | Delete a dependency      |

## Features

- ✅ Add new dependencies
- ✅ Inline editing with Save / Cancel
- ✅ Delete with confirmation dialog
- ✅ Real-time search filtering
- ✅ MongoDB persistence
- ✅ Responsive dark-themed UI
- ✅ Snackbar notifications
