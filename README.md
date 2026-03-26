# PrepWise

Smart meal planning and attendance optimization for messes and hostels.

## Overview

Food waste in hostels and mess systems often happens because kitchens prepare meals without accurate attendance data. Manual headcounts, late confirmations, and duplicate responses make planning unreliable.

PrepWise solves this by giving users a simple way to submit a daily meal response and giving administrators a clear, date-based meal count. The system is designed to reduce over-preparation, improve planning accuracy, and create a cleaner operational workflow.

## Features

- Submit a daily meal vote as `Yes` or `No`
- Update an existing vote for the same user and date instead of creating duplicates
- View real-time meal counts for a selected date
- Enforce a voting deadline after 10:00 PM using server-side time
- Validate requests on the backend for required fields and invalid values
- Handle malformed requests and database errors with meaningful API responses
- Login and signup flow integrated with the frontend

## Tech Stack

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

### Frontend

- HTML
- CSS
- JavaScript

### Tools

- Postman
- Git

## Project Structure

```text
PrepWise/
├── backend/
│   ├── models/
│   │   ├── user.js
│   │   └── vote.js
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   └── test_votes.js
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── .gitignore
└── README.md
```

## How It Works

1. A user signs up or logs in.
2. The frontend loads the authenticated session.
3. The user submits a meal vote for a selected date.
4. The backend validates the request, checks the voting deadline, and either creates or updates the vote.
5. Administrators or users can fetch the meal count for a given date.

## API Endpoints

### Vote APIs

#### `POST /vote`

Create or update a meal vote for the authenticated user.

Request body:

```json
{
  "date": "2026-03-27",
  "status": "yes"
}
```

Possible responses:

- `200 OK` for created or updated vote
- `400 Bad Request` for invalid payload
- `401 Unauthorized` if the user is not authenticated
- `403 Forbidden` if voting is closed after 10:00 PM

#### `GET /count/:date`

Get the meal count for a selected date.

Example:

```http
GET /count/2026-03-27
```

Response:

```json
{
  "date": "2026-03-27",
  "yes": 12,
  "no": 4,
  "total": 16
}
```

### Authentication APIs

#### `POST /auth/signup`

Create a new user account.

#### `POST /auth/login`

Authenticate an existing user.

#### `GET /auth/me`

Return the currently authenticated user.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/HimanshuP3002/PrepWise
cd PrepWise
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Create the Environment File

Create a `.env` file inside the `backend` folder and add:

```env
MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/prepwise?retryWrites=true&w=majority
PORT=5000
AUTH_SECRET=your_long_random_secret
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5000
```

### 4. Run the Backend Server

From the `backend` directory:

```bash
node server.js
```

Or in development mode:

```bash
npm run dev
```

### 5. Open the Application

Once the backend is running, open:

```text
http://localhost:5000
```

The server will redirect users to the login page and serve the frontend directly.

## Screenshots

Add screenshots to showcase the UI and workflow.

Suggested screenshots:

- Login page
- Signup page
- Meal voting dashboard
- Count tracking panel

You can place images in a folder such as `docs/screenshots/` and reference them here later.

## Future Improvements

- Role-based authentication and session hardening
- React-based frontend for a more scalable UI architecture
- AI-based meal demand prediction
- Admin analytics dashboard with trends and reports
- Email or notification reminders before deadline

## Development Notes

- Votes are stored in the `MessVote` database
- Login and signup users are stored in the `Users` collection
- Voting is restricted after 10:00 PM using server-side logic
- The backend serves the frontend directly through Express

## Author

**Himanshu Bipin Pandey**

### Profile Link

## Linkdien
[LinkDien Profile](https://www.linkedin.com/in/himanshu-pandey-05a951345/)
## Github 
[Github](https://github.com/HimanshuP3002)
