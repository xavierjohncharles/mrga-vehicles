import React from 'react';
import './OurServices.css';
import cameraImg from '../images/camera.jpg';
import selfHireImg from '../images/SelfHire.jpeg';
import nonCreditImg from '../images/NonCredit.jpeg';

const OurServices = () => {
  return (
    <section className="our-services-section">
      <h2 className="section-title">Our Services</h2>
      <div className="services-grid">
        {/* Photoshoot Hire */}
        <a
          href="https://api.whatsapp.com/send?phone=447301380717"
          target="_blank"
          rel="noopener noreferrer"
          className="service-box"
        >
          <img src={cameraImg} alt="Photoshoot Hire" className="service-image" />
          <div className="service-overlay">
            <h3 className="service-title">Photoshoot Hire</h3>
            <p>Hire any vehicle for Photo or Video shoot at an hourly rate.</p>
          </div>
        </a>

        {/* Self-drive Hire */}
        <a
          href="https://api.whatsapp.com/send?phone=447301380717"
          target="_blank"
          rel="noopener noreferrer"
          className="service-box"
        >
          <img src={selfHireImg} alt="Hire" className="service-image" />
          <div className="service-overlay">
            <h3 className="service-title">Hire</h3>
            <p>
              Mid to high end luxury vehicles for day-to-day rentals and for weddings,
              birthdays, and more. Book 1–7 days for better value.
            </p>
          </div>
        </a>

        {/* Non-credit Check Lease */}
        <a
          href="https://api.whatsapp.com/send?phone=447301380717"
          target="_blank"
          rel="noopener noreferrer"
          className="service-box"
        >
          <img src={nonCreditImg} alt="Non-credit Check Lease" className="service-image" />
          <div className="service-overlay">
            <h3 className="service-title">Non-credit Check Lease</h3>
            <p>
              Lease with unlimited mileage, maintenance covered, and flexible terms.
              Insurance required.
            </p>
          </div>
        </a>
      </div>
    </section>
  );
};

export default OurServices;
