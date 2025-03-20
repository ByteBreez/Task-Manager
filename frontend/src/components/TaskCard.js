// src/components/TaskCard.js
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const TaskCard = ({ task, onMarkComplete, onDelete, onUpdate, isPending }) => {
  return (
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
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {task.description}
        </Typography>
        <Typography variant="body2">
          Due: {new Date(task.deadline).toLocaleString()}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: isPending ? '#ff9800' : '#4caf50' }}
        >
          Status: {task.status}
        </Typography>
        {isPending && (
          <>
            <Tooltip title="Mark as Complete">
              <IconButton sx={{ color: 'white' }} onClick={() => onMarkComplete(task.id)}>
                <CheckIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Update your Task">
              <IconButton sx={{ color: 'white' }} onClick={() => onUpdate(task)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete this Task">
              <IconButton sx={{ color: 'white' }} onClick={() => onDelete(task.id)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCard;