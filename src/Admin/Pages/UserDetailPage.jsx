import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import backgroundImage from '../pics/bg.png';
import axiosInstance from "../../api/axiosInstance";

function UserDetailPage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axiosInstance
      .get(`/admin/users/${userId}`)
      .then((response) => {
        setUser(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError("Error fetching user details");
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  // Construct the image URL
  const userImageUrl = user?.image 
    ? `${process.env.REACT_APP_API_URL}/images/${user.image}` 
    : "https://via.placeholder.com/150";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-blue-600 p-4"
          style={{
            backgroundColor: '#93C2E5',
            borderColor: '#93C2E5',
          }}>
          <h1 className="w-full px-4 py-2 text-white text-center font-bold">
            User Details
          </h1>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <img
              className="h-20 w-20 rounded-full mx-auto mb-4"
              src={userImageUrl}
              alt="User"
            />
          </div>
          <div className="mb-4">
            <p className="text-gray-700 font-semibold">Username:</p>
            <p className="text-gray-900">{user.username}</p>
          </div>
          <div className="mb-4">
            <p className="text-gray-700 font-semibold">Email:</p>
            <p className="text-gray-900">{user.email}</p>
          </div>
          <div className="mb-4">
            <p className="text-gray-700 font-semibold">Age:</p>
            <p className="text-gray-900">{user.age}</p>
          </div>
          <div className="mb-4">
            <p className="text-gray-700 font-semibold">Address:</p>
            <p className="text-gray-900">{user.adress}</p>
          </div>
          {/* Add more user details as needed */}
        </div>
      </div>
    </div>
  );
}

export default UserDetailPage;
