import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Fab,
  Tooltip,
  Modal,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import io from "socket.io-client";
import { toast } from "react-toastify";
import TaskForm from "../components/TaskForm";
import { AuthContext } from "../context/AuthContext";

const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
});

const Home = () => {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null); // State for the task being edited
  const [openModal, setOpenModal] = useState(false); // State for modal visibility
  const { user } = useContext(AuthContext);

  // Fetch tasks when the user changes
  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      try {
        console.log("Fetching tasks for user id:", user.id);
        const res = await fetch(
          `http://localhost:5000/api/tasks?userId=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
        const data = await res.json();
        console.log("Fetched tasks:", data);
        setTasks(data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        toast.error("Failed to fetch tasks");
      }
    };

    fetchTasks();

    socket.on("notification", (message) => {
      toast.info(message);
    });

    return () => socket.off("notification");
  }, [user]);

  // Handle marking a task as complete
  const handleMarkComplete = async (taskId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Failed to mark task as complete: ${
            errorData.message || "Server error"
          }`
        );
      }

      const updatedTask = await res.json();
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? updatedTask : t))
      );
      toast.success("Task marked as complete ✔");
    } catch (error) {
      console.error("Error marking task as complete:", error);
      toast.error(error.message);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete task");

      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  // Handle opening the edit modal
  const handleUpdateTask = (task) => {
    setEditTask(task);
    setOpenModal(true);
  };

  // Handle closing the edit modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setEditTask(null);
  };

  // Handle submitting the updated task
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `http://localhost:5000/api/tasks/${editTask.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(editTask),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Failed to update task: ${errorData.message}`);
      }

      const updatedTask = await res.json();
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === editTask.id ? updatedTask : t))
      );
      toast.success("Task updated successfully");
      handleCloseModal();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.message || "Failed to update task");
    }
  };

  return (
    <Container>
      <Box my={4}>
        <Typography variant="h4" gutterBottom color="white">
          Welcome, {user?.username}
        </Typography>
        <Grid container spacing={3}>
          {/* Task Form Section */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                minHeight: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#1d1d1d",
              }}
            >
              <CardContent>
                {showForm ? (
                  <TaskForm
                    setTasks={setTasks}
                    closeForm={() => setShowForm(false)}
                  />
                ) : (
                  <Fab color="primary" onClick={() => setShowForm(true)}>
                    <AddIcon />
                  </Fab>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Tasks List Section */}
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom color="white">
              Your Current Tasks
            </Typography>
            <Grid container spacing={2}>
              {tasks.map((task) => (
                <Grid item xs={12} sm={6} key={task.id}>
                  <Card
                    sx={{
                      backgroundColor:
                        task.color === "#ffffff" ? "#1d1d1d" : task.color,
                      color: "white",
                      boxShadow: 3,
                      transition: "0.3s",
                      "&:hover": { boxShadow: 6 },
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
                        sx={{
                          color:
                            task.status === "completed" ? "#4caf50" : "#ff9800",
                        }}
                      >
                        Status: {task.status}
                      </Typography>
                      {task.status === "pending" && (
                        <>
                          <Tooltip title="Mark as Complete">
                            <IconButton
                              sx={{ color: "white" }}
                              onClick={() => handleMarkComplete(task.id)}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Update your Task">
                            <IconButton
                              sx={{ color: "white" }}
                              onClick={() => handleUpdateTask(task)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete this Task">
                            <IconButton
                              sx={{ color: "white" }}
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {/* Edit Task Modal */}
      <Modal open={openModal} onClose={handleCloseModal}>
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
          {editTask && (
            <form onSubmit={handleEditSubmit}>
              <TextField
                label="Title"
                value={editTask.title}
                onChange={(e) =>
                  setEditTask({ ...editTask, title: e.target.value })
                }
                fullWidth
                margin="normal"
                required
                sx={{ input: { color: "white" }, label: { color: "white" } }}
              />
              <TextField
                label="Description"
                value={editTask.description || ""}
                onChange={(e) =>
                  setEditTask({ ...editTask, description: e.target.value })
                }
                fullWidth
                margin="normal"
                multiline
                rows={3}
                sx={{ input: { color: "white" }, label: { color: "white" } }}
              />
              <TextField
                label="Deadline"
                type="datetime-local"
                value={editTask.deadline.slice(0, 16)}
                onChange={(e) =>
                  setEditTask({ ...editTask, deadline: e.target.value })
                }
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
                sx={{ input: { color: "white" }, label: { color: "white" } }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ color: "white" }}>Color</InputLabel>
                <Select
                  value={editTask.color}
                  onChange={(e) =>
                    setEditTask({ ...editTask, color: e.target.value })
                  }
                  sx={{ color: "white" }}
                >
                  <MenuItem value="#ffffff">White</MenuItem>
                  <MenuItem value="#ffcccc">Red</MenuItem>
                  <MenuItem value="#ccffcc">Green</MenuItem>
                  <MenuItem value="#ccccff">Blue</MenuItem>
                </Select>
              </FormControl>
              <Box mt={2}>
                <Button type="submit" variant="contained" color="primary">
                  Save Changes
                </Button>
                <Button
                  onClick={handleCloseModal}
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
    </Container>
  );
};

export default Home;
