"use client";
// admin/sponsors/page.js
import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminSponsorsPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sponsor state
  const [sponsors, setSponsors] = useState([]);

  // Sponsor form data and editing
  const [sponsorFormData, setSponsorFormData] = useState({
    firestoreId: "",
    name: "",
    img_url: "",
    website_url: "",
  });

  const router = useRouter();

  // Check if the user is admin
  useEffect(() => {
    const checkAdminPrivileges = async () => {
      if (!user) return;
      try {
        const adminRef = doc(db, "admins", user.email);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
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

  // Fetch sponsors
  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const sponsorSnapshot = await getDocs(collection(db, "sponsors"));
        setSponsors(
          sponsorSnapshot.docs.map((doc) => ({
            firestoreId: doc.id,
            ...doc.data(),
          }))
        );
      } catch (error) {
        console.error("Error fetching sponsors:", error);
      }
    };

    if (isAdmin) {
      fetchSponsors();
    }
  }, [isAdmin]);

  // Handle input changes for sponsor form
  const handleSponsorChange = (e) => {
    const { name, value } = e.target;
    setSponsorFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset sponsor form
  const resetSponsorForm = () => {
    setSponsorFormData({
      firestoreId: "",
      name: "",
      img_url: "",
      website_url: "",
    });
  };

  // Add a new sponsor
  const handleAddSponsor = async (e) => {
    e.preventDefault();
    try {
      const newSponsor = {
        name: sponsorFormData.name,
        img_url: sponsorFormData.img_url,
        website_url: sponsorFormData.website_url,
      };
      const docRef = await addDoc(collection(db, "sponsors"), newSponsor);
      setSponsors((prev) => [
        ...prev,
        { firestoreId: docRef.id, ...newSponsor },
      ]);
      resetSponsorForm();
    } catch (error) {
      console.error("Error adding sponsor:", error);
    }
  };

  // Edit an existing sponsor
  const handleEditSponsor = (sponsor) => {
    setSponsorFormData(sponsor);
  };

  // Update an existing sponsor
  const handleUpdateSponsor = async (e) => {
    e.preventDefault();
    try {
      const sponsorRef = doc(db, "sponsors", sponsorFormData.firestoreId);
      await setDoc(
        sponsorRef,
        {
          name: sponsorFormData.name,
          img_url: sponsorFormData.img_url,
          website_url: sponsorFormData.website_url,
        },
        { merge: true }
      );
      setSponsors((prev) =>
        prev.map((s) =>
          s.firestoreId === sponsorFormData.firestoreId
            ? { ...s, ...sponsorFormData }
            : s
        )
      );
      resetSponsorForm();
    } catch (error) {
      console.error("Error updating sponsor:", error);
    }
  };

  // Delete sponsor
  const handleDeleteSponsor = async (firestoreId) => {
    try {
      await deleteDoc(doc(db, "sponsors", firestoreId));
      setSponsors((prev) =>
        prev.filter((sponsor) => sponsor.firestoreId !== firestoreId)
      );
    } catch (error) {
      console.error("Error deleting sponsor:", error);
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

  const isEditing = !!sponsorFormData.firestoreId;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Admin Panel - Sponsors
      </h1>

      {/* Sponsor Form */}
      <section className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          {isEditing ? "Edit Sponsor" : "Add Sponsor"}
        </h2>
        <form
          onSubmit={isEditing ? handleUpdateSponsor : handleAddSponsor}
          className="space-y-4"
        >
          <input
            type="text"
            name="name"
            placeholder="Sponsor Name"
            value={sponsorFormData.name}
            onChange={handleSponsorChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="url"
            name="img_url"
            placeholder="Image URL"
            value={sponsorFormData.img_url}
            onChange={handleSponsorChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="url"
            name="website_url"
            placeholder="Website URL"
            value={sponsorFormData.website_url}
            onChange={handleSponsorChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />

          <button
            type="submit"
            className={`w-full ${
              isEditing ? "bg-yellow-500" : "bg-green-500"
            } text-white py-2 rounded-md hover:bg-${
              isEditing ? "yellow-600" : "green-600"
            } transition-colors`}
          >
            {isEditing ? "Update Sponsor" : "Add Sponsor"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={resetSponsorForm}
              className="w-full mt-2 bg-gray-500 text-white py-2 rounded-md"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </section>

      {/* Manage Sponsors */}
      <section className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Manage Sponsors
        </h2>
        {sponsors.length === 0 ? (
          <p className="text-gray-500">No sponsors found.</p>
        ) : (
          <ul className="space-y-4">
            {sponsors.map((sponsor) => (
              <li
                key={sponsor.firestoreId}
                className="flex justify-between items-center bg-gray-50 p-4 rounded-md shadow-sm"
              >
                <div>
                  <p className="text-lg font-medium text-gray-800">
                    {sponsor.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <a
                      href={sponsor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-600 hover:text-blue-800"
                    >
                      {sponsor.website_url}
                    </a>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSponsor(sponsor)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSponsor(sponsor.firestoreId)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
