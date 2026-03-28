"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { generateSlug } from "../../lib/slug";
import Link from "next/link";

export default function PersonalityTestClient({ initialTests = [] }) {
  const [tests, setTests] = useState(initialTests);
  const [loading, setLoading] = useState(initialTests.length === 0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // If we already have SSR data, skip client fetch
    if (initialTests.length > 0) return;

    const fetchTests = async () => {
      try {
        const testsRef = collection(db, "personality_tests");
        const q = query(testsRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(q);

        const testsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const title = data.title || '';
          return {
            ...data,
            id: doc.id,
            slug: generateSlug(title),
          };
        });


        setTests(testsData);
      } catch (error) {
        console.error("Error fetching tests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [initialTests]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Testler yükleniyor...</div>
      </div>
    );
  }

  const filteredTests = tests.filter((test) => {
    const q = searchQuery.toLowerCase();
    return (
      test.title?.toLowerCase().includes(q) ||
      test.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Kişilik Testleri
          </h1>
          <p className="text-gray-400 text-lg">
            Hangi teste katılmak istersin?
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Test ara..."
              className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl py-3 pl-12 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test, index) => (
            <div
              key={test.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Link href={`/personality-test/${test.slug || generateSlug(test.title)}`}>
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
        {filteredTests.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{searchQuery ? "🔍" : "🎭"}</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {searchQuery ? "Sonuç bulunamadı" : "Henüz test yok"}
            </h2>
            <p className="text-gray-400">
              {searchQuery ? `"${searchQuery}" ile eşleşen test bulunamadı.` : "Yakında yeni testler eklenecek!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
