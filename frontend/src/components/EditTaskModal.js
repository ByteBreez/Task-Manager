import React from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const EditTaskModal = ({ open, onClose, task, onSubmit }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(task, true);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "#1d1d1d",
          color: "white",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Edit Task
        </Typography>
        {task && (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Title"
              value={task.title}
              onChange={(e) =>
                onSubmit({ ...task, title: e.target.value }, false)
              }
              fullWidth
              margin="normal"
              required
              sx={{ input: { color: "white" }, label: { color: "white" } }}
            />
            <TextField
              label="Description"
              value={task.description || ""}
              onChange={(e) =>
                onSubmit({ ...task, description: e.target.value }, false)
              }
              fullWidth
              margin="normal"
              multiline
              rows={3}
              sx={{ input: { color: "white" }, label: { color: "white" } }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ color: "white" }}>Remind Me</InputLabel>
              <Select
                value={task.reminder_minutes || 60}
                onChange={(e) =>
                  onSubmit({ ...task, reminder_minutes: e.target.value }, false)
                }
                sx={{ color: "white" }}
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
              value={task.deadline}
              onChange={(e) =>
                onSubmit({ ...task, deadline: e.target.value }, false)
              }
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
              sx={{
                input: { color: "white" },
                label: { color: "white" },
                "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                  color: "white",
                },
              }}
            />
            <Box mt={2}>
              <Button type="submit" variant="contained" color="primary">
                Save Changes
              </Button>
              <Button
                onClick={onClose}
                variant="outlined"
                color="secondary"
                sx={{ ml: 2 }}
              >
                Cancel
              </Button>
            </Box>
          </form>
        )}
      </Box>
    </Modal>
  );
};

export default EditTaskModal;
