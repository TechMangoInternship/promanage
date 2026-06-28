# Assumption Grid

A MERN application for managing project assumptions via a single-column editable data grid.

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React, Vite, Material UI, Axios   |
| Backend   | Node.js, Express.js               |
| Database  | MongoDB, Mongoose                 |

## Project Structure

```
assumption-grid/
├── frontend/            # React + Vite frontend
│   ├── src/
│   │   ├── components/  # AssumptionGrid, AssumptionRow, AssumptionForm, SearchBar
│   │   ├── pages/       # AssumptionPage
│   │   ├── services/    # assumptionApi (Axios client)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/             # Express.js backend
│   ├── controllers/     # assumptionController
│   ├── routes/          # assumptionRoutes
│   ├── services/        # assumptionService
│   ├── app.js
│   └── server.js
├── database/            # MongoDB models & connection
│   ├── connection.js
│   └── Assumption.js
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
PORT=5001
MONGODB_URI=mongodb://localhost:27017/assumption_grid_db
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

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001

## API Endpoints

| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| GET    | `/api/assumptions`     | Get all assumptions      |
| GET    | `/api/assumptions?search=query` | Search assumptions |
| POST   | `/api/assumptions`     | Create a new assumption  |
| PUT    | `/api/assumptions/:id` | Update an assumption     |
| DELETE | `/api/assumptions/:id` | Delete an assumption     |

## Features

- ✅ Add new assumptions
- ✅ Inline editing with Save / Cancel
- ✅ Delete with confirmation dialog
- ✅ Real-time search filtering
- ✅ MongoDB persistence
- ✅ Responsive dark-themed UI
- ✅ Snackbar notifications
