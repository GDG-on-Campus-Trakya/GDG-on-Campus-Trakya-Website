"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function PersonalityTestPage() {
  const params = useParams();
  const testId = params.testId;

  const [testData, setTestData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const testDoc = await getDoc(doc(db, "personality_tests", testId));

        if (testDoc.exists()) {
          setTestData({ id: testDoc.id, ...testDoc.data() });
        } else {
          console.error("Test not found");
        }
      } catch (error) {
        console.error("Error fetching test:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  const handleOptionSelect = (questionIndex, option) => {
    setAnswers({
      ...answers,
      [questionIndex]: option
    });
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < testData.questions.length) {
      alert("Lütfen tüm soruları cevaplayın!");
      return;
    }
    setShowResult(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getResult = () => {
    const scores = {};

    // Calculate scores from all answers
    Object.values(answers).forEach(answer => {
      Object.entries(answer.points).forEach(([app, points]) => {
        scores[app] = (scores[app] || 0) + points;
      });
    });

    // Find the app with highest score
    let maxScore = 0;
    let resultKey = Object.keys(testData.results)[0];

    Object.entries(scores).forEach(([app, score]) => {
      if (score > maxScore) {
        maxScore = score;
        resultKey = app;
      }
    });

    return testData.results[resultKey];
  };

  const resetTest = () => {
    setAnswers({});
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shareOnTwitter = () => {
    const result = getResult();
    const text = `Ben ${result.title}'im! ${testData.title} testini dene! GDG on Campus Trakya Üniversitesi`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const result = getResult();
    const text = `Ben ${result.title}'im! ${testData.title} testini dene: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Test yükleniyor...</div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white mb-4">Test bulunamadı</h2>
          <Link href="/personality-test">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
              Testlere Dön
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (showResult) {
    const result = getResult();

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Sonucun Hazır!</h1>
              <p className="text-gray-300">{testData.title}</p>
            </div>

            {/* Result Card */}
            <div
              className="bg-white/20 backdrop-blur rounded-2xl p-8 mb-6 border-4 shadow-xl"
              style={{ borderColor: result.color }}
            >
              <div className="text-center mb-6">
                {/* Result Image */}
                {result.imageUrl && (
                  <div className="mb-6 flex justify-center">
                    <img
                      src={result.imageUrl}
                      alt={result.title}
                      className="max-w-full h-auto mx-auto object-contain border-4 border-white/30 shadow-2xl rounded-lg"
                    />
                  </div>
                )}

                <h2 className="text-5xl font-bold text-white mb-2" style={{ textShadow: `0 0 20px ${result.color}` }}>
                  {result.title}
                </h2>
              </div>

              <p className="text-xl text-white/90 mb-6 leading-relaxed text-center">
                {result.description}
              </p>

              {/* Traits */}
              {result.traits && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {result.traits.map((trait, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-white/20 rounded-full text-white font-semibold text-sm"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Share Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={shareOnTwitter}
                className="w-full py-4 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🐦</span>
                Twitter'da Paylaş
              </button>
              <button
                onClick={shareOnWhatsApp}
                className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>💬</span>
                WhatsApp'ta Paylaş
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={resetTest}
                className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg transition-all border border-white/30"
              >
                Testi Tekrar Çöz
              </button>

              <Link href="/personality-test">
                <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all">
                  Diğer Testlere Bak
                </button>
              </Link>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                GDG on Campus Trakya Üniversitesi
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const progress = (Object.keys(answers).length / testData.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <Link href="/personality-test">
              <button className="text-gray-400 hover:text-white transition-colors">
                ← Geri
              </button>
            </Link>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            {testData.title}
          </h1>
          <p className="text-center text-gray-300 mb-4">{testData.description}</p>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="text-center text-white/70 text-sm">
            {answeredCount} / {testData.questions.length} soru cevaplandı
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {testData.questions.map((question, questionIndex) => {
            const colors = [
              "from-red-500 to-pink-600",
              "from-blue-500 to-cyan-600",
              "from-yellow-500 to-orange-600",
              "from-green-500 to-emerald-600"
            ];

            const shapes = ["🔴", "🔷", "🟡", "🟢"];

            return (
              <div
                key={questionIndex}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-white/20"
              >
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                  {questionIndex + 1}. {question.question}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = answers[questionIndex] === option;

                    return (
                      <button
                        key={optionIndex}
                        onClick={() => handleOptionSelect(questionIndex, option)}
                        className={`
                          bg-gradient-to-r ${colors[optionIndex]}
                          p-4 md:p-6 rounded-xl text-white font-semibold text-base md:text-lg
                          transition-all
                          flex items-center gap-3
                          ${isSelected ? "ring-4 ring-white scale-105" : "hover:scale-105"}
                          active:scale-95
                        `}
                      >
                        <span className="text-2xl md:text-3xl">{shapes[optionIndex]}</span>
                        <span className="text-left flex-1">{option.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="mt-8 sticky bottom-4">
          <button
            onClick={handleSubmit}
            disabled={answeredCount < testData.questions.length}
            className={`
              w-full py-4 rounded-xl font-bold text-xl transition-all
              ${answeredCount === testData.questions.length
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-105 active:scale-95"
                : "bg-gray-600 text-gray-300 cursor-not-allowed opacity-50"
              }
            `}
          >
            {answeredCount === testData.questions.length
              ? "Sonucu Gör! 🎉"
              : `Sonucu görmek için ${testData.questions.length - answeredCount} soru daha cevaplayın`
            }
          </button>
        </div>
      </div>
    </div>
  );
}
