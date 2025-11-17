import React from "react";
import "./About.css";

const About = () => {
  return (
    <section className="about-section">
      <div className="about-content">
        <div className="about-text">
          <h2>Who are we?</h2>
          <p>
            Established in 2024, <strong>MRGA</strong> began with a simple goal:
            to provide professional, elegant vehicle rentals for both business and
            leisure. Founded by car enthusiasts, MRGA was built on a passion for
            luxury, performance, and comfort.
          </p>
          <p>
            With a growing fleet of executive cars and an unwavering commitment
            to customer service, MRGA has become a trusted name for chauffeured
            and self-drive experiences in London and beyond.
          </p>
        </div>
        <div className="about-image">
          <img src="/images/about-car.jpg" alt="MRGA vehicle" />
        </div>
      </div>
    </section>
  );
};

export default About;
