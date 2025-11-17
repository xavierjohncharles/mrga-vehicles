import React from 'react';
import './OurServices.css';
import cameraImg from '../images/camera.jpg';
import selfHireImg from '../images/SelfHire.jpeg';
import nonCreditImg from '../images/NonCredit.jpeg';
import jetClassImg from '../images/JetClass.jpeg'; // Update path/image name as needed


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
          <img src={selfHireImg} alt="Self-Drive Hire" className="service-image" />
          <div className="service-overlay">
            <h3 className="service-title">Self-Drive Hire</h3>
            <p>
              Mid to high end luxury vehicles for day-to-day rentals and for weddings,
              birthdays, and more. Book 1–7 days for better value.
            </p>
          </div>
        </a>

        {/* Jet-Class Service */}
<a
  href="https://api.whatsapp.com/send?phone=447301380717"
  target="_blank"
  rel="noopener noreferrer"
  className="service-box"
>
  <img src={jetClassImg} alt="Jet-Class Service" className="service-image" />
  <div className="service-overlay">
    <h3 className="service-title">Jet-Class Service</h3>
    <p>
      A premium chauffeur experience tailored for elite clients. Arrive in
      luxury with exclusive, discreet service.
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
          <img src={nonCreditImg} alt="Non-Credit Check Lease" className="service-image" />
          <div className="service-overlay">
            <h3 className="service-title">Non-Credit Check Lease</h3>
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
