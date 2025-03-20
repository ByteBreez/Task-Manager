import React from 'react';
import { List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import axios from 'axios';

const TaskList = ({ tasks, setTasks }) => {
  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const handleMarkAsDone = async (id) => {
    const res = await axios.put(`http://localhost:5000/api/tasks/${id}`, { status: 'completed' }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    setTasks(prev => prev.map(task => (task.id === id ? res.data : task)));
  };

  return (
    <List>
      {tasks.map(task => (
        <ListItem
          key={task.id}
          style={{ backgroundColor: task.color }}
          secondaryAction={
            <>
              {task.status === 'pending' && (
                <IconButton onClick={() => handleMarkAsDone(task.id)}>
                  <CheckIcon />
                </IconButton>
              )}
              <IconButton onClick={() => handleDelete(task.id)}>
                <DeleteIcon />
              </IconButton>
            </>
          }
        >
          <ListItemText
            primary={task.title}
            secondary={`Description: ${task.description} | Due: ${new Date(task.deadline).toLocaleString()} | Status: ${task.status}`}
          />
        </ListItem>
      ))}
    </List>
  );
};

export default TaskList;