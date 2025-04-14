import React from "react";
import "../styles/Contact.css"; // Importing the CSS file

const Contact: React.FC = () => {
  return (
    <div>
      <h1>Contact Page</h1>
      <p>This is a simple test message.</p>
    </div>
  );
};

// const Contact: React.FC = () => {
//   return (
//     <div className="contact-container">
//       <div className="contact-card">
//         <h1>Contact Us</h1>
//         <p>Got a question? We'd love to hear from you!</p>

//         <form className="contact-form">
//           <label>Name</label>
//           <input type="text" placeholder="Your Name" />

//           <label>Email</label>
//           <input type="email" placeholder="Your Email" />

//           <label>Message</label>
//           <textarea placeholder="Your Message"></textarea>

//           <button type="submit">Send Message</button>
//         </form>
//       </div>

//       <div className="contact-info">
//         <p>📍 Location: <strong>London, UK</strong></p>
//         <p>📧 Email: <strong>info@mrga-vehicles.com</strong></p>
//         <p>📞 Phone: <strong>+44 1234 567890</strong></p>
//       </div>
//     </div>
//   );
// };

export default Contact;
