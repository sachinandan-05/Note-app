import React from "react";

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-t border-slate-600 mt-8 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-wide">Notes App</span>
          </div>
          
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
          
          <p className="text-slate-300 font-medium tracking-wide text-center">
            &copy; 2025 Notes App. All rights reserved.
          </p>
          
          <div className="flex space-x-6 text-slate-400 text-sm">
            <span className="hover:text-slate-200 transition-colors duration-300 cursor-pointer">Privacy Policy</span>
            <span className="text-slate-600">•</span>
            <span className="hover:text-slate-200 transition-colors duration-300 cursor-pointer">Terms of Service</span>
            <span className="text-slate-600">•</span>
            <span className="hover:text-slate-200 transition-colors duration-300 cursor-pointer">Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;