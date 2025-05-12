import React, { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Button,
} from "@material-tailwind/react";

const Zadaniaberih = () => {
  const [user, setUser] = useState({
    status: "Admin",
    name: "",
    surname: "",
    phone: "",
    address: "",
    username: "",
    email: "",
    password: "",
  });

  const [open, setOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const {
        email,
        password,
        status,
        name,
        surname,
        phone,
        address,
        username,
      } = user;

      if (
        !email ||
        !password ||
        !status ||
        !name ||
        !surname ||
        !phone ||
        !address ||
        !username
      ) {
        console.error("All fields are required");
        return;
      }

      const response = await fetch("http://localhost:3005/api/add-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("User added successfully:", result);
        setUser({
          status: "Admin",
          name: "",
          surname: "",
          phone: "",
          address: "",
          username: "",
          email: "",
          password: "",
        });
        setOpen(false);
      } else if (response.status === 409) {
        console.error("User already exists");
      } else {
        console.error("Failed to add user:", response.statusText);
      }
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const toggleModal = () => setOpen(!open);

  return (
    <div>
      <Button onClick={toggleModal} color="blue">
        Add User
      </Button>
      <Dialog open={open} handler={toggleModal}>
        <DialogHeader>Add New User</DialogHeader>
        <DialogBody divider>
          <form onSubmit={handleSubmit}>
            <Input
              label="Name"
              name="name"
              value={user.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Surname"
              name="surname"
              value={user.surname}
              onChange={handleChange}
              required
            />
            <Input
              label="Phone"
              name="phone"
              value={user.phone}
              onChange={handleChange}
              required
            />
            <Input
              label="Address"
              name="address"
              value={user.address}
              onChange={handleChange}
              required
            />
            <Input
              label="Username"
              name="username"
              value={user.username}
              onChange={handleChange}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={user.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={user.password}
              onChange={handleChange}
              required
            />
          </form>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={toggleModal}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button color="green" onClick={handleSubmit}>
            Add User
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default Zadaniaberih;