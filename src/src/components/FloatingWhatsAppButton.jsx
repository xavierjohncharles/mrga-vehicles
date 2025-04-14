// FloatingWhatsAppButton.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

const FloatingWhatsAppButton = () => {
  const buttonStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#25D366',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    zIndex: '1000',
  };

  const iconStyle = {
    color: '#fff',
    fontSize: '30px',
  };

  return (
    <a
      href="https://api.whatsapp.com/send?phone=447301380717"
      target="_blank"
      rel="noopener noreferrer"
      style={buttonStyle}
    >
      <FontAwesomeIcon icon={faWhatsapp} style={iconStyle} />
    </a>
  );
};

export default FloatingWhatsAppButton;
