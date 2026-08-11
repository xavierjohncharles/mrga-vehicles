import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import "./Hero.css";

const carImages = [
  "/images/3cars.jpg",
  "/images/rsq3.jpg",
  "/images/car3.jpg",
  "/images/car5.jpg",
  "/images/car8.jpg",

  "/images/car10.jpg",
  "/images/car11.jpg",
  

];

// Map array indices to actual car numbers
const carNumbers = [12, 1, 3, 5, 8, 9, 10, 11];

const Hero = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % carImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getIndex = (offset) => (index + offset + carImages.length) % carImages.length;

  return (
    <div className="hero-slider-container">
      <div className="hero-caption">
          <h1 className="hero-title">
            <span className="desktop-title">
              MRGA – Premium self-drive & chauffeur experiences
            </span>
            <span className="mobile-title">
              <span className="mobile-mrga">MRGA</span>
              <span className="mobile-subtitle">
                <span className="emphasize">Premium self-drive</span>
                <span className="ampersand"> & </span>
                <span className="emphasize">chauffeur experiences</span>
              </span>
            </span>
          </h1>
          <div className="hero-actions">
            <Link to="/book" className="hero-button hero-button-primary">
              Check availability
            </Link>
            <Link to="/services" className="hero-button hero-button-secondary">
              Browse vehicles
            </Link>
          </div>
      </div>

      <div className="hero-slider">
        {[getIndex(-1), index, getIndex(1)].map((i, position) => (
          <img
            key={i}
            src={carImages[i]}
            alt={`Car ${carNumbers[i]}`}
            className={`hero-slide ${position === 1 ? "active" : "side"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero;
