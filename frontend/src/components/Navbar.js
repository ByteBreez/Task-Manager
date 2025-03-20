import React, { useState, useEffect, useContext } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
});

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  // Set up socket listener for notifications
  useEffect(() => {
    socket.on("notification", (message) => {
      setNotifications((prev) => [
        { id: Date.now(), message, timestamp: new Date().toLocaleString() },
        ...prev,
      ]);
    });

    return () => socket.off("notification");
  }, []);

  // Handle notification menu
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const clearNotifications = () => {
    setNotifications([]);
    handleMenuClose();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h4"
          style={{ flexGrow: 1 }}
          sx={{ color: "white" }}
        >
          Task Manager
        </Typography>
        {user ? (
          <>
            {/* <Button color="inherit" component={Link} to="/">
              Home
            </Button> */}
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                style: {
                  maxHeight: 300,
                  width: 300,
                  backgroundColor: "#1d1d1d",
                  color: "white",
                },
              }}
            >
              {notifications.length === 0 ? (
                <MenuItem>No notifications</MenuItem>
              ) : (
                <>
                  {notifications.map((notif) => (
                    <MenuItem key={notif.id}>
                      <div>
                        <Typography variant="body2">{notif.message}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {notif.timestamp}
                        </Typography>
                      </div>
                    </MenuItem>
                  ))}
                  <MenuItem onClick={clearNotifications}>Clear All</MenuItem>
                </>
              )}
            </Menu>
            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
            <Button color="inherit" component={Link} to="/signup">
              Signup
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
