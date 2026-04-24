import React, { useEffect, useState } from 'react';
import { bookingVehicles, getBookingVehicle } from '../data/bookingVehicles';
import { createBookingRequest, fetchVehicleAvailability } from '../services/bookingService';
import {
  blockTouchesDay,
  buildDefaultDateRange,
  formatDateTimeRange,
  formatMoney,
  getCalendarDays,
  getDayLabel,
  getDayNumber,
  getDurationLabel,
  getMonthLabel,
  isSameDay,
  overlaps,
  toInputDateTimeValue,
  type AvailabilityBlock,
} from '../utils/booking';
import './Book.css';

const defaultRange = buildDefaultDateRange();

const Book = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState(bookingVehicles[0].id);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [currentMonth, setCurrentMonth] = useState(
    new Date(defaultRange.start.getFullYear(), defaultRange.start.getMonth(), 1)
  );
  const [formData, setFormData] = useState({
    clientName: '',
    vehicleId: bookingVehicles[0].id,
    startAt: toInputDateTimeValue(defaultRange.start),
    endAt: toInputDateTimeValue(defaultRange.end),
    price: '',
  });

  useEffect(() => {
    let ignore = false;

    const loadAvailability = async () => {
      setIsLoadingAvailability(true);
      setLoadError('');

      try {
        const blocks = await fetchVehicleAvailability(selectedVehicleId);

        if (!ignore) {
          setAvailabilityBlocks(blocks);
        }
      } catch {
        if (!ignore) {
          setAvailabilityBlocks([]);
          setLoadError('Availability could not be loaded. You can still complete the booking form.');
        }
      } finally {
        if (!ignore) {
          setIsLoadingAvailability(false);
        }
      }
    };

    loadAvailability();

    return () => {
      ignore = true;
    };
  }, [selectedVehicleId]);

  const selectedVehicle = getBookingVehicle(selectedVehicleId);
  const requestedStart = formData.startAt ? new Date(formData.startAt) : null;
  const requestedEnd = formData.endAt ? new Date(formData.endAt) : null;
  const today = new Date();
  const calendarDays = getCalendarDays(currentMonth);

  let validationMessage = '';

  if (!formData.clientName.trim()) {
    validationMessage = 'Client name is required.';
  } else if (!formData.startAt || !formData.endAt) {
    validationMessage = 'Please choose both the start and end date/time.';
  } else if (!requestedStart || !requestedEnd || requestedEnd <= requestedStart) {
    validationMessage = 'The end date/time must be after the start date/time.';
  } else if (requestedStart < today) {
    validationMessage = 'Bookings must start in the future.';
  } else if (!formData.price || Number(formData.price) <= 0) {
    validationMessage = 'Price for the booking is required.';
  }

  const conflictingBlock =
    !validationMessage && requestedStart && requestedEnd
      ? availabilityBlocks.find((block) =>
          overlaps(requestedStart, requestedEnd, new Date(block.startAt), new Date(block.endAt))
        )
      : undefined;

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setSubmitState(null);

    if (name === 'vehicleId') {
      setSelectedVehicleId(value);
    }

    setFormData((currentState) => ({
      ...currentState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState(null);

    if (validationMessage || conflictingBlock || !requestedStart || !requestedEnd) {
      setSubmitState({
        type: 'error',
        message:
          validationMessage ||
          `This vehicle is already blocked for ${formatDateTimeRange(
            conflictingBlock!.startAt,
            conflictingBlock!.endAt
          )}.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newBlock = await createBookingRequest({
        clientName: formData.clientName.trim(),
        vehicleId: formData.vehicleId,
        vehicleName: selectedVehicle.name,
        startAt: requestedStart,
        endAt: requestedEnd,
        price: Number(formData.price),
      });

      setAvailabilityBlocks((currentState) =>
        [...currentState, newBlock].sort(
          (left, right) =>
            new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
        )
      );
      setSubmitState({
        type: 'success',
        message:
          'Booking request submitted. The selected vehicle has been blocked as pending for these dates.',
      });
      setFormData((currentState) => ({
        ...currentState,
        clientName: '',
        price: '',
      }));
    } catch {
      setSubmitState({
        type: 'error',
        message: 'Booking submission failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="book-page">
      <div className="book-hero">
        <div className="book-hero-copy">
          <p className="book-eyebrow">MRGA booking system</p>
          <h1>Booking form &amp; calendar</h1>
          <p className="book-hero-text">
            Customers can now check live vehicle availability, choose their booking window,
            and send a booking request from one page.
          </p>
        </div>

        <div className="book-hero-stats">
          <div className="book-stat-card">
            <span className="book-stat-label">Selected vehicle</span>
            <strong>{selectedVehicle.shortName}</strong>
          </div>
          <div className="book-stat-card">
            <span className="book-stat-label">Booking status</span>
            <strong>{conflictingBlock ? 'Unavailable' : 'Available to request'}</strong>
          </div>
        </div>
      </div>

      <div className="book-layout">
        <div className="booking-card availability-card">
          <div className="booking-card-header">
            <div>
              <h2>Vehicle availability</h2>
              <p>Choose a vehicle to see which dates are currently blocked.</p>
            </div>
            {isLoadingAvailability ? <span className="booking-badge">Loading</span> : null}
          </div>

          <div className="vehicle-picker" role="tablist" aria-label="Vehicle availability tabs">
            {bookingVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                className={`vehicle-pill ${
                  selectedVehicleId === vehicle.id ? 'vehicle-pill-active' : ''
                }`}
                onClick={() => {
                  setSelectedVehicleId(vehicle.id);
                  setFormData((currentState) => ({
                    ...currentState,
                    vehicleId: vehicle.id,
                  }));
                  setSubmitState(null);
                }}
              >
                {vehicle.shortName}
              </button>
            ))}
          </div>

          <div className="selected-vehicle-summary">
            <h3>{selectedVehicle.name}</h3>
            <p>{selectedVehicle.summary}</p>
          </div>

          <div className="calendar-toolbar">
            <button
              type="button"
              className="calendar-nav"
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                )
              }
            >
              Previous
            </button>
            <strong>{getMonthLabel(currentMonth)}</strong>
            <button
              type="button"
              className="calendar-nav"
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                )
              }
            >
              Next
            </button>
          </div>

          <div className="calendar-grid calendar-headings" aria-hidden="true">
            {calendarDays.slice(0, 7).map((day) => (
              <span key={day.toISOString()} className="calendar-heading">
                {getDayLabel(day)}
              </span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = isSameDay(day, today);
              const dayBlocked = availabilityBlocks.some((block) => blockTouchesDay(block, day));
              const insideSelectedRange =
                requestedStart &&
                requestedEnd &&
                overlaps(
                  new Date(day.getFullYear(), day.getMonth(), day.getDate()),
                  new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1),
                  requestedStart,
                  requestedEnd
                );

              return (
                <div
                  key={day.toISOString()}
                  className={`calendar-day ${!isCurrentMonth ? 'calendar-day-muted' : ''} ${
                    dayBlocked ? 'calendar-day-blocked' : 'calendar-day-open'
                  } ${isToday ? 'calendar-day-today' : ''} ${
                    insideSelectedRange ? 'calendar-day-selected' : ''
                  }`}
                >
                  <span className="calendar-day-number">{getDayNumber(day)}</span>
                  <span className="calendar-day-state">
                    {dayBlocked ? 'Unavailable' : 'Open'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="calendar-legend">
            <span>
              <i className="legend-swatch legend-open"></i>
              Open
            </span>
            <span>
              <i className="legend-swatch legend-selected"></i>
              Selected booking range
            </span>
            <span>
              <i className="legend-swatch legend-blocked"></i>
              Unavailable
            </span>
          </div>

          {loadError ? <p className="booking-inline-message">{loadError}</p> : null}
        </div>

        <div className="booking-card form-card">
          <div className="booking-card-header">
            <div>
              <h2>Booking form</h2>
              <p>Capture the four details you asked for and prevent clashes before submit.</p>
            </div>
          </div>

          <form className="booking-form" onSubmit={handleSubmit}>
            <label className="booking-field">
              <span>Client&apos;s name</span>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleFieldChange}
                placeholder="Enter client name"
                autoComplete="name"
              />
            </label>

            <label className="booking-field">
              <span>Client&apos;s vehicle</span>
              <select
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleFieldChange}
              >
                {bookingVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.shortName}
                  </option>
                ))}
              </select>
            </label>

            <div className="booking-field">
              <span>Dates &amp; times for the booking</span>
              <div className="datetime-grid">
                <label>
                  <span>Start</span>
                  <input
                    type="datetime-local"
                    name="startAt"
                    value={formData.startAt}
                    onChange={handleFieldChange}
                  />
                </label>

                <label>
                  <span>End</span>
                  <input
                    type="datetime-local"
                    name="endAt"
                    value={formData.endAt}
                    onChange={handleFieldChange}
                  />
                </label>
              </div>
            </div>

            <label className="booking-field">
              <span>Price for the booking</span>
              <div className="price-input-wrap">
                <span className="currency-prefix">GBP</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="price"
                  value={formData.price}
                  onChange={handleFieldChange}
                  placeholder={selectedVehicle.priceHint}
                />
              </div>
            </label>

            <div className="booking-summary">
              <div>
                <span className="booking-summary-label">Duration</span>
                <strong>{getDurationLabel(formData.startAt, formData.endAt)}</strong>
              </div>
              <div>
                <span className="booking-summary-label">Entered price</span>
                <strong>{formatMoney(formData.price)}</strong>
              </div>
              <div>
                <span className="booking-summary-label">Availability check</span>
                <strong className={conflictingBlock ? 'summary-unavailable' : 'summary-available'}>
                  {conflictingBlock ? 'Conflicts with existing booking' : 'No clash detected'}
                </strong>
              </div>
            </div>

            {conflictingBlock ? (
              <p className="status-message status-error">
                This request overlaps with an existing booking:{" "}
                {formatDateTimeRange(conflictingBlock.startAt, conflictingBlock.endAt)}
              </p>
            ) : null}

            {validationMessage ? (
              <p className="status-message status-error">{validationMessage}</p>
            ) : null}

            {submitState ? (
              <p
                className={`status-message ${
                  submitState.type === 'success' ? 'status-success' : 'status-error'
                }`}
              >
                {submitState.message}
              </p>
            ) : null}

            <button
              type="submit"
              className="booking-submit"
              disabled={Boolean(validationMessage || conflictingBlock || isSubmitting)}
            >
              {isSubmitting ? 'Submitting booking...' : 'Submit booking request'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Book;
