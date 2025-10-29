"use client";

import React, { useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";

export default function LearnPage() {
  const [isLesson1Expanded, setIsLesson1Expanded] = useState(false);
  return (
    <div
      className="min-h-screen pt-4"
      style={{
        background:
          "linear-gradient(to bottom, rgba(164, 255, 209) 0%, white 120px)",
      }}
    >
      {/* Navigation Header */}
      <nav className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-xl font-medium text-gray-800 hover:text-blue-700 transition-colors"
              >
                Say Like a Native
              </Link>
            </div>
            <div className="flex space-x-8">
              <Link
                href="/"
                className="text-gray-700 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Search
              </Link>
              <Link
                href="/learn"
                className="text-blue-700 font-semibold px-3 py-2 text-sm transition-colors duration-200"
              >
                Learn
              </Link>
              <Link
                href="/pricing"
                className="text-gray-700 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1
            className="text-7xl font-medium text-gray-800 mb-6 py-8"
            style={{
              fontFamily:
                "Euclid Circular A,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif",
            }}
          >
            Learn Natural Pronunciation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master authentic pronunciation patterns through real conversations
            and interactive lessons
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
                    <h3 className="font-semibold text-gray-800">
                      Casual Introductions
                    </h3>
                    <p className="text-sm text-gray-600">
                      Learn relaxed greetings and informal ways to introduce
                      yourself
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white mr-4">
                    FREE
                  </div>
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  {/* Expansion indicator */}
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        isLesson1Expanded ? "rotate-180" : ""
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
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
                      <h2 className="text-xl font-bold text-gray-800 mb-2">
                        Lesson 1: Casual Introductions
                      </h2>
                      <p className="text-gray-600">
                        Learn relaxed, everyday ways to greet people, introduce
                        yourself, and start conversations like a native speaker.
                      </p>
                    </div>

                    {/* Learning Guide */}
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                      <h3 className="font-medium text-blue-800 mb-2">
                        How to Use This Lesson
                      </h3>
                      <div className="text-sm text-blue-700 space-y-2">
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                          <li>
                            Read each phrase aloud and study the explanatory
                            text to understand context and usage.
                          </li>
                          <li>
                            Watch video clips to see authentic pronunciation,
                            rhythm, and intonation.
                          </li>
                          <li>
                            Follow captions and use replay buttons to listen
                            multiple times.
                          </li>
                        </ol>
                      </div>
                    </div>

                    {/* Conversation Flow */}

                    {/* Initial Exchange */}
                    <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          1
                        </span>
                        Initial Exchange
                      </h4>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                        <div className="space-y-4">
                          <div>
                            <div className="font-medium text-blue-700 mb-2">
                              Greeting
                            </div>
                            <div className="text-gray-800 text-lg font-medium">
                              &quot;Hey, how are you?&quot;
                            </div>
                            <div className="text-sm text-gray-600 mt-2">
                              Casual greeting asking about their well-being
                            </div>
                          </div>

                          <div>
                            <div className="font-medium text-green-700 mb-2">
                              Response
                            </div>
                            <div className="text-gray-800 text-lg font-medium">
                              &quot;I&apos;m good, thanks&quot;
                            </div>
                            <div className="text-sm text-gray-600 mt-2">
                              Positive response showing you're doing well
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                            After saying <strong>"I'm good, thanks,"</strong>{" "}
                            you can ask back by saying{" "}
                            <strong>"How are you?"</strong> to see how they are,
                            or you can say <strong>"How about you?"</strong> as
                            a shorter, more casual way to return the question.
                          </div>

                          {/* YouTube Embed */}
                          <div>
                            <div className="text-xs text-gray-500 mb-2">
                              Listen to the complete exchange:
                            </div>
                            <div
                              className="relative w-full"
                              style={{ paddingBottom: "56.25%", height: 0 }}
                            >
                              <iframe
                                src="https://www.youtube-nocookie.com/embed/aXaV2RoDuGo?start=0&end=8&cc_load_policy=1&cc_lang_pref=unknown&enablejsapi=1&origin=https%3A%2F%2Fsay-like-a-native.vercel.app&modestbranding=1&rel=0&controls=2&disablekb=1&playsinline=1&widget_referrer=https%3A%2F%2Fsay-like-a-native.vercel.app"
                                className="absolute top-0 left-0 w-full h-full rounded-md"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Complete Initial Exchange - Pronunciation Example"
                              />
                            </div>

                            {/* Video Captions and Replay Button */}
                            <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                              <div className="text-base text-gray-700 italic">
                                "Hey, how are you? I'm good, how are, how are
                                you? I'm good, thanks."
                              </div>
                              <button
                                onClick={() => {
                                  const iframe = document.querySelector(
                                    'iframe[title="Complete Initial Exchange - Pronunciation Example"]'
                                  ) as HTMLIFrameElement;
                                  if (iframe) {
                                    iframe.src = iframe.src;
                                  }
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1 text-sm font-medium ml-4"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4 2a1 1 0 011 1v1.101l.755-.378a1 1 0 011.49.878v11.804a1 1 0 01-1.49.878L5 16.101V17a1 1 0 11-2 0V3a1 1 0 011-1zm7.5 6.5L9 6v8l2.5-2.5L14 14V6l-2.5 2.5z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Replay
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Getting to Know Each Other */}
                    <div className="mb-8 bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                      <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          2
                        </span>
                        Getting to Know Each Other
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                          <div className="font-medium text-green-700 mb-2">
                            Asking for Name
                          </div>
                          <div className="text-gray-800 text-lg font-medium">
                            &quot;What&apos;s your name?&quot;
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            Natural way to learn someone&apos;s name
                          </div>

                          {/* YouTube Embed */}
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-2">
                              Listen to pronunciation:
                            </div>
                            <div
                              className="relative w-full"
                              style={{ paddingBottom: "56.25%", height: 0 }}
                            >
                              <iframe
                                src="https://www.youtube-nocookie.com/embed/0m2ESZA-xv4?start=4&end=13&cc_load_policy=1&cc_lang_pref=unknown&enablejsapi=1&origin=https%3A%2F%2Fsay-like-a-native.vercel.app&modestbranding=1&rel=0&controls=2&disablekb=1&playsinline=1&widget_referrer=https%3A%2F%2Fsay-like-a-native.vercel.app"
                                className="absolute top-0 left-0 w-full h-full rounded-md"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="What's your name? - Pronunciation Example"
                              />
                            </div>

                            {/* Video Captions and Replay Button */}
                            <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                              <div className="text-base text-gray-700 italic">
                                So, what&apos;s your name? What&apos;s your
                                name?
                              </div>
                              <button
                                onClick={() => {
                                  const iframe = document.querySelector(
                                    'iframe[title="What\'s your name? - Pronunciation Example"]'
                                  ) as HTMLIFrameElement;
                                  if (iframe) {
                                    iframe.src = iframe.src;
                                  }
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 flex items-center gap-1 text-sm font-medium ml-4"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4 2a1 1 0 011 1v1.101l.755-.378a1 1 0 011.49.878v11.804a1 1 0 01-1.49.878L5 16.101V17a1 1 0 11-2 0V3a1 1 0 011-1zm7.5 6.5L9 6v8l2.5-2.5L14 14V6l-2.5 2.5z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Replay
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                          <div className="font-medium text-purple-700 mb-2">
                            Introducing Yourself
                          </div>
                          <div className="text-gray-800 text-lg font-medium">
                            &quot;I&apos;m [your name]&quot;
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            Simple, direct self-introduction
                          </div>

                          {/* YouTube Embed */}
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-2">
                              Listen to pronunciation:
                            </div>
                            <div
                              className="relative w-full"
                              style={{ paddingBottom: "56.25%", height: 0 }}
                            >
                              <iframe
                                src="https://www.youtube-nocookie.com/embed/zJ5rFV5b9Xs?start=5&end=9&cc_load_policy=1&cc_lang_pref=unknown&enablejsapi=1&origin=https%3A%2F%2Fsay-like-a-native.vercel.app&modestbranding=1&rel=0&controls=2&disablekb=1&playsinline=1&widget_referrer=https%3A%2F%2Fsay-like-a-native.vercel.app"
                                className="absolute top-0 left-0 w-full h-full rounded-md"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="I'm [your name] - Pronunciation Example"
                              />
                            </div>

                            {/* Video Captions and Replay Button */}
                            <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                              <div className="text-base text-gray-700 italic">
                                Hi, I&apos;m Tom Holland.
                              </div>
                              <button
                                onClick={() => {
                                  const iframe = document.querySelector(
                                    'iframe[title="I\'m [your name] - Pronunciation Example"]'
                                  ) as HTMLIFrameElement;
                                  if (iframe) {
                                    iframe.src = iframe.src;
                                  }
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 flex items-center gap-1 text-sm font-medium ml-4"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4 2a1 1 0 011 1v1.101l.755-.378a1 1 0 011.49.878v11.804a1 1 0 01-1.49.878L5 16.101V17a1 1 0 11-2 0V3a1 1 0 011-1zm7.5 6.5L9 6v8l2.5-2.5L14 14V6l-2.5 2.5z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Replay
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Closing the Introduction */}
                    <div className="mb-8 bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                      <h4 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          3
                        </span>
                        Closing the Introduction
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                          <div className="font-medium text-orange-700 mb-2">
                            First Meeting Response
                          </div>
                          <div className="text-gray-800 text-lg font-medium">
                            &quot;Nice to meet you&quot;
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            Standard polite response when meeting someone new
                          </div>

                          {/* YouTube Embed */}
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-2">
                              Listen to pronunciation:
                            </div>
                            <div
                              className="relative w-full"
                              style={{ paddingBottom: "56.25%", height: 0 }}
                            >
                              <iframe
                                src="https://www.youtube-nocookie.com/embed/nopWOC4SRm4?start=42&end=48&cc_load_policy=1&cc_lang_pref=unknown&enablejsapi=1&origin=https%3A%2F%2Fsay-like-a-native.vercel.app&modestbranding=1&rel=0&controls=2&disablekb=1&playsinline=1&widget_referrer=https%3A%2F%2Fsay-like-a-native.vercel.app"
                                className="absolute top-0 left-0 w-full h-full rounded-md"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Nice to meet you - Pronunciation Example"
                              />
                            </div>

                            {/* Video Captions and Replay Button */}
                            <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                              <div className="text-base text-gray-700 italic">
                                Never forget about that, cause that&apos;s all
                                we got! Nice to meet you. Nice to meet you.
                              </div>
                              <button
                                onClick={() => {
                                  const iframe = document.querySelector(
                                    'iframe[title="Nice to meet you - Pronunciation Example"]'
                                  ) as HTMLIFrameElement;
                                  if (iframe) {
                                    iframe.src = iframe.src;
                                  }
                                }}
                                className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors duration-200 flex items-center gap-1 text-sm font-medium ml-4"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4 2a1 1 0 011 1v1.101l.755-.378a1 1 0 011.49.878v11.804a1 1 0 01-1.49.878L5 16.101V17a1 1 0 11-2 0V3a1 1 0 011-1zm7.5 6.5L9 6v8l2.5-2.5L14 14V6l-2.5 2.5z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Replay
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                          <div className="font-medium text-red-700 mb-2">
                            Seeing Someone Again
                          </div>
                          <div className="text-gray-800 text-lg font-medium">
                            &quot;Great to see you&quot;
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            When you&apos;ve met before and are happy to see
                            them
                          </div>

                          {/* YouTube Embed */}
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-2">
                              Listen to pronunciation:
                            </div>
                            <div
                              className="relative w-full"
                              style={{ paddingBottom: "56.25%", height: 0 }}
                            >
                              <iframe
                                src="https://www.youtube-nocookie.com/embed/rImxuuD_kwM?start=84&end=88&cc_load_policy=1&cc_lang_pref=unknown&enablejsapi=1&origin=https%3A%2F%2Fsay-like-a-native.vercel.app&modestbranding=1&rel=0&controls=2&disablekb=1&playsinline=1&widget_referrer=https%3A%2F%2Fsay-like-a-native.vercel.app"
                                className="absolute top-0 left-0 w-full h-full rounded-md"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Great to see you - Pronunciation Example"
                              />
                            </div>

                            {/* Video Captions and Replay Button */}
                            <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                              <div className="text-base text-gray-700 italic">
                                Hey, great to see you!
                              </div>
                              <button
                                onClick={() => {
                                  const iframe = document.querySelector(
                                    'iframe[title="Great to see you - Pronunciation Example"]'
                                  ) as HTMLIFrameElement;
                                  if (iframe) {
                                    iframe.src = iframe.src;
                                  }
                                }}
                                className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors duration-200 flex items-center gap-1 text-sm font-medium ml-4"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4 2a1 1 0 011 1v1.101l.755-.378a1 1 0 011.49.878v11.804a1 1 0 01-1.49.878L5 16.101V17a1 1 0 11-2 0V3a1 1 0 011-1zm7.5 6.5L9 6v8l2.5-2.5L14 14V6l-2.5 2.5z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Replay
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cultural Notes */}
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                      <h3 className="font-medium text-yellow-800 mb-2">
                        Cultural Notes
                      </h3>
                      <div className="text-sm text-yellow-700 space-y-2">
                        <p>
                          <strong>American English:</strong> "Hey" is very
                          common and casual. Use with friends, colleagues, and
                          people your age.
                        </p>
                        <p>
                          <strong>Formality levels:</strong> These phrases work
                          well in casual to semi-formal situations. For very
                          formal settings, consider "Hello" instead of "Hey".
                        </p>
                        <p>
                          <strong>Body language:</strong> A genuine smile and
                          open posture make these phrases much more effective.
                        </p>
                      </div>
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
                  <h3 className="font-semibold text-gray-500">
                    Formal & Polite Expressions
                  </h3>
                  <p className="text-sm text-gray-400">
                    Master professional greetings and courteous language for
                    business settings
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-400 text-white mr-4">
                  PRO
                </div>
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z"
                      clipRule="evenodd"
                    />
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
                  <h3 className="font-semibold text-gray-500">
                    Simple Questions & Answers
                  </h3>
                  <p className="text-sm text-gray-400">
                    Learn to ask and answer "Where are you from?" and "What do
                    you do?"
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-400 text-white mr-4">
                  PRO
                </div>
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z"
                      clipRule="evenodd"
                    />
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
                  <h3 className="font-semibold text-gray-500">
                    Small Talk Essentials
                  </h3>
                  <p className="text-sm text-gray-400">
                    Master conversations about weather, hobbies, and daily
                    activities
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-400 text-white mr-4">
                  PRO
                </div>
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z"
                      clipRule="evenodd"
                    />
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
                  <h3 className="font-semibold text-gray-500">
                    Agreeing & Disagreeing
                  </h3>
                  <p className="text-sm text-gray-400">
                    Learn natural ways to express agreement and polite
                    disagreement
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-400 text-white mr-4">
                  PRO
                </div>
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
            {/* More Lessons Available */}
            <div className="flex items-center justify-center p-6 border border-gray-200 rounded-lg bg-gray-50">
              <div className="text-center">
                <p className="text-gray-600 font-medium">
                  100+ more lessons available
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  <a
                    href="/pricing"
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    Upgrade to PRO
                  </a>{" "}
                  to continue learning
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
