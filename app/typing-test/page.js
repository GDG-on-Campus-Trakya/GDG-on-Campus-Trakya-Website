'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const NORMAL_WORDS = [
  'bir', 've', 'bu', 'ne', 'için', 'ile', 'olan', 'de', 'da', 'mi', 'ben', 'sen', 'o', 'biz', 'siz', 'onlar', 'şu', 'gibi', 'var', 'yok',
  'çok', 'daha', 'en', 'her', 'hiç', 'nasıl', 'neden', 'nerede', 'kim', 'hangi', 'şey', 'zaman', 'yer', 'kişi', 'gün', 'yıl', 'ay', 'hafta', 'saat', 'dakika',
  'iyi', 'kötü', 'büyük', 'küçük', 'yeni', 'eski', 'uzun', 'kısa', 'hızlı', 'yavaş', 'güzel', 'çirkin', 'kolay', 'zor', 'az', 'fazla', 'önemli', 'gereksiz', 'doğru', 'yanlış',
  'yapmak', 'olmak', 'etmek', 'gelmek', 'gitmek', 'almak', 'vermek', 'görmek', 'söylemek', 'bilmek', 'istemek', 'sevmek', 'anlamak', 'düşünmek', 'yaşamak', 'ölmek', 'yemek', 'içmek', 'uyumak', 'kalkmak',
  'ev', 'iş', 'okul', 'araba', 'bilgisayar', 'telefon', 'kitap', 'masa', 'sandalye', 'pencere', 'kapı', 'su', 'yemek', 'ekmek', 'para', 'arkadaş', 'aile', 'anne', 'baba', 'çocuk'
];

const CODE_SNIPPETS = [
  {
    lang: 'javascript',
    code: `function fib(n) {\n  if (n <= 1) return n;\n  return fib(n - 1) + fib(n - 2);\n}`
  },
  {
    lang: 'javascript',
    code: `const getData = async (url) => {\n  const res = await fetch(url);\n  const data = await res.json();\n  return data;\n};`
  },
  {
    lang: 'javascript',
    code: `class Rect {\n  constructor(w, h) {\n    this.w = w;\n    this.h = h;\n  }\n  get area() {\n    return this.w * this.h;\n  }\n}`
  },
  {
    lang: 'javascript',
    code: `const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconst sum = doubled.reduce((a, n) => a + n, 0);`
  },
  {
    lang: 'python',
    code: `def sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]`
  },
  {
    lang: 'python',
    code: `class Node:\n    def __init__(self, data):\n        self.data = data\n        self.next = None`
  },
  {
    lang: 'java',
    code: `public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
  },
  {
    lang: 'csharp',
    code: `using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}`
  },
  {
    lang: 'cpp',
    code: `#include <iostream>\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`
  },
  {
    lang: 'go',
    code: `package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}`
  },
  {
    lang: 'rust',
    code: `fn main() {\n    println!("Hello, World!");\n}`
  },
  {
    lang: 'assembly',
    code: `section .data\n    msg db \"Hello, World!\", 0xa\nsection .text\n    global _start\n_start:\n    mov eax, 4\n    mov ebx, 1\n    mov ecx, msg\n    mov edx, 13\n    int 0x80\n    mov eax, 1\n    int 0x80`
  },
  {
    lang: 'typescript',
    code: `interface User {\n    name: string;\n    id: number;\n}\nclass UserAccount {\n    name: string;\n    id: number;\n    constructor(name: string, id: number) {\n        this.name = name;\n        this.id = id;\n    }\n}`
  },
  {
    lang: 'ruby',
    code: `class Greeter\n  def initialize(name)\n    @name = name.capitalize\n  end\n  def salute\n    puts "Hello #{@name}!"\n  end\nend`
  },
  {
    lang: 'php',
    code: `<?php\nclass Greeting {\n    public $name;\n    public function __construct($name) {\n        $this->name = $name;\n    }\n    public function sayHello() {\n        echo "Hello, " . $this->name . "!";\n    }\n}\n?>`
  },
  {
    lang: 'swift',
    code: `import Swift\nstruct Greeter {\n    var name: String\n    func greet() {\n        print("Hello, \\(name)!")\n    }\n}\nlet greeter = Greeter(name: "World")\ngreeter.greet()`
  },
  {
    lang: 'kotlin',
    code: `class Greeter(val name: String) {\n    fun greet() {\n        println("Hello, $name!")\n    }\n}\nfun main() {\n    val greeter = Greeter("World")\n    greeter.greet()\n}`
  },
  {
    lang: 'scala',
    code: `object HelloWorld {\n  def main(args: Array[String]): Unit = {\n    println("Hello, world!")\n  }\n}`
  },
  {
    lang: 'perl',
    code: `use strict;\nuse warnings;\nsub greet {\n    my ($name) = @_;\n    print "Hello, $name!\n";\n}\ngreet("World");`
  },
  {
    lang: 'r',
    code: `greet <- function(name) {\n  paste("Hello,", name, "!")\n}\ngreet("World")`
  }
];

export default function TypingTest() {
  const [mode, setMode] = useState('normal'); // 'normal' or 'code'
  const [isEndless, setIsEndless] = useState(false);
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [stats, setStats] = useState(null);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const containerRef = useRef(null);

  // Generate random text based on mode (inline function to avoid dependency issues)
  const generateText = () => {
    if (mode === 'normal') {
      const wordCount = 100;
      const randomWords = [];
      for (let i = 0; i < wordCount; i++) {
        randomWords.push(NORMAL_WORDS[Math.floor(Math.random() * NORMAL_WORDS.length)]);
      }
      return randomWords.join(' ');
    } else {
      const randomSnippet = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
      return randomSnippet.code;
    }
  };

  // Reset test
  const resetTest = useCallback(() => {
    const newText = generateText();
    setText(newText);
    setInput('');
    setCurrentCharIndex(0);
    setStartTime(null);
    setIsActive(false);
    setStats(null);
    setTimeout(() => containerRef.current?.focus(), 100);
  }, [mode]);

  // Initialize text on mount and when mode changes
  useEffect(() => {
    resetTest();
  }, [mode, resetTest]);

  // Focus container on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Calculate stats
  const finishTest = (finalInput, currentText, currentStartTime) => {
    const endT = Date.now();
    setIsActive(false);

    const timeElapsed = (endT - currentStartTime) / 1000 / 60; // minutes
    const wordsTyped = finalInput.trim().split(/\s+/).length;
    const charsTyped = finalInput.length;

    // Calculate accuracy
    let correctChars = 0;
    for (let i = 0; i < Math.min(finalInput.length, currentText.length); i++) {
      if (finalInput[i] === currentText[i]) correctChars++;
    }
    const accuracy = Math.round((correctChars / currentText.length) * 100);

    // WPM calculation
    const wpm = Math.round(wordsTyped / timeElapsed);

    // Raw WPM (all characters / 5 / minutes)
    const rawWpm = Math.round((charsTyped / 5) / timeElapsed);

    setStats({
      wpm,
      rawWpm,
      accuracy,
      correctChars,
      totalChars: currentText.length,
      timeElapsed: Math.round(timeElapsed * 60)
    });
  };

  // Handle input
  const handleInput = (char) => {
    setInput(prev => {
      const newInput = prev + char;
      setCurrentCharIndex(newInput.length);

      // Check if completed
      if (newInput.length >= text.length) {
        if (isEndless) {
          // In endless mode, replace with new text and reset
          const newText = generateText();
          setText(newText);
          setTimeout(() => {
            setInput('');
            setCurrentCharIndex(0);
          }, 0);
          return newInput;
        } else {
          // In normal mode, finish the test
          finishTest(newInput, text, startTime);
        }
      }
      return newInput;
    });
  };

  // Handle keyboard input
  const handleKeyDown = (e) => {
    if (stats) return; // Don't accept input after test is finished

    // Start timer on first keydown (even before character is processed)
    if (!startTime && !isActive) {
      setStartTime(Date.now());
      setIsActive(true);
    }

    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();

      if (mode === 'code') {
        // In code mode, insert 4 spaces
        const spaces = '    ';
        handleInput(spaces);
      } else {
        // In normal mode, skip to next word/non-space
        setInput(prev => {
          setCurrentCharIndex(curr => {
            let skipTo = curr;
            while (skipTo < text.length && (text[skipTo] === ' ' || text[skipTo] === '\t')) {
              skipTo++;
            }
            if (skipTo > curr) {
              const skippedText = text.substring(curr, skipTo);
              const newInput = prev + skippedText;
              setInput(newInput);
              setCurrentCharIndex(newInput.length);
              return newInput.length;
            }
            return curr;
          });
          return prev;
        });
      }
      return;
    }

    // Handle Enter key - skip to next line
    if (e.key === 'Enter') {
      e.preventDefault();
      setInput(prev => {
        setCurrentCharIndex(curr => {
          let skipTo = curr;
          while (skipTo < text.length && text[skipTo] !== '\n') {
            skipTo++;
          }
          if (skipTo < text.length && text[skipTo] === '\n') {
            skipTo++; // Skip past the newline
          }
          if (skipTo > curr) {
            const skippedText = text.substring(curr, skipTo);
            const newInput = prev + skippedText;
            setInput(newInput);
            setCurrentCharIndex(newInput.length);
            return newInput.length;
          }
          return curr;
        });
        return prev;
      });
      return;
    }

    // Handle Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      setInput(prev => {
        if (prev.length > 0) {
          const newInput = prev.slice(0, -1);
          setCurrentCharIndex(newInput.length);
          return newInput;
        }
        return prev;
      });
      return;
    }

    // Handle regular character input
    if (e.key.length === 1) {
      e.preventDefault();
      handleInput(e.key);
    }
  };

  // Render character with color coding and opacity
  const renderedText = useMemo(() => {
    return text.split('').map((char, index) => {
      let className = 'transition-all duration-100 ';

      if (index < input.length) {
        // Typed character - opaque
        if (input[index] === char) {
          className += 'text-green-400 opacity-100';
        } else {
          className += 'text-red-400 bg-red-500/20 rounded px-0.5 opacity-100';
        }
      } else if (index === input.length) {
        // Current character - with cursor
        className += 'text-gray-400 opacity-50 bg-blue-500/30 border-b-2 border-blue-400 animate-pulse';
      } else {
        // Not yet typed - transparent/dim
        className += 'text-gray-500 opacity-30';
      }

      return (
        <span key={index} className={className}>
          {char === ' ' ? '\u00A0' : char}
          {char === '\n' ? <br /> : ''}
        </span>
      );
    });
  }, [text, input]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Yazma Hızı Testi
          </h1>
          <p className="text-gray-400">
            Yazma hızını ve doğruluğunu ölç
          </p>
        </div>

        {!stats ? (
          <div className="space-y-6 animate-fadeIn">
              {/* Controls */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    {/* Mode Selection */}
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setMode('normal')}
                        disabled={isActive}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-all ${
                          mode === 'normal'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Normal Mod
                      </button>
                      <button
                        onClick={() => setMode('code')}
                        disabled={isActive}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-all ${
                          mode === 'code'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Kod Modu
                      </button>
                    </div>

                    {/* Reset Button */}
                    <button
                      onClick={resetTest}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg"
                    >
                      Sıfırla
                    </button>
                  </div>

                  {/* Endless Mode Toggle */}
                  <div className="flex items-center justify-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEndless}
                        onChange={(e) => setIsEndless(e.target.checked)}
                        disabled={isActive}
                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-gray-300 font-medium">Sınırsız Mod</span>
                    </label>
                    <span className="text-sm text-gray-500">
                      (Yazdıkça yeni metin gelir)
                    </span>
                  </div>
                </div>

                {/* Live Stats */}
                {isActive && (
                  <div className="mt-6 flex flex-wrap gap-6 justify-center text-center">
                    <div>
                      <div className="text-3xl font-bold text-blue-400">
                        {Math.round(
                          (input.trim().split(/\s+/).length /
                            ((Date.now() - startTime) / 1000 / 60)) || 0
                        )}
                      </div>
                      <div className="text-sm text-gray-400">KDK</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-400">
                        {Math.round(
                          ((input.split('').filter((char, i) => char === text[i]).length) /
                            currentCharIndex) * 100 || 0
                        )}%
                      </div>
                      <div className="text-sm text-gray-400">Doğruluk</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-400">
                        {Math.round(((Date.now() - startTime) / 1000))}s
                      </div>
                      <div className="text-sm text-gray-400">Süre</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Display - Direct typing on this */}
              <div
                ref={containerRef}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                className="bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl shadow-xl p-6 md:p-8 overflow-hidden focus:outline-none focus:border-blue-500 cursor-text"
              >
                <div
                  className={`text-xl md:text-2xl leading-relaxed break-words ${
                    mode === 'code' ? 'font-mono text-base md:text-lg' : 'font-sans'
                  } ${mode === 'code' ? 'whitespace-pre-wrap overflow-x-auto' : 'break-words'}`}
                  style={{ userSelect: 'none', wordBreak: 'break-word' }}
                >
                  {renderedText}
                </div>
              </div>

              <div className="text-center text-sm text-gray-500">
                Yazmaya başlamak için yukarıdaki metin kutusuna tıklayın
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl p-8 animate-slideUp">
              <h2 className="text-3xl font-bold text-center mb-8 text-white">
                Test Sonuçları
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div className="text-center p-4 md:p-6 bg-blue-900/30 border border-blue-700/50 rounded-xl">
                  <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">{stats.wpm}</div>
                  <div className="text-sm text-gray-400">KDK (Kelime/Dk)</div>
                </div>
                <div className="text-center p-4 md:p-6 bg-green-900/30 border border-green-700/50 rounded-xl">
                  <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">{stats.accuracy}%</div>
                  <div className="text-sm text-gray-400">Doğruluk</div>
                </div>
                <div className="text-center p-4 md:p-6 bg-purple-900/30 border border-purple-700/50 rounded-xl">
                  <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">{stats.rawWpm}</div>
                  <div className="text-sm text-gray-400">Ham KDK</div>
                </div>
                <div className="text-center p-4 md:p-6 bg-indigo-900/30 border border-indigo-700/50 rounded-xl">
                  <div className="text-4xl md:text-5xl font-bold text-indigo-400 mb-2">{stats.timeElapsed}s</div>
                  <div className="text-sm text-gray-400">Süre</div>
                </div>
                <div className="text-center p-4 md:p-6 bg-yellow-900/30 border border-yellow-700/50 rounded-xl">
                  <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">{stats.correctChars}</div>
                  <div className="text-sm text-gray-400">Doğru Karakter</div>
                </div>
                <div className="text-center p-4 md:p-6 bg-red-900/30 border border-red-700/50 rounded-xl">
                  <div className="text-4xl md:text-5xl font-bold text-red-400 mb-2">
                    {stats.totalChars - stats.correctChars}
                  </div>
                  <div className="text-sm text-gray-400">Hata</div>
                </div>
              </div>

              <button
                onClick={resetTest}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg"
              >
                Tekrar Dene
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
