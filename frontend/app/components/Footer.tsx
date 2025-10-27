import React from "react";

export default function Footer() {
  return (
    <footer
      className="text-gray-800 mt-16"
      style={{
        background:
          "linear-gradient(to top, rgba(164, 255, 209) 0%, white 400px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Say Like a Native
            </h3>
            <p className="text-gray-600 mb-4 max-w-md">
              Master authentic pronunciation patterns through real conversations
              and interactive lessons.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Search
                </a>
              </li>
              <li>
                <a
                  href="/learn"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Learn
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-800">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-300 mt-8 pt-8 text-center">
          <p className="text-gray-600 text-sm">
            © 2024 Say Like a Native. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
