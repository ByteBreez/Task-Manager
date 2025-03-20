// src/components/TaskSection.js
import React from 'react';
import { Typography, Grid } from '@mui/material';
import TaskCard from './TaskCard';

const TaskSection = ({ title, tasks, onMarkComplete, onDelete, onUpdate, isPending }) => {
  return (
    <>
      <Typography variant="h5" gutterBottom color="white">
        {title}
      </Typography>
      <Grid container spacing={2}>
        {tasks.length === 0 ? (
          <Typography color="white">No {title.toLowerCase()}</Typography>
        ) : (
          tasks.map((task) => (
            <Grid item xs={12} sm={6} key={task.id}>
              <TaskCard
                task={task}
                onMarkComplete={onMarkComplete}
                onDelete={onDelete}
                onUpdate={onUpdate}
                isPending={isPending}
              />
            </Grid>
          ))
        )}
      </Grid>
    </>
  );
};

export default TaskSection;