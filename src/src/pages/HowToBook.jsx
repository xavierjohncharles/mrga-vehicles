import React from 'react';
import './HowToBook.css';

const HowToBook = () => {
  const steps = [
    '/images/How1.PNG',
    '/images/How2.PNG',
    '/images/How3.PNG',
    '/images/How4.PNG',
  ];

  const finalStep = '/images/How5.PNG'; // Add your new image here

  return (
    <section className="how-to-book-vertical">
      <h1 className="how-title">How to Book</h1>
      <div className="how-images-stack">
        {steps.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Step ${index + 1}`}
            className="how-image"
          />
        ))}
      </div>
      {/* Final image underneath */}
      <div className="how-image-bottom-wrapper">
        <img
          src={finalStep}
          alt="Final Step"
          className="how-image"
        />
      </div>
    </section>
  );
};

export default HowToBook;
