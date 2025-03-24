# Task Management App with Notifications

## Overview
Task Management App is a Fullstack Task Management Application that allows users to create, update, and track tasks while receiving timely notifications for upcoming deadlines. Users can register and log in, assign deadlines, and get real-time alerts.

- Full guide of the app: https://shorturl.at/17aVv (5mins) 
- Full guide of the app with code: https://shorturl.at/c7DHl  (10mins)

---

## Tech Choices

### 1. Cloud Provider: Google Cloud Platform (GCP)
- **Why**: GCP was chosen for its generous free tier (e.g., 2 million Cloud Run requests/month, 5 GB Cloud Storage), making it cost-effective for deployment. Cloud Run simplifies serverless backend hosting, and Cloud Storage is ideal for serving the static React frontend. Its beginner-friendly interface and unified services reduce complexity compared to alternatives like AWS or Azure.
- **Usage**: The frontend is hosted on Cloud Storage, and the backend runs on Cloud Run.

### 2. Database: PostgreSQL
- **Why**: PostgreSQL was selected for its relational structure, which ensures fast, consistent queries for task deadlines—crucial for a task manager. It’s open-source, integrates seamlessly with Node.js via the `pg` library, and supports cron jobs for scheduled reminders, offering better data integrity than NoSQL options like MongoDB for this use case.
- **Usage**: Stores user data (`users` table) and task details (`tasks` table).

### 3. Backend: Node.js with Express
- **Why**: Node.js is lightweight, fast, and excels at real-time applications with Socket.io. Express provides a simple framework for RESTful APIs, and its ecosystem supports JWT authentication and PostgreSQL integration. It’s easy to containerize for Cloud Run deployment.
- **Usage**: Manages API endpoints, user authentication, and real-time notifications.

### 4. Frontend: React.js
- **Why**: React.js offers a component-based architecture for a clean, user-friendly interface. Material-UI provides pre-built, customizable components for styling, and libraries like `react-toastify` enhance the notification experience. It builds into a static site, perfect for Cloud Storage.
- **Usage**: Displays tasks, forms for task management, and real-time updates.

---

## Project Structure
```
TaskManger/
│── backend/
│ │── routes/ # API routes (auth.js, tasks.js)
│ │── services/ # Cron job for reminders
│ │── server.js # Backend entry point
│ │── package.json # Backend dependencies
│ │── Dockerfile # For Cloud Run deployment
│
│── frontend/
│ │── src/
│ │ │── components/ # TaskForm.js, TaskSection.js, etc.
│ │ │── context/ # AuthContext.js
│ │ │── Home.js # Main page
│ │── package.json # Frontend dependencies
│ │── build/ # Static build for Cloud Storage
│
│── README.md # This file
```

---

## How Data Flows
1. **Task Creation**:
   - User fills out `TaskForm.js` → Submits to `POST /api/tasks` → Backend saves to PostgreSQL → Socket.io emits a "notification" → Frontend displays a toast via React Toastify.
2. **Task Updates**:
   - User edits via `EditTaskModal.js` → Submits to `PUT /api/tasks/:id` → Backend updates PostgreSQL → Socket.io notifies → Frontend refreshes the UI.
3. **Task Completion/Deletion**:
   - User clicks "Mark Complete" or "Delete" in `TaskCard.js` → `PUT/DELETE /api/tasks/:id` → Backend updates/deletes in PostgreSQL → Socket.io notifies → Frontend updates.
4. **Notifications**:
   - Backend cron job (`services/cron.js`) checks deadlines → Emits reminders via Socket.io → Frontend shows alerts.

---

## API Design

### Key Endpoints
- **`POST /api/auth/signup`**  
  Register a new user.  
  - Payload: `{ email, username, password }`  
  - Response: `{ token }`
- **`POST /api/auth/login`**  
  Authenticate a user.  
  - Payload: `{ email, password }`  
  - Response: `{ token }`
- **`GET /api/tasks?userId=<id>`**  
  Fetch all tasks for a user.  
  - Headers: `Authorization: Bearer <token>`  
  - Response: `[{ id, title, description, deadline, status, reminder_minutes }, ...]`
- **`POST /api/tasks`**  
  Create a new task.  
  - Payload: `{ user_id, title, description, deadline, status, reminder_minutes }`  
  - Response: `{ id, title, ... }`
- **`PUT /api/tasks/:id`**  
  Update an existing task.  
  - Payload: `{ title, description, deadline, status, reminder_minutes }`  
  - Response: Updated task object
- **`DELETE /api/tasks/:id`**  
  Delete a task.  
  - Response: `{ message: "Task deleted" }`

### Real-Time Notifications
- **Socket.io Event**: `"notification"`  
  - Emitted on task creation, update, deletion, or reminders.  
  - Payload: String (e.g., `"Task due soon: <title>"`).

---

## Scalability & Performance
- **Cloud Run**: Scales automatically with request volume, leveraging the free tier’s 2 million requests/month. Lightweight Node.js setup minimizes cold starts.
- **Cloud Storage**: Scales infinitely via GCP’s CDN, staying within the 5 GB free storage limit for the frontend.
- **PostgreSQL**: Currently local, but can be migrated to Cloud SQL for managed scaling. Indexes on `user_id` and `deadline` would optimize queries for larger user bases.
- **Socket.io**: Efficient for real-time updates; can be enhanced with Redis for multi-user clustering if needed.
- **Optimizations**:
  - JWT authentication reduces session overhead.
  - Task queries are filtered by `userId` to limit data transfer.

---

## Sample Code

### Backend API Endpoint (`routes/tasks.js`)
```javascript
router.post('/', authenticateToken, async (req, res) => {
  const { user_id, title, description, deadline, status, reminder_minutes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (user_id, title, description, deadline, status, reminder_minutes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id, title, description, deadline, status || 'pending', reminder_minutes]
    );
    const newTask = result.rows[0];
    req.io.emit('notification', `New task added: ${title}`);
    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add task' });
  }
});
```
### Database Schema (PostgreSQL)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  reminder_minutes INTEGER
);
```
### Frontend Task Creation (TaskForm.js)
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const decoded = jwtDecode(token);
  const newTask = {
    user_id: decoded.id,
    title,
    description,
    deadline,
    status: 'pending',
    reminder_minutes: reminderMinutes,
  };
  try {
    const res = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newTask),
    });
    const addedTask = await res.json();
    setTasks((prevTasks) => [...prevTasks, addedTask]);
    toast.success('Task added successfully');
    closeForm();
  } catch (error) {
    toast.error('Failed to add task');
  }
};
```
### Notification Listener (Home.js)
```javascript
useEffect(() => {
  socket.on('notification', (message) => {
    toast.info(message);
  });
  return () => socket.off('notification');
}, [user]);
```
---
## How to Run Locally

### 1. Backend:
- cd backend
- npm install
- Set up PostgreSQL and configure .env with DB_* variables (e.g., DB_HOST, DB_USER).
- npm start

### 2. Frontend:
- cd frontend
- npm install
- npm start
