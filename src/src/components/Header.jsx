import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => (
  <header>
    <div className="logo-wrapper">
    <img src='images/logo.png' alt="MRGA Logo" className="logo" />    </div>
    <nav className="nav-links">
    <ul>
  <li><Link to="/services">Services</Link></li>
  <li><Link to="/about">About</Link></li>
  <li><Link to="/contact">Contact</Link></li>
  <li><Link to="/terms">Terms and Conditions</Link></li>
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

export default Header;
