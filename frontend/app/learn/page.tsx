"use client";

import React, { useState } from "react";
import Footer from "../components/Footer";

export default function LearnPage() {
  const [isLesson1Expanded, setIsLesson1Expanded] = useState(false);
  return (
    <div 
      className="min-h-screen pt-4" 
      style={{
        background: 'linear-gradient(to bottom, rgba(164, 255, 209) 0%, white 120px)'
      }}
    >
      {/* Navigation Header */}
      <nav className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-xl font-medium text-gray-800 hover:text-blue-700 transition-colors">
                Say Like a Native
              </a>
            </div>
            <div className="flex space-x-8">
              <a
                href="/"
                className="text-gray-700 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Search
              </a>
              <a
                href="/learn"
                className="text-blue-700 font-semibold px-3 py-2 text-sm transition-colors duration-200"
              >
                Learn
              </a>
              <a
                href="/pricing"
                className="text-gray-700 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Pricing
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-7xl font-medium text-gray-800 mb-6 py-8" style={{fontFamily: 'Euclid Circular A,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif'}}>Learn Natural Pronunciation</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master authentic pronunciation patterns through real conversations and interactive lessons
          </p>
        </div>

        {/* All Lessons */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Lessons</h2>
          <div className="space-y-4">
            {/* Lesson 1 - Introducing Yourself (Available) */}
            <div className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setIsLesson1Expanded(!isLesson1Expanded)}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Lorem Ipsum</h3>
                    <p className="text-sm text-gray-600">Dolor sit amet consectetur adipiscing</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white mr-4">
                    FREE
                  </div>
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {/* Expansion indicator */}
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isLesson1Expanded ? 'rotate-180' : ''}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Lesson 1 Content */}
              {isLesson1Expanded && (
                <div className="px-4 pb-4">
                  <div className="border-t border-gray-200 pt-4 space-y-4">
                    {/* Lesson Header */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2">Lorem Ipsum Dolor</h2>
                      <p className="text-gray-600">Sit amet consectetur adipiscing elit sed do eiusmod.</p>
                    </div>

                    {/* Key Phrases */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-800 mb-3">Tempor Incididunt</h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• "Ut labore et dolore magna"</li>
                        <li>• "Aliqua enim ad minim veniam"</li>
                        <li>• "Quis nostrud exercitation"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lesson 2 - Vowel Sounds (Locked) */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-60">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-gray-500 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">Lorem Ipsum</h3>
                  <p className="text-sm text-gray-400">Lorem ipsum dolor sit amet</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-400 text-white mr-4">
                  PRO
                </div>
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Lesson 3 - Consonants (Locked) */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-60">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-gray-500 font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">Consectetur Adipiscing</h3>
                  <p className="text-sm text-gray-400">Sed do eiusmod tempor incididunt</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-400 text-white mr-4">
                  PRO
                </div>
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Lesson 4 - Word Stress (Locked) */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-60">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-gray-500 font-semibold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">Ut Labore Dolore</h3>
                  <p className="text-sm text-gray-400">Magna aliqua enim ad minim</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-400 text-white mr-4">
                  PRO
                </div>
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Lesson 5 - Intonation (Locked) */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-60">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-gray-500 font-semibold">5</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">Veniam Quis</h3>
                  <p className="text-sm text-gray-400">Nostrud exercitation ullamco</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-400 text-white mr-4">
                  PRO
                </div>
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            {/* More Lessons Available */}
            <div className="flex items-center justify-center p-6 border border-gray-200 rounded-lg bg-gray-50">
              <div className="text-center">
                <p className="text-gray-600 font-medium">100+ more lessons available</p>
                <p className="text-sm text-gray-500 mt-1">
                  <a 
                    href="/pricing" 
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    Upgrade to PRO
                  </a>
                  {" "}to continue learning
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}