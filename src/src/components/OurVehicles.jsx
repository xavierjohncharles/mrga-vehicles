import React from 'react';
import './OurVehicles.css';
import vehicle3 from '../images/car3.jpg';
import vehicle10 from '../images/car10.jpg';
import vehicle12 from '../images/rsq3.jpg';



const vehicles = [
  { name: 'Audi RS Q3', image: vehicle12 },
  { name: 'Mercedes C Class Coupe C300', image: vehicle3 },
  { name: 'Mercedes C300d', image: vehicle10 },
];

const OurVehicles = () => (
  <section className="our-vehicles-section">
    <h2 className="section-title">Our Vehicles</h2>
    <div className="vehicle-grid">
      {vehicles.map((car, index) => (
        <a
          key={index}
          href="/book"
          className="vehicle-card"
        >
          <img src={car.image} alt={car.name} className="vehicle-img" />
          <h4>{car.name}</h4>
        </a>
      ))}
    </div>
  </section>
);

export default OurVehicles;
