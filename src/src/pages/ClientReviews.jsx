import React from 'react';
import './ClientReviews.css';

const reviews = [
  '/images/review1.jpeg',
  '/images/review2.jpeg',
  '/images/review3.jpeg',
  '/images/review4.jpeg',
  '/images/review5.jpeg',
  '/images/review6.jpeg',
  '/images/review7.jpeg',
];

const ClientReviews = () => {
  return (
    <section className="client-reviews">
      <h1 className="reviews-title">Client Reviews</h1>
      <div className="reviews-gallery">
        {reviews.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Client Review ${index + 1}`}
            className="review-image"
          />
        ))}
      </div>
    </section>
  );
};

export default ClientReviews;
