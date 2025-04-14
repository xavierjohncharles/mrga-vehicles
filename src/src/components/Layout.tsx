// src/components/Layout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import HeroSection from './Hero';
import FeaturedProducts from './FeaturedProducts';
import OurServices from './OurServices';
import ContactUs from './ContactUs';
import FloatingWhatsAppButton from './FloatingWhatsAppButton';


const Layout: React.FC = () => (
  <div>
    <Header />
    <HeroSection />
    <FeaturedProducts />
    <OurServices />
    <ContactUs />
    <Outlet />
    <FloatingWhatsAppButton />
  </div>
);

export default Layout;
