import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Film, Minus, Maximize2, X } from 'lucide-react';
import Catalog from './pages/Catalog';
import Movie from './pages/Movie';

export default function App() {
  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  return (
    <div className="app-container">
      {/* Custom Titlebar */}
      <header className="titlebar">
        <div className="titlebar-drag-region">
          <Film size={16} className="titlebar-icon" />
          <span className="titlebar-title">OpenFilms</span>
        </div>
        <div className="titlebar-controls">
          <button onClick={handleMinimize}><Minus size={16} /></button>
          <button onClick={handleMaximize}><Maximize2 size={16} /></button>
          <button onClick={handleClose} className="close-btn"><X size={16} /></button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/movie/:type/:id" element={<Movie />} />
        </Routes>
      </main>
    </div>
  );
}
