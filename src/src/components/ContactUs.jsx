import React, { useState } from 'react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    service: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic
  };
  
  return (
    <section style={styles.container}>
      <h2 style={styles.heading}>Contact Us</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>First Name *</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Phone *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Service</label>
          <select
            name="service"
            value={formData.service}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="">Select Service</option>
            <option value="carRental">Car Rental</option>
            <option value="nonCreditLease">Non-Credit Check Lease</option>
            <option value="photoshootHire">Photo-Shoot Hire</option>
          </select>
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Message *</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            style={styles.textarea}
            required
          ></textarea>
        </div>
        <button type="submit" style={styles.button}>Submit</button>
      </form>
      <div style={styles.m9Footer}>
  <div style={styles.m9FooterColumn}>
    <h4 style={styles.m9FooterHeading}>Company information</h4>
    <p style={styles.m9FooterText}>MRGA LTD</p>
    <p style={styles.m9FooterText}>447301380717</p>
  </div>

  <div style={styles.m9FooterColumnCenter}>
    <a href="/terms" style={styles.m9FooterLink}>Terms and conditions</a>
  </div>

  <div style={styles.m9FooterColumn}>
    <h4 style={styles.m9FooterHeading}>Location</h4>
    <p style={styles.m9FooterText}>20–22 Wenlock Road</p>
    <p style={styles.m9FooterText}>London</p>
    <p style={styles.m9FooterText}>N1 7TA</p>
  </div>

  <div style={styles.m9FooterColumn}>
    <h4 style={styles.m9FooterHeading}>Contact</h4>
    <p style={styles.m9FooterText}>mgra.vehicles@gmail.com</p>
    <p style={styles.m9FooterText}>(07301380717)</p>
  </div>
</div>

    </section>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: 'white',
    color: 'black',
  },
  heading: {
    fontSize: '24px',
    marginBottom: '20px',
    textAlign: 'center',
    color: 'black',
  },
  subheading: {
    fontSize: '20px',
    marginTop: '40px',
    marginBottom: '10px',
    color: 'black',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: 'black',
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    color: 'black',
    backgroundColor: 'white',
  },
  select: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    color: 'black',
    backgroundColor: 'white',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    minHeight: '100px',
    color: 'black',
    backgroundColor: 'white',
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  companyInfo: {
    marginTop: '40px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    color: 'black',
  },
  text: {
    margin: '5px 0',
  },
  m9Footer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '60px 40px',
    backgroundColor: '#f9f9f9', // Changed from dark
    color: 'black',             // Changed from white
    fontFamily: 'Arial, sans-serif',
  },
  m9FooterColumn: {
    flex: '1 1 200px',
    margin: '10px 20px',
  },
  m9FooterColumnCenter: {
    flex: '1 1 100%',
    textAlign: 'center',
    marginTop: '20px',
  },
  m9FooterHeading: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: 'black',
  },
  m9FooterText: {
    fontSize: '14px',
    marginBottom: '5px',
    color: 'black',
  },
  m9FooterLink: {
    color: '#003cff', // Still blue for visibility
    textDecoration: 'none',
    fontSize: '14px',
  },
  m9FooterLinkHover: {
    textDecoration: 'underline',
  },
};
export default ContactUs;