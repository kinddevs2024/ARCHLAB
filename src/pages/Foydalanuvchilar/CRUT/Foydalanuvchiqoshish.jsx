import React, { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Button,
} from "@material-tailwind/react";

const Foydalanuvchiqoshish = () => {
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
      const response = await fetch("http://localhost:3005/api/add-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user), // Send the user object directly
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
        setOpen(false); // Close the modal on success
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="text"
              name="name"
              label="Name"
              value={user.name}
              onChange={handleChange}
            />
            <Input
              type="text"
              name="surname"
              label="Surname"
              value={user.surname}
              onChange={handleChange}
            />
            <Input
              type="text"
              name="phone"
              label="Phone"
              value={user.phone}
              onChange={handleChange}
            />
            <Input
              type="text"
              name="address"
              label="Address"
              value={user.address}
              onChange={handleChange}
            />
            <Input
              type="text"
              name="username"
              label="Username"
              value={user.username}
              onChange={handleChange}
            />
            <Input
              type="email"
              name="email"
              label="Email"
              value={user.email}
              onChange={handleChange}
            />
            <Input
              type="password"
              name="password"
              label="Password"
              value={user.password}
              onChange={handleChange}
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

export default Foydalanuvchiqoshish;
