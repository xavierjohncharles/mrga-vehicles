import React, { useEffect, useRef, useState } from 'react';
import { bookingVehicles, getBookingVehicle } from '../data/bookingVehicles';
import {
  createBookingRequest,
  fetchVehicleAvailability,
  getCachedAvailabilityByVehicle,
  preloadBookingInfrastructure,
} from '../services/bookingService';
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
  type AvailabilityBlock,
} from '../utils/booking';
import './Book.css';

const defaultRange = buildDefaultDateRange();
const initialAvailabilityByVehicle = getCachedAvailabilityByVehicle();
const BOOKING_SUBMIT_TIMEOUT_MS = 12000;

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const toTimeInputValue = (date: Date) => {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${hours}:${minutes}`;
};

const combineDateAndTime = (dateValue: string, timeValue: string) => {
  if (!dateValue || !timeValue) {
    return null;
  }

  const combinedDate = new Date(`${dateValue}T${timeValue}`);

  if (Number.isNaN(combinedDate.getTime())) {
    return null;
  }

  return combinedDate;
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(new Error('Booking request timed out'));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (typeof timeoutId === 'number') {
      window.clearTimeout(timeoutId);
    }
  }
};

const Book = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState(bookingVehicles[0].id);
  const [availabilityByVehicle, setAvailabilityByVehicle] =
    useState<Record<string, AvailabilityBlock[]>>(initialAvailabilityByVehicle);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [submitState, setSubmitState] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [currentMonth, setCurrentMonth] = useState(
    new Date(defaultRange.start.getFullYear(), defaultRange.start.getMonth(), 1)
  );
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    vehicleId: bookingVehicles[0].id,
    startDate: toDateInputValue(defaultRange.start),
    startTime: toTimeInputValue(defaultRange.start),
    endDate: toDateInputValue(defaultRange.end),
    endTime: toTimeInputValue(defaultRange.end),
    price: '',
  });
  const syncedVehiclesRef = useRef(
    new Set(
      Object.entries(initialAvailabilityByVehicle)
        .filter(([, blocks]) => blocks.length)
        .map(([vehicleId]) => vehicleId)
    )
  );

  useEffect(() => {
    preloadBookingInfrastructure();
  }, []);

  useEffect(() => {
    let ignore = false;

    const refreshSelectedVehicle = async () => {
      if (syncedVehiclesRef.current.has(selectedVehicleId)) {
        return;
      }

      setIsLoadingAvailability(true);
      setLoadError('');

      try {
        const nextVehicleBlocks = await fetchVehicleAvailability(selectedVehicleId);

        if (!ignore) {
          syncedVehiclesRef.current.add(selectedVehicleId);
          setAvailabilityByVehicle((currentState) => ({
            ...currentState,
            [selectedVehicleId]: nextVehicleBlocks,
          }));
        }
      } catch {
        if (!ignore) {
          setLoadError('Availability could not be loaded. You can still complete the booking form.');
        }
      } finally {
        if (!ignore) {
          setIsLoadingAvailability(false);
        }
      }
    };

    refreshSelectedVehicle();

    return () => {
      ignore = true;
    };
  }, [selectedVehicleId]);

  const selectedVehicle = getBookingVehicle(selectedVehicleId);
  const availabilityBlocks = availabilityByVehicle[selectedVehicleId] ?? [];
  const requestedStart = combineDateAndTime(formData.startDate, formData.startTime);
  const requestedEnd = combineDateAndTime(formData.endDate, formData.endTime);
  const today = new Date();
  const calendarDays = getCalendarDays(currentMonth);

  let validationMessage = '';

  if (!formData.clientName.trim()) {
    validationMessage = 'Client name is required.';
  } else if (!formData.clientPhone.trim()) {
    validationMessage = "Client's phone number is required.";
  } else if (formData.clientPhone.replace(/\D/g, '').length < 7) {
    validationMessage = 'Please enter a valid phone number.';
  } else if (
    !formData.startDate ||
    !formData.startTime ||
    !formData.endDate ||
    !formData.endTime
  ) {
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
  const showValidationMessage = hasAttemptedSubmit && Boolean(validationMessage);
  const showConflictMessage = hasAttemptedSubmit && Boolean(conflictingBlock);

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
    setHasAttemptedSubmit(true);
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
      await withTimeout(
        createBookingRequest({
          clientName: formData.clientName.trim(),
          clientPhone: formData.clientPhone.trim(),
          vehicleId: formData.vehicleId,
          vehicleName: selectedVehicle.name,
          startAt: requestedStart,
          endAt: requestedEnd,
          price: Number(formData.price),
        }),
        BOOKING_SUBMIT_TIMEOUT_MS
      );
      setSubmitState({
        type: 'success',
        message:
          'Booking request submitted. The admin has been emailed to review and accept it. Dates will only be blocked after approval.',
      });
      setHasAttemptedSubmit(false);
      setFormData((currentState) => ({
        ...currentState,
        clientName: '',
        clientPhone: '',
        price: '',
      }));
    } catch (error) {
      console.error('[booking] submit failed', error);

      const detail =
        error instanceof Error && error.message
          ? error.message
          : 'unknown error';

      const message =
        error instanceof Error && error.message === 'Booking request timed out'
          ? 'Booking submission took too long. The server did not respond within 12 seconds — Firestore may be unreachable or the database may not be provisioned. Open the browser console for the full error.'
          : `Booking submission failed: ${detail}. Open the browser console for the full error.`;

      setSubmitState({ type: 'error', message });
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
            <span className="booking-badge">
              {isLoadingAvailability ? 'Checking live dates' : 'Live availability'}
            </span>
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

          {isLoadingAvailability ? (
            <div className="availability-loading availability-loading-inline" role="status" aria-live="polite">
              <div className="availability-loading-header">
                <span className="availability-spinner" aria-hidden="true"></span>
                <div>
                  <strong>Syncing live availability</strong>
                  <p>Showing the calendar now and refreshing booked dates in the background.</p>
                </div>
              </div>
            </div>
          ) : null}

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
              <span>Client&apos;s phone number</span>
              <input
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleFieldChange}
                placeholder="e.g. 07123 456789"
                autoComplete="tel"
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
                  <span>Start date</span>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFieldChange}
                  />
                </label>

                <label>
                  <span>Start time</span>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleFieldChange}
                  />
                </label>

                <label>
                  <span>End date</span>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFieldChange}
                  />
                </label>

                <label>
                  <span>End time</span>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
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
                <strong>
                  {getDurationLabel(
                    requestedStart ? requestedStart.toISOString() : '',
                    requestedEnd ? requestedEnd.toISOString() : ''
                  )}
                </strong>
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

            {showConflictMessage && conflictingBlock ? (
              <p className="status-message status-error">
                This request overlaps with an existing booking:{" "}
                {formatDateTimeRange(conflictingBlock.startAt, conflictingBlock.endAt)}
              </p>
            ) : null}

            {showValidationMessage ? (
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
              disabled={isSubmitting}
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
