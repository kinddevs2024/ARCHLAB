import React, { useState } from "react";
import axios from "axios";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import { TextField, Alert } from "@mui/material";

const AddUserModal = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState({
    status: "",
    name: "",
    surname: "",
    phone: "",
    address: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpen = () => setOpen(!open);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3005/api/add",
        user,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setSuccess("User added successfully!");
      setUser({
        status: "",
        name: "",
        surname: "",
        phone: "",
        address: "",
        username: "",
        email: "",
        password: "",
      });
      setTimeout(() => {
        setSuccess("");
        setOpen(false);
      }, 1500);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleOpen} variant="gradient">
        Add User
      </Button>
      <Dialog open={open} handler={handleOpen} size="md">
        <DialogHeader>Add User</DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="Status"
              name="status"
              value={user.status}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              autoComplete="status"
            />
            <TextField
              label="Name"
              name="name"
              value={user.name}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              autoComplete="given-name"
            />
            <TextField
              label="Surname"
              name="surname"
              value={user.surname}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              autoComplete="family-name"
            />
            <TextField
              label="Phone"
              name="phone"
              value={user.phone}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              autoComplete="tel"
            />
            <TextField
              label="Address"
              name="address"
              value={user.address}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              autoComplete="street-address"
            />
            <TextField
              label="Username"
              name="username"
              value={user.username}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              autoComplete="username"
            />
            <TextField
              label="Email"
              name="email"
              value={user.email}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              type="email"
              autoComplete="email"
            />
            <TextField
              label="Password"
              name="password"
              value={user.password}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              type="password"
              autoComplete="current-password"
            />
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
          </form>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={handleOpen}
            className="mr-1"
            disabled={loading}
          >
            <span>Cancel</span>
          </Button>
          <Button
            variant="gradient"
            color="green"
            onClick={handleSubmit}
            disabled={loading}
          >
            <span>{loading ? "Submitting..." : "Add User"}</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

export default AddUserModal;