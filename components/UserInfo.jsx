// components/UserInfo.jsx
import React from "react";

const UserInfo = ({ user }) => {
  return (
    <div className="flex items-center gap-5 justify-center mb-10">
      <img
        src={user.photoURL || "/landing.jpg"}
        alt="Profile"
        className="w-32 h-32 rounded-full object-cover border-4 border-blue-400"
      />
      <div className="flex flex-col text-left">
        <h2 className="text-2xl font-semibold">
          {user.displayName || "No Name Provided"}
        </h2>
        <p className="text-gray-400">{user.email}</p>
      </div>
    </div>
  );
};

export default UserInfo;
