"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import Link from "next/link";

export default function PersonalityTestSelector() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const testsRef = collection(db, "personality_tests");
        const q = query(testsRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(q);

        const testsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTests(testsData);
      } catch (error) {
        console.error("Error fetching tests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Testler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Kişilik Testleri
          </h1>
          <p className="text-gray-400 text-lg">
            Hangi teste katılmak istersin?
          </p>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test, index) => (
            <div
              key={test.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Link href={`/personality-test/${test.id}`}>
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer hover:scale-105 h-full">
                  {/* Test Image */}
                  {test.imageUrl && (
                    <div className="mb-4 rounded-2xl overflow-hidden bg-white/5">
                      <img
                        src={test.imageUrl}
                        alt={test.title}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <h2 className="text-2xl font-bold text-white mb-2">
                    {test.title}
                  </h2>

                  <p className="text-gray-300 mb-4">
                    {test.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{test.questionCount || 10} soru</span>
                    <span className="text-green-400">Başla →</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {tests.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Henüz test yok
            </h2>
            <p className="text-gray-400">
              Yakında yeni testler eklenecek!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
