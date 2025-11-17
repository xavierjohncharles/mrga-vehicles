import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './ContactUs.css';

// Import Google Font in <head> in public/index.html:
// <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap" rel="stylesheet">

const ContactUs = () => {
  const location = useLocation();
  const isContactPage = location.pathname === '/contact';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    service: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add form submission logic
  };

  return (
    <section className={`contact-us-section ${isContactPage ? 'contact-page-spacing' : ''}`}>
      <div className="contact-title-area">
        <h2 className="contact-heading">Contact Us</h2>
        <p className="contact-subheading">
          Interested in working together? Fill out some info and we will be in touch shortly.
          We can’t wait to hear from you!
        </p>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group half-width">
            <label>First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
          </div>
          <div className="form-group half-width">
            <label>Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Service</label>
          <select name="service" value={formData.service} onChange={handleChange}>
            <option value="">Select Service</option>
            <option value="carRental">Car Rental</option>
            <option value="nonCreditLease">Non-Credit Check Lease</option>
            <option value="photoshootHire">Photo-Shoot Hire</option>
          </select>
        </div>

        <div className="form-group">
          <label>Message</label>
          <textarea name="message" value={formData.message} onChange={handleChange} required />
        </div>

        <button type="submit" className="submit-btn">Send</button>
      </form>

      <div className="m9-footer">
        <div className="m9-footer-col">
          <h4>Company information</h4>
          <p>MRGA LTD</p>
          <p>Company number: 6105420</p>
        </div>
        <div className="m9-footer-col">
          <h4>Location</h4>
          <p>20 Wenlock Road</p>
          <p>London</p>
          <p>N1 7GU</p>
        </div>
        <div className="m9-footer-col center">
          <a href="/terms">Terms and conditions</a>
        </div>
        <div className="m9-footer-col">
          <h4>Contact</h4>
          <p>mgra.vehicles@gmail.com</p>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
