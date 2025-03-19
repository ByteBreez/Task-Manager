import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, IconButton, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import TaskForm from '../components/TaskForm';
import { AuthContext } from '../context/AuthContext';

const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });

const Home = () => {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;

    fetch(`http://localhost:5000/api/tasks?userId=${user.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error(err));

    socket.on('notification', (message) => {
      toast.info(message);
    });

    return () => socket.off('notification');
  }, [user]);

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
            <Typography variant="h5" gutterBottom color="white">
              Your Current Tasks
            </Typography>
            <Grid container spacing={2}>
              {tasks.map(task => (
                <Grid item xs={12} sm={6} key={task.id}>
                  <Card
                    sx={{
                      backgroundColor: task.color === '#ffffff' ? '#1d1d1d' : task.color,
                      color: 'white',
                      boxShadow: 3,
                      transition: '0.3s',
                      '&:hover': { boxShadow: 6 },
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6">{task.title}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>{task.description}</Typography>
                      <Typography variant="body2">Due: {new Date(task.deadline).toLocaleString()}</Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: task.status === 'completed' ? '#4caf50' : '#ff9800' }}
                      >
                        Status: {task.status}
                      </Typography>
                      {task.status === 'pending' && (
                        <IconButton
                          sx={{ color: 'white' }}
                          onClick={async () => {
                            const res = await fetch(`http://localhost:5000/api/tasks/${task.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                              },
                              body: JSON.stringify({ status: 'completed' }),
                            });
                            const updatedTask = await res.json();
                            setTasks(prev => prev.map(t => (t.id === task.id ? updatedTask : t)));
                          }}
                        >
                          <CheckIcon />
                        </IconButton>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;