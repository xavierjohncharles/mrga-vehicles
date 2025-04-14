// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Contact from './pages/Contact';
import './App.css'; // Import global styles
import Terms from './pages/Terms';

const App: React.FC = () => (
  <BrowserRouter>
    <div className="container">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="contact" element={<Contact />} />
          <Route path="terms" element={<Terms />} />
        </Route>
      </Routes>
    </div>
  </BrowserRouter>
);

export default App;