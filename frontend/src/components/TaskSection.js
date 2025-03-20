// src/components/TaskSection.js
import React from "react";
import { Typography, Grid, Box } from "@mui/material";
import TaskCard from "./TaskCard";

const TaskSection = ({
  title,
  tasks,
  onMarkComplete,
  onDelete,
  onUpdate,
  isPending,
}) => {
  return (
    <>
      {tasks.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "#1d1d1d",
            p: 2,
            borderRadius: 1,
          }}
        >
          <Typography variant="h5" color="white" sx={{ mr: 2 }}>
            {title}
          </Typography>
          <Typography color="white" variant="body1">
            No {title.toLowerCase()}
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="h5" color="white" gutterBottom>
            {title}
          </Typography>
          <Grid container spacing={2}>
            {tasks.map((task) => (
              <Grid item xs={12} sm={6} key={task.id}>
                <TaskCard
                  task={task}
                  onMarkComplete={onMarkComplete}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  isPending={isPending}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </>
  );
};

export default TaskSection;
