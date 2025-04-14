// Hero.tsx or wherever your main title is
import React from "react";
import "./Hero.css"; // If you're using CSS module, import accordingly

const Hero = () => {
  return (
    <div className="hero-container">
      <video className="hero-video" autoPlay loop muted playsInline>
        <source src="/videos/carvid.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="hero-content">
        <h1>MRGA- London Car Rentals & Chauffeurs</h1>
      </div>
    </div>
  );
};

export default Hero;
