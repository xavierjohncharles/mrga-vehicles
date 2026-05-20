// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import FloatingWhatsAppButton from './components/FloatingWhatsAppButton';
import './App.css';

const Hero = lazy(() => import('./components/Hero'));
const FeaturedProducts = lazy(() => import('./components/FeaturedProducts'));
const OurServices = lazy(() => import('./components/OurServices'));
const ContactUs = lazy(() => import('./components/ContactUs'));
const Contact = lazy(() => import('./pages/Contact'));
const Terms = lazy(() => import('./pages/Terms'));
const Services = lazy(() => import('./pages/Services'));
const About = lazy(() => import('./pages/About'));
const HowToBook = lazy(() => import('./pages/HowToBook'));
const ClientReviews = lazy(() => import('./pages/ClientReviews'));
const Book = lazy(() => import('./pages/Book'));
const JetClassService = lazy(() => import('./pages/JetClassService'));
const Admin = lazy(() => import('./pages/Admin'));

const PageLoader = () => (
  <div className="page-loader" role="status" aria-live="polite">
    <div className="page-loader-spinner" aria-hidden="true"></div>
    <p>Loading page...</p>
  </div>
);

const ConditionalSections = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      <Header />
      {isHome ? (
        <Suspense fallback={<PageLoader />}>
          <Hero />
          <FeaturedProducts />
          <OurServices />
          <ContactUs />
        </Suspense>
      ) : null}
      <FloatingWhatsAppButton />
    </>
  );
};

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ConditionalSections />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<></>} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/book" element={<Book />} />
        <Route path="/how-to-book" element={<HowToBook />} />
        <Route path="/reviews" element={<ClientReviews />} />
        <Route path="/jet-class" element={<JetClassService />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
