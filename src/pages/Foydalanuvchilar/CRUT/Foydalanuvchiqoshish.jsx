import { useState } from "react";
import axios from "axios";
import { TextField, Button, Alert } from "@mui/material";

const AddUser = () => {
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
    setLoading(true); // Start loading
    console.log("Submitting user:", user);
    try {
      const response = await axios.post("http://localhost:3005/api/add", user, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setSuccess("User added successfully!");
      console.log("Backend response:", response.data); // Log the backend response
    } catch (error) {
      console.error("Error adding user:", error);
      setError(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-md space-y-4"
    >
      <h2 className="text-2xl font-bold text-center mb-4">Add User</h2>

      <TextField
        label="Status"
        name="status"
        value={user.status}
        onChange={handleChange}
        fullWidth
        required
        variant="outlined"
        autocomplete="status"
      />
      <TextField
        label="Name"
        name="name"
        value={user.name}
        onChange={handleChange}
        fullWidth
        required
        variant="outlined"
        autocomplete="given-name"
      />
      <TextField
        label="Surname"
        name="surname"
        value={user.surname}
        onChange={handleChange}
        fullWidth
        required
        variant="outlined"
        autocomplete="family-name"
      />
      <TextField
        label="Phone"
        name="phone"
        value={user.phone}
        onChange={handleChange}
        fullWidth
        required
        variant="outlined"
        autocomplete="tel"
      />
      <TextField
        label="Address"
        name="address"
        value={user.address}
        onChange={handleChange}
        fullWidth
        required
        variant="outlined"
        autocomplete="street-address"
      />
      <TextField
        label="Username"
        name="username"
        value={user.username}
        onChange={handleChange}
        fullWidth
        required
        variant="outlined"
        autocomplete="username"
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
        autocomplete="email"
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
        autocomplete="current-password"
      />

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        className="bg-blue-500 hover:bg-blue-600 text-white"
        disabled={loading} // Disable when loading
      >
        {loading ? "Submitting..." : "Add User"}
      </Button>
    </form>
  );
};

export default AddUser;
