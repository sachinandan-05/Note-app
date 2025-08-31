import React, { useState, useEffect } from "react";

function Settings() {
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("16");
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [language, setLanguage] = useState("en");
  const [exportFormat, setExportFormat] = useState("json");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load saved preferences (using state instead of localStorage for Claude compatibility)
    const loadPreferences = () => {
      // In a real app, these would come from localStorage or API
      const savedPrefs = {
        theme: "light",
        fontSize: "16",
        autoSave: true,
        notifications: true,
        syncEnabled: false,
        language: "en",
        exportFormat: "json"
      };

      setTheme(savedPrefs.theme);
      setFontSize(savedPrefs.fontSize);
      setAutoSave(savedPrefs.autoSave);
      setNotifications(savedPrefs.notifications);
      setSyncEnabled(savedPrefs.syncEnabled);
      setLanguage(savedPrefs.language);
      setExportFormat(savedPrefs.exportFormat);

      document.body.style.fontSize = savedPrefs.fontSize + "px";
      document.body.setAttribute("data-theme", savedPrefs.theme);
    };

    loadPreferences();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Apply settings immediately
      document.body.style.fontSize = fontSize + "px";
      document.body.setAttribute("data-theme", theme);
      
      // In a real app, save to localStorage or API here
      // localStorage.setItem("preferences", JSON.stringify({
      //   theme, fontSize, autoSave, notifications, syncEnabled, language, exportFormat
      // }));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTheme("light");
    setFontSize("16");
    setAutoSave(true);
    setNotifications(true);
    setSyncEnabled(false);
    setLanguage("en");
    setExportFormat("json");
  };

  const handleExport = () => {
    const data = {
      settings: { theme, fontSize, autoSave, notifications, syncEnabled, language },
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-settings.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-2">
            Settings
          </h1>
          <p className="text-slate-600">
            Customize your Notes App experience to suit your preferences
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 font-medium">Settings saved successfully!</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appearance Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                Appearance
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Theme
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="light"
                        checked={theme === "light"}
                        onChange={(e) => setTheme(e.target.value)}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded-full mr-2"></div>
                        <span>Light Theme</span>
                      </div>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="dark"
                        checked={theme === "dark"}
                        onChange={(e) => setTheme(e.target.value)}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-slate-800 rounded-full mr-2"></div>
                        <span>Dark Theme</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Font Size: {fontSize}px
                  </label>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Small (12px)</span>
                      <span>Large (24px)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* App Behavior Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                App Behavior
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">Auto-save Notes</h3>
                    <p className="text-sm text-slate-600">Automatically save changes while typing</p>
                  </div>
                  <button
                    onClick={() => setAutoSave(!autoSave)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoSave ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoSave ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">Notifications</h3>
                    <p className="text-sm text-slate-600">Receive reminders and updates</p>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">Cloud Sync</h3>
                    <p className="text-sm text-slate-600">Sync notes across all devices</p>
                  </div>
                  <button
                    onClick={() => setSyncEnabled(!syncEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      syncEnabled ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        syncEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Language & Export Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                Advanced
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Export Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="json">JSON</option>
                    <option value="txt">Plain Text</option>
                    <option value="md">Markdown</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Actions</h2>
              
              <div className="space-y-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-300 hover:scale-105 flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Settings
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  className="w-full bg-slate-100 text-slate-700 py-3 px-6 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-300 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset to Defaults
                </button>

                <button
                  onClick={handleExport}
                  className="w-full bg-green-100 text-green-700 py-3 px-6 rounded-xl font-semibold hover:bg-green-200 transition-all duration-300 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Settings
                </button>
              </div>

              {/* Settings Summary */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Current Settings</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Theme:</span>
                    <span className="font-medium capitalize">{theme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Font Size:</span>
                    <span className="font-medium">{fontSize}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-save:</span>
                    <span className="font-medium">{autoSave ? 'On' : 'Off'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sync:</span>
                    <span className="font-medium">{syncEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;