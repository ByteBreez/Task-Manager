import React, { useState } from 'react';
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

const TaskForm = ({ setTasks, closeForm }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(60); // Default to 1 hour
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#ffffff');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Decode the JWT to get the user ID
    const token = localStorage.getItem('token');
    let userId;
    try {
      const decoded = jwtDecode(token);
      userId = decoded.id; // Assumes your JWT payload has an 'id' field
    } catch (error) {
      console.error('Error decoding token:', error);
      toast.error('Invalid token. Please log in again.');
      return;
    }

    const newTask = {
      user_id: userId,
      title,
      description,
      deadline,
      color,
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

      if (!res.ok) throw new Error('Failed to add task');
      const addedTask = await res.json();
      setTasks((prevTasks) => [...prevTasks, addedTask]);
      toast.success('Task added successfully');
      closeForm();
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        margin="normal"
        required
        sx={{ input: { color: 'white' }, label: { color: 'white' } }}
      />
      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        margin="normal"
        multiline
        rows={3}
        sx={{ input: { color: 'white' }, label: { color: 'white' } }}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel sx={{ color: 'white' }}>Remind Me</InputLabel>
        <Select
          value={reminderMinutes}
          onChange={(e) => setReminderMinutes(e.target.value)}
          sx={{ color: 'white' }}
        >
          <MenuItem value={15}>15 minutes before</MenuItem>
          <MenuItem value={30}>30 minutes before</MenuItem>
          <MenuItem value={45}>45 minutes before</MenuItem>
          <MenuItem value={60}>1 hour before</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="Deadline"
        type="datetime-local"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
        required
        sx={{
          input: { color: 'white' },
          label: { color: 'white' },
          '& .MuiInputAdornment-root .MuiSvgIcon-root': { color: 'white' }, // Calendar icon
        }}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel sx={{ color: 'white' }}>Color</InputLabel>
        <Select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          sx={{ color: 'white' }}
        >
          <MenuItem value="#ffffff">White</MenuItem>
          <MenuItem value="#ffcccc">Red</MenuItem>
          <MenuItem value="#ccffcc">Green</MenuItem>
          <MenuItem value="#ccccff">Blue</MenuItem>
        </Select>
      </FormControl>
      <Box mt={2}>
        <Button type="submit" variant="contained" color="primary">
          Add Task
        </Button>
        <Button
          onClick={closeForm}
          variant="outlined"
          color="secondary"
          sx={{ ml: 2 }}
        >
          Cancel
        </Button>
      </Box>
    </form>
  );
};

export default TaskForm;