import React from 'react';
import './FeaturedProducts.css';

const featuredProducts = [
  { name: 'Audi RSQ3', image: '../images/rsq3.jpg' },
  { name: 'Mercedes C300d', image: '../images/car10.jpg' },
  { name: 'Audi A7', image: '../images/audi.jpeg' }
];

const FeaturedProducts = () => (
  <section className="featured-products-section">
    <h2 className="section-title">Featured Vehicles</h2>

    <div className="featured-products-container">
      {featuredProducts.map((product, index) => (
        <a
          key={index}
          href="/services"
          className="featured-product"
        >
          <img src={product.image} alt={product.name} className="featured-product-image" />
          <p className="featured-product-name">{product.name}</p>
        </a>
      ))}
    </div>

    <div className="shop-all-wrapper">
      <a href="/services" className="shop-all-button">Shop all</a>
    </div>
  </section>
);

export default FeaturedProducts;
