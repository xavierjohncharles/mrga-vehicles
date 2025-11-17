import React from 'react';
import './OurVehicles.css';
import vehicle1 from '../images/car1.jpg';
import vehicle2 from '../images/car2.jpg';
import vehicle3 from '../images/car3.jpg';
import vehicle4 from '../images/car4.jpg';
import vehicle5 from '../images/car5.jpg';
import vehicle6 from '../images/car6.jpg';
import vehicle7 from '../images/car7.jpg';
import vehicle8 from '../images/car8.jpg';
import vehicle9 from '../images/car9.jpg';
import vehicle10 from '../images/car10.jpg';
import vehicle11 from '../images/car11.jpg';
import vehicle12 from '../images/rsq3.jpg';
import vehicle13 from '../images/bmwm340i.jpg';



const vehicles = [
  { name: 'Audi RS Q3', image: vehicle12 },
  { name: 'Mercedes C Class Coupe C300', image: vehicle3 },
  { name: 'Mercedes A Class Saloon', image: vehicle5 },
  { name: 'Mercedes A Class Premium', image: vehicle8 },
  { name: 'Mercedes C300d', image: vehicle10 },
  { name: 'Audi A7', image: vehicle11 },
  { name: 'BMW M340i', image: vehicle13 },

];

const OurVehicles = () => (
  <section className="our-vehicles-section">
    <h2 className="section-title">Our Vehicles</h2>
    <div className="vehicle-grid">
      {vehicles.map((car, index) => (
        <a
          key={index}
          href="https://api.whatsapp.com/send?phone=447301380717"
          target="_blank"
          rel="noopener noreferrer"
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
