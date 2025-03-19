import React, { useState, useContext } from 'react';
import { TextField, Button, Box, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const TaskForm = ({ setTasks, closeForm }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#ffffff');
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newTask = { user_id: user.id, title, description, deadline, color, status: 'pending' };
    const res = await axios.post('http://localhost:5000/api/tasks', newTask, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    setTasks(prev => [...prev, res.data]);
    setTitle('');
    setDescription('');
    setDeadline('');
    setColor('#ffffff');
    closeForm();
  };

  return (
    <Box component="form" onSubmit={handleSubmit} mb={2}>
      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth margin="normal" />
      <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth margin="normal" multiline rows={3} />
      <TextField label="Deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
      <FormControl fullWidth margin="normal">
        <InputLabel>Color</InputLabel>
        <Select value={color} onChange={(e) => setColor(e.target.value)}>
          <MenuItem value="#ffffff">White</MenuItem>
          <MenuItem value="#ffcccc">Red</MenuItem>
          <MenuItem value="#ccffcc">Green</MenuItem>
          <MenuItem value="#ccccff">Blue</MenuItem>
        </Select>
      </FormControl>
      <Button type="submit" variant="contained" color="primary">Add Task</Button>
      <Button onClick={closeForm} variant="outlined" color="secondary" sx={{ ml: 2 }}>Cancel</Button>
    </Box>
  );
};

export default TaskForm;