import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header>
      <div className="logo-wrapper">
        <Link to="/" onClick={closeMenu}>
          <img src="images/logo.png" alt="MRGA Logo" className="logo" />
        </Link>
      </div>

      <div className={`hamburger ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>

      <nav className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
        <ul>
          <li><Link to="/" onClick={closeMenu}>Home</Link></li>
          <li><Link to="/services" onClick={closeMenu}>Vehicles</Link></li>
          <li><Link to="/jet-class" onClick={closeMenu}>Chauffeur</Link></li> {/* ✅ New link */}
          <li><Link to="/about" onClick={closeMenu}>About</Link></li>
          <li><Link to="/how-to-book" onClick={closeMenu}>How to Book</Link></li>
          <li><Link to="/reviews" onClick={closeMenu}>Reviews</Link></li>
          <li><Link to="/contact" onClick={closeMenu}>Contact</Link></li>
          <li><Link to="/terms" onClick={closeMenu}>Terms and Conditions</Link></li>
          <li>
            <a
              href="https://www.instagram.com/mrga.vehicles"
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-link"
            >
              <img src="images/insta.png" alt="Instagram" className="instagram-icon" />
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
