import React, { useState, useEffect } from 'react';
import './FeaturedProducts.css';

const featuredProducts = [
  { 
    name: 'Audi RSQ3', 
    coverImage: '../images/rsq3.jpg',
    images: [
      '../images/audi2.jpg',
      '../images/audi3.jpg',
      '../images/audi4.jpg',
      '../images/audi5.jpg',
      '../images/audi6.jpg',
      '../images/audi7.jpg',
      '../images/audi8.jpg'
    ]
  },
  { 
    name: 'BMW M340i', 
    coverImage: '../images/bmwm340i.jpg',
    images: [
      '../images/bmwm340i.jpg',
      '../images/bmw1.jpg',
      '../images/bmw2.jpg',
      '../images/bmw3.jpg',
      '../images/bmw4.jpg',
      '../images/bmw5.jpg',
      '../images/bmw6.jpg',
      '../images/bmw7.jpg',
      '../images/bmw8.jpg',
      '../images/bmw9.jpg',
      '../images/bmw10.jpg',
      '../images/bmw11.jpg',
      '../images/bmw12.jpg'
    ]
  },
  { 
    name: 'Audi A7', 
    coverImage: '../images/audi.jpeg',
    images: [
      '../images/a71.jpg',
      '../images/a72.jpg',
      '../images/a73.jpg',
      '../images/a74.jpg',
      '../images/a75.jpg',
      '../images/a76.jpg'
    ]
  }
];

const FeaturedProducts = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setCurrentImageIndex(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
    setCurrentImageIndex(0);
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  const handlePrevImage = () => {
    if (selectedVehicle && selectedVehicle.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedVehicle.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (selectedVehicle && selectedVehicle.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === selectedVehicle.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  return (
    <>
      <section className="featured-products-section">
        <h2 className="section-title">Featured Vehicles</h2>

        <div className="featured-products-container">
          {featuredProducts.map((product, index) => (
            <div
              key={index}
              className="featured-product"
              onClick={() => openModal(product)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openModal(product);
                }
              }}
            >
              <img src={product.coverImage} alt={product.name} className="featured-product-image" />
              <p className="featured-product-name">{product.name}</p>
            </div>
          ))}
        </div>

        <div className="shop-all-wrapper">
          <a href="/services" className="shop-all-button">Shop all</a>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && selectedVehicle && (
        <div className="vehicle-modal-overlay" onClick={handleOverlayClick}>
          <div className="vehicle-modal-container">
            <button 
              className="vehicle-modal-close" 
              onClick={closeModal}
              aria-label="Close modal"
            >
              ×
            </button>
            
            <h2 className="vehicle-modal-title">{selectedVehicle.name}</h2>
            
            <div className="vehicle-modal-gallery">
              <div className="vehicle-modal-main-image-wrapper">
                {selectedVehicle.images.length > 1 && (
                  <>
                    <button 
                      className="vehicle-modal-nav vehicle-modal-nav-prev"
                      onClick={handlePrevImage}
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button 
                      className="vehicle-modal-nav vehicle-modal-nav-next"
                      onClick={handleNextImage}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                )}
                <img 
                  src={selectedVehicle.images[currentImageIndex]} 
                  alt={`${selectedVehicle.name} view ${currentImageIndex + 1}`}
                  className="vehicle-modal-main-image"
                />
              </div>
              
              {selectedVehicle.images.length > 1 && (
                <div className="vehicle-modal-thumbnails">
                  {selectedVehicle.images.map((image, index) => (
                    <button
                      key={index}
                      className={`vehicle-modal-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => handleThumbnailClick(index)}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img src={image} alt={`Thumbnail ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeaturedProducts;
