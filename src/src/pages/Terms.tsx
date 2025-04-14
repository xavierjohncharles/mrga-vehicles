import React from 'react';
import Header from '../components/Header';
import './Terms.css'; // Styling for this page

const Terms = () => {
  return (
    <>
      <Header />

      <div className="terms-container">
        <h1 className="terms-title">*TERMS AND CONDITIONS*</h1>

        <div className="terms-section">
          <h2>ELIGIBILITY</h2>
          <p>Renters must be at least 20 years of age and are required to present a valid driver's license along with a DVLA check code.</p>
        </div>

        <div className="terms-section">
          <h2>RENTAL PERIOD</h2>
          <p>The rental period commences upon the collection of the vehicle and concludes upon its return. Late returns may be subject to additional charges.</p>
        </div>

        <div className="terms-section">
          <h2>PAYMENT AND DEPOSIT</h2>
          <p>All rental fees are to be settled at the time of vehicle pickup, either in cash, crypto or via bank transfer. Each deposit amount depends on the chosen vehicle and will be refunded on the same day of return.</p>
        </div>

        <div className="terms-section">
          <h2>INSURANCE</h2>
          <p>Each vehicle is covered by comprehensive insurance.</p>
        </div>

        <div className="terms-section">
          <h2>FUEL POLICY</h2>
          <p>Vehicles must be returned with a full tank of fuel; failure to do so will result in additional charges, along with an administrative fee.</p>
        </div>

        <div className="terms-section">
          <h2>MILEAGE</h2>
          <p>All of our vehicles include a mileage allowance of 150 miles per day, 1200 miles per week, and 6000 miles per month.</p>
          <p><em>*Therefore an additional charge of £1 will be applied after the initial miles per day is exceeded*</em></p>
        </div>

        <div className="terms-section">
          <h2>VEHICLE USE</h2>
          <p>Only drivers who are authorized and listed in the rental agreement are permitted to operate the vehicle.</p>
        </div>

        <div className="terms-section">
          <h2>MAINTENANCE AND REPAIRS</h2>
          <p>Renters are required to promptly report any mechanical issues. Costs resulting from unauthorized repairs may be charged to the renter.</p>
        </div>

        <div className="terms-section">
          <h2>ACCIDENTS AND DAMAGE</h2>
          <p>Any damages or accidents must be reported immediately. Responsibility for such incidents will be determined based on the rental agreement and insurance coverage.</p>
        </div>

        <div className="terms-section">
          <h2>CANCELLATION POLICY</h2>
          <p>Cancellations are free up to 48 hours before pickup. A £50 fee applies within 48 hours, and same-day cancellations incur a 100% charge.</p>
        </div>
      </div>
    </>
  );
};

export default Terms;
