// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import FeaturedProducts from './components/FeaturedProducts';
import OurServices from './components/OurServices';
import ContactUs from './components/ContactUs';
import FloatingWhatsAppButton from './components/FloatingWhatsAppButton';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Services from './pages/Services';
import About from './pages/About';
import HowToBook from './pages/HowToBook';
import ClientReviews from './pages/ClientReviews';
import JetClassService from './pages/JetClassService'; // ✅ Import here

import './App.css';

const ConditionalSections = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      <Header />
      {isHome && <Hero />}
      {isHome && <FeaturedProducts />}
      {isHome && <OurServices />}
      {isHome && <ContactUs />}
      <FloatingWhatsAppButton />
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <ConditionalSections />
    <Routes>
      <Route path="/" element={<></>} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/services" element={<Services />} />
      <Route path="/about" element={<About />} />
      <Route path="/how-to-book" element={<HowToBook />} />
      <Route path="/reviews" element={<ClientReviews />} />
      <Route path="/jet-class" element={<JetClassService />} /> {/* ✅ NEW ROUTE */}
    </Routes>
  </BrowserRouter>
);

export default App;
