"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    date: "",
    time: "",
    imageUrl: "",
    location: "",
  });
  const router = useRouter();

  useEffect(() => {
    if (user) {
      console.log("User UID:", user.uid);
    }
  }, [user]);

  useEffect(() => {
    const checkAdminPrivileges = async () => {
      if (!user) return;
      try {
        const userDocRef = doc(db, "members", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().isAdmin) {
          setIsAdmin(true);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking admin privileges:", error);
        router.push("/");
      }
    };

    if (!loading && user) {
      checkAdminPrivileges();
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const membersSnapshot = await getDocs(collection(db, "members"));

        setEvents(
          eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
        setMembers(
          membersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const newEvent = {
        ...formData,
        id: events.length + 1, // Generate a new ID
      };
      const docRef = await addDoc(collection(db, "events"), newEvent);
      setEvents((prev) => [...prev, { id: docRef.id, ...newEvent }]);
      setFormData({
        id: "",
        name: "",
        description: "",
        date: "",
        time: "",
        imageUrl: "",
        location: "",
      });
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await deleteDoc(doc(db, "events", id));
      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleDeleteMember = async (id) => {
    try {
      await deleteDoc(doc(db, "members", id));
      setMembers((prev) => prev.filter((member) => member.id !== id));
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Admin Panel
      </h1>

      {/* Add Event Form */}
      <section className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Add Event</h2>
        <form onSubmit={handleAddEvent} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Event Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="description"
            placeholder="Event Description"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            name="date"
            placeholder="Event Date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="time"
            name="time"
            placeholder="Event Time"
            value={formData.time}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="url"
            name="imageUrl"
            placeholder="Image URL"
            value={formData.imageUrl}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Add Event
          </button>
        </form>
      </section>

      {/* Manage Events */}
      <section className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Manage Events
        </h2>
        {events.length === 0 ? (
          <p className="text-gray-500">No events found.</p>
        ) : (
          <ul className="space-y-4">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex justify-between items-center bg-gray-50 p-4 rounded-md shadow-sm"
              >
                <div>
                  <p className="text-lg font-medium text-gray-800">
                    {event.name}
                  </p>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Manage Members */}
      <section className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Manage Members
        </h2>
        {members.length === 0 ? (
          <p className="text-gray-500">No members found.</p>
        ) : (
          <ul className="space-y-4">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex justify-between items-center bg-gray-50 p-4 rounded-md shadow-sm"
              >
                <div>
                  <p className="text-lg font-medium text-gray-800">
                    {member.name}
                  </p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
                <button
                  onClick={() => handleDeleteMember(member.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
