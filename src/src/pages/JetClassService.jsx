import React from 'react';
import './JetClassService.css';

const JetClassService = () => {
  return (
    <section className="jet-class-section">
      <h1 className="jet-title">Jet-Class Service</h1>

      {/* Horizontal Media Section: 2 Images + 2 Video */}
      <div className="jet-gallery">

          <div className="jet-media">
          <video
            className="jet-video"
            src="/videos/jet-class.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>

        <div className="jet-media">
           <video
            className="jet-video"
            src="/videos/position2.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>

                <div className="jet-media">
          <video
            className="jet-video"
            src="/videos/jet-class231.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>



        <div className="jet-media">
           <video
            className="jet-video"
            src="/videos/position4.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </div>

            {/* S Class Service */}
            <div className="s-class-service">
        <h2 className="jet-title">S Class Service</h2>
        <img
          src="/images/sclass.JPEG"
          alt="S class service"
          className="how-book-image"
        />
      </div>


      {/* How to Book Image */}
      <div className="how-to-book-jet">
        <h2 className="how-book-title">How to Book</h2>
        <img
          src="/images/How5.PNG"
          alt="How to Book Jet-Class"
          className="how-book-image"
        />
      </div>
    </section>
  );
};

export default JetClassService;