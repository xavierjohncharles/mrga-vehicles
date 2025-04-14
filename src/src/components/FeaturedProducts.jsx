import React from 'react';
import './FeaturedProducts.css';

const featuredProducts = [
  { name: 'AMG', image: '/images/amg.jpeg' },
  { name: 'Audi Q3 Sportsback', image: '/images/audiq3.jpeg' },
  { name: 'BMW', image: '/images/bmw.jpeg' },
];

const FeaturedProducts = () => (
  <section className="featured-products-section">
    <h2 className="section-title">Featured Vehicles</h2>

    <div className="featured-products-container">
      {featuredProducts.map((product, index) => (
        <a
          key={index}
          href="/contact#services"
          className="featured-product"
        >
          <img src={product.image} alt={product.name} className="featured-product-image" />
          <p className="featured-product-name">{product.name}</p>
        </a>
      ))}
    </div>

    <div className="shop-all-wrapper">
      <a href="/contact" className="shop-all-button">Shop all</a>
    </div>
  </section>
);

export default FeaturedProducts;
