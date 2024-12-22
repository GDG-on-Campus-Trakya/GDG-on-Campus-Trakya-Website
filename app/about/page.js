"use client";
// about/page.js
import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AboutPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect(() => {
  //   const fetchMembers = async () => {
  //     try {
  //       const membersSnapshot = await getDocs(collection(db, "members"));
  //       const membersData = membersSnapshot.docs.map((doc) => doc.data());
  //       setMembers(membersData);
  //     } catch (err) {
  //       console.error("Error fetching members:", err);
  //       setError("Failed to load members. Please try again later.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchMembers();
  // }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
      <main className="flex-1 p-10 px-5 max-w-4xl mx-auto text-center">
        <h1 className="text-5xl mb-5 text-[#4a90e2]">
          About GDG Trakya On Campus
        </h1>
        <p className="text-xl leading-relaxed mb-5 text-[#d1d1e0]">
          GDG Trakya On Campus is a community of passionate developers and
          students who come together to learn, share, and grow. Our mission is
          to empower students by providing opportunities to learn about Google
          technologies, network with industry professionals, and develop their
          skills.
        </p>
        <p className="text-xl leading-relaxed mb-5 text-[#d1d1e0]">
          Whether you're a beginner or an experienced developer, our events and
          activities are designed to help you excel and build a strong community
          of tech enthusiasts.
        </p>
        <section className="bg-white p-10 text-center mt-10 rounded-lg shadow-lg text-gray-800">
          <h2 className="text-2xl mb-8 text-[#1a1a2e]">Meet Our Members</h2>
          {loading ? (
            <p className="text-base text-gray-600">Loading members...</p>
          ) : error ? (
            <p className="text-base text-red-500">{error}</p>
          ) : members.length === 0 ? (
            <p className="text-base text-gray-600">No members found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {members.map((member, index) => (
                <div
                  key={index}
                  className="bg-gray-100 p-5 rounded-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                >
                  <img
                    src={member.photoUrl || "/default-member.png"}
                    alt={member.name || "Member Photo"}
                    className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-[#4a90e2]"
                  />
                  <p className="text-lg font-bold text-[#1a1a2e]">
                    {member.name || "Unnamed Member"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
