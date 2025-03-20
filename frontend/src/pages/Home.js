// src/Home.js
import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import TaskForm from '../components/TaskForm';
import TaskCard from '../components/TaskCard';
import TaskSection from '../components/TaskSection'; // Updated import
import EditTaskModal from '../components/EditTaskModal';
import { AuthContext } from '../context/AuthContext';

const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });

const Home = () => {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const { user } = useContext(AuthContext);

  // Fetch tasks and set up socket listener
  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/tasks?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        toast.error('Failed to fetch tasks');
      }
    };

    fetchTasks();

    socket.on('notification', (message) => {
      toast.info(message);
    });

    return () => socket.off('notification');
  }, [user]);

  // Task action handlers
  const handleMarkComplete = async (taskId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!res.ok) throw new Error('Failed to mark task as complete');
      const updatedTask = await res.json();
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? updatedTask : t))
      );
      toast.success('Task marked as complete ✔');
    } catch (error) {
      console.error('Error marking task as complete:', error);
      toast.error('Failed to mark task as complete');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete task');

      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleUpdateTask = (task) => {
    const utcDate = new Date(task.deadline);
    const localDeadline = utcDate.toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(' ', 'T');
    setEditTask({ ...task, deadline: localDeadline });
    setOpenModal(true);
  };

  const handleEditSubmit = async (updatedTask, submit = true) => {
    if (!submit) {
      setEditTask(updatedTask);
      return;
    }
  
    // Validate and convert deadline
    let utcDeadline;
    if (updatedTask.deadline) {
      const localDate = new Date(updatedTask.deadline);
      if (isNaN(localDate.getTime())) {
        toast.error('Invalid deadline value');
        return; // Prevent submission with invalid date
      }
      utcDeadline = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000)).toISOString();
    } else {
      toast.error('Deadline is required');
      return; // Prevent submission if deadline is missing
    }
  
    const updatedTaskData = { ...updatedTask, deadline: utcDeadline };
  
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedTaskData),
      });
  
      if (!res.ok) throw new Error('Failed to update task');
  
      const updatedTaskResponse = await res.json();
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === updatedTask.id ? updatedTaskResponse : t))
      );
      toast.success('Task updated successfully ✔');
      setOpenModal(false);
      setEditTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  // Filter tasks
  const pendingTasks = tasks.filter((task) => task.status === 'pending');
  const completedTasks = tasks.filter((task) => task.status === 'completed');

  return (
    <Container>
      <Box my={4}>
        <Typography variant="h4" gutterBottom color="white">
          Welcome, {user?.username}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d1d1d' }}>
              <CardContent>
                {showForm ? (
                  <TaskForm setTasks={setTasks} closeForm={() => setShowForm(false)} />
                ) : (
                  <Fab color="primary" onClick={() => setShowForm(true)}>
                    <AddIcon />
                  </Fab>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <TaskSection
              title="Pending Tasks"
              tasks={pendingTasks}
              onMarkComplete={handleMarkComplete}
              onDelete={handleDeleteTask}
              onUpdate={handleUpdateTask}
              isPending={true}
            />
            <Box mt={4}>
              <TaskSection
                title="Completed Tasks"
                tasks={completedTasks}
                onMarkComplete={handleMarkComplete}
                onDelete={handleDeleteTask}
                onUpdate={handleUpdateTask}
                isPending={false}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
      <EditTaskModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        task={editTask}
        onSubmit={handleEditSubmit}
      />
    </Container>
  );
};

export default Home;