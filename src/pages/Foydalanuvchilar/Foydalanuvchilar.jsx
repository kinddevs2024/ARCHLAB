import React, { useEffect, useState } from "react";
import axios from "axios";
import Foydalanuvchiqoshish from "./CRUT/Foydalanuvchiqoshish";
import Addzadanie from "./CRUT/Addzadanie";

const Foydalanuvchilar = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]); // Add this line to define the users state

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3005/api/users" // Ensure this URL is correct
        ); // Replace with your API endpoint
        setUsers(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <div className="flex w-full items-start m-5  flex-col text-start   justify-between mb-6 mt-6">
        <div className="flex w-full items-center justify-between mb-6 mt-6">
        <h1 className="text-3xl font-bold ml-4">Foydalanuvchilar</h1>
          <Foydalanuvchiqoshish />
        </div>
        <div className="flex flex-col w-full">
          <h1 className="text-2xl font-bold ml-4">Adminlar</h1>
          <div className="flex gap-2  w-full grid-cols-6 grid-flow-row   p-3  rounded-xl text-white items-center justify-evenly mb-6 mt-6">
            <div className="flex items-center flex-wrap gap-3">
              {users
                .filter((user) => !["User", "Meneger"].includes(user.status))
                .map((user) => (
                  <div
                    className="flex gap-2  bg-blue-gray-100 grid-cols-6 grid-flow-row   p-3  rounded-xl text-white items-center justify-evenly mb-6 mt-6"
                    key={user.id}
                  >
                    <div className="flex items-center">
                      <img
                        src={user.avatar || "https://i.pravatar.cc/40"}
                        alt={user.name}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                    </div>
                    <div className="flex items-center flex-col  justify-between">
                      <div className="flex gap-3 items-center">
                        <p className="text-gray-500">{user.name}</p>
                        <p className="text-gray-500">{user.surname}</p>
                      </div>
                      <div className="flex gap-3 items-center">
                        <p className="text-gray-500">{user.username}</p>
                      </div>
                      <div className="flex gap-3 items-center"></div>
                    </div>
                    {/* add zadanie */}
                    <Addzadanie />
                  </div>
                ))}
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold ml-4">Adminlar</h1>
        <div>
          {users
            .filter((user) => ["User"].includes(user.status))
            .map((user) => (
              <div
                className="flex items-center justify-between mb-6 mt-6"
                key={user.id}
              >
                <div className="flex items-center">
                  <img
                    src={user.avatar || "https://i.pravatar.cc/40"}
                    alt={user.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-gray-500">{user.name}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-gray-500">{user.surname}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-gray-500">{user.username}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-gray-500">{user.phone}</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full border-none focus:outline-none focus:ring-0"
                      value={user.email}
                      autoComplete="email" // Correct autocomplete attribute
                      readOnly // Add this to prevent editing if necessary
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Foydalanuvchilar;
