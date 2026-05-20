import React, { useEffect, useMemo, useState } from 'react';
import { type User } from 'firebase/auth';
import { bookingVehicles } from '../data/bookingVehicles';
import { ADMIN_EMAIL } from '../firebase';
import {
  AdminAuthError,
  signInAsAdmin,
  signOutAdmin,
  subscribeToAdminAuth,
} from '../services/adminAuthService';
import {
  type AdminBooking,
  cancelAdminBooking,
  createAdminBooking,
  fetchAllBookings,
} from '../services/bookingService';
import {
  blockTouchesDay,
  formatDateTimeRange,
  getCalendarDays,
  getDayLabel,
  getDayNumber,
  getDurationLabel,
  getMonthLabel,
  isSameDay,
  overlaps,
} from '../utils/booking';
import './Admin.css';

const VEHICLE_FILTER_ALL = 'all';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);

const formatTimestamp = (value: string | null) => {
  if (!value) {
    return 'Unknown';
  }
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  }).format(new Date(value));
};

const statusBadgeClass = (status: AdminBooking['status']) => {
  if (status === 'pending') return 'admin-status-badge admin-status-badge-pending';
  if (status === 'cancelled') return 'admin-status-badge admin-status-badge-cancelled';
  return 'admin-status-badge';
};

const bookingPillClass = (status: AdminBooking['status']) => {
  if (status === 'pending') return 'admin-calendar-booking admin-calendar-booking-pending';
  if (status === 'cancelled') return 'admin-calendar-booking admin-calendar-booking-cancelled';
  return 'admin-calendar-booking';
};

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

const buildEmptyDraft = () => {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 8);

  return {
    clientName: '',
    vehicleId: bookingVehicles[0].id,
    startDate: toDateInputValue(start),
    startTime: toTimeInputValue(start),
    endDate: toDateInputValue(end),
    endTime: toTimeInputValue(end),
    price: '',
    status: 'confirmed' as 'confirmed' | 'pending',
  };
};

const Admin = () => {
  const [authState, setAuthState] = useState<{
    user: User | null;
    isAdmin: boolean;
    ready: boolean;
  }>({ user: null, isAdmin: false, ready: false });
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState('');

  const [vehicleFilter, setVehicleFilter] = useState<string>(VEHICLE_FILTER_ALL);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [draft, setDraft] = useState(buildEmptyDraft);
  const [draftError, setDraftError] = useState('');
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAdminAuth((user, isAdmin) => {
      setAuthState({ user, isAdmin, ready: true });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authState.isAdmin) {
      setBookings([]);
      return;
    }

    let cancelled = false;
    setIsLoadingBookings(true);
    setBookingsError('');

    fetchAllBookings()
      .then((nextBookings) => {
        if (!cancelled) {
          setBookings(nextBookings);
        }
      })
      .catch((error) => {
        console.error('[admin] failed to load bookings', error);
        if (!cancelled) {
          setBookingsError('Could not load bookings. Check the console for details.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingBookings(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authState.isAdmin]);

  const handleSignIn = async () => {
    setAuthError('');
    setIsAuthenticating(true);
    try {
      await signInAsAdmin();
    } catch (error) {
      console.error('[admin] sign-in failed', error);

      if (error instanceof AdminAuthError) {
        setAuthError(error.message);
      } else if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        const message =
          'message' in error ? (error as { message: string }).message : '';

        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          setAuthError('Sign-in was cancelled.');
        } else if (code === 'auth/popup-blocked') {
          setAuthError(
            'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.'
          );
        } else if (code === 'auth/unauthorized-domain') {
          setAuthError(
            'This domain is not authorized for Google sign-in. Add it under Firebase Auth → Settings → Authorized domains.'
          );
        } else if (code === 'auth/operation-not-allowed') {
          setAuthError(
            'Google sign-in is not enabled in Firebase Auth → Sign-in providers.'
          );
        } else {
          setAuthError(`Sign-in failed (${code}): ${message}`);
        }
      } else {
        setAuthError('Sign-in failed. Please try again.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await signOutAdmin();
    setSelectedBookingId(null);
  };

  const filteredBookings = useMemo(
    () =>
      vehicleFilter === VEHICLE_FILTER_ALL
        ? bookings
        : bookings.filter((booking) => booking.vehicleId === vehicleFilter),
    [bookings, vehicleFilter]
  );

  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const today = new Date();

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, AdminBooking[]>();
    calendarDays.forEach((day) => {
      const key = day.toISOString();
      const matched = filteredBookings.filter((booking) =>
        blockTouchesDay(
          {
            id: booking.id,
            vehicleId: booking.vehicleId,
            vehicleName: booking.vehicleName,
            startAt: booking.startAt,
            endAt: booking.endAt,
            status: booking.status === 'cancelled' ? 'pending' : booking.status,
          },
          day
        )
      );
      map.set(key, matched);
    });
    return map;
  }, [calendarDays, filteredBookings]);

  const selectedBooking =
    selectedBookingId !== null
      ? bookings.find((booking) => booking.id === selectedBookingId) ?? null
      : null;

  const openCreateModal = () => {
    setDraft(buildEmptyDraft());
    setDraftError('');
    setIsCreatingBooking(true);
  };

  const closeCreateModal = () => {
    if (isSubmittingDraft) return;
    setIsCreatingBooking(false);
    setDraftError('');
  };

  const handleDraftChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setDraftError('');
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleCreateBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.clientName.trim()) {
      setDraftError('Client name is required.');
      return;
    }

    const start = combineDateAndTime(draft.startDate, draft.startTime);
    const end = combineDateAndTime(draft.endDate, draft.endTime);

    if (!start || !end) {
      setDraftError('Please choose both the start and end date/time.');
      return;
    }

    if (end <= start) {
      setDraftError('End must be after start.');
      return;
    }

    const priceNumber = Number(draft.price);
    if (!draft.price || Number.isNaN(priceNumber) || priceNumber <= 0) {
      setDraftError('Price is required and must be greater than zero.');
      return;
    }

    const conflict = bookings.find(
      (booking) =>
        booking.vehicleId === draft.vehicleId &&
        booking.status !== 'cancelled' &&
        overlaps(start, end, new Date(booking.startAt), new Date(booking.endAt))
    );

    if (conflict) {
      setDraftError(
        `That window clashes with ${conflict.clientName} (${formatDateTimeRange(
          conflict.startAt,
          conflict.endAt
        )}).`
      );
      return;
    }

    const vehicle =
      bookingVehicles.find((entry) => entry.id === draft.vehicleId) ?? bookingVehicles[0];

    setIsSubmittingDraft(true);
    try {
      const newBooking = await createAdminBooking({
        clientName: draft.clientName.trim(),
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        startAt: start,
        endAt: end,
        price: priceNumber,
        status: draft.status,
      });

      setBookings((current) =>
        [...current, newBooking].sort(
          (left, right) =>
            new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
        )
      );
      setIsCreatingBooking(false);
    } catch (error) {
      console.error('[admin] create booking failed', error);
      setDraftError('Could not save booking. Check the console for details.');
    } finally {
      setIsSubmittingDraft(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const target = bookings.find((booking) => booking.id === bookingId);
    if (!target || target.status === 'cancelled') return;

    const confirmed = window.confirm(
      `Cancel booking for ${target.clientName} on ${formatDateTimeRange(
        target.startAt,
        target.endAt
      )}?`
    );
    if (!confirmed) return;

    setIsCancellingBooking(true);
    try {
      await cancelAdminBooking(bookingId);
      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
        )
      );
      setSelectedBookingId(null);
    } catch (error) {
      console.error('[admin] cancel booking failed', error);
      window.alert('Could not cancel the booking. Check the console for details.');
    } finally {
      setIsCancellingBooking(false);
    }
  };

  if (!authState.ready) {
    return (
      <section className="admin-page">
        <div className="admin-shell">
          <div className="admin-card admin-login">
            <p>Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!authState.isAdmin) {
    return (
      <section className="admin-page">
        <div className="admin-shell">
          <div className="admin-card admin-login">
            <h2>Admin sign-in</h2>
            <p>
              Access is restricted to{' '}
              <span className="admin-login-email">{ADMIN_EMAIL}</span>. Sign in with that
              Google account to continue.
            </p>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                className="admin-button"
                onClick={handleSignIn}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? 'Opening Google...' : 'Sign in with Google'}
              </button>
            </div>
            {authError ? <p className="admin-error">{authError}</p> : null}
            {authState.user && !authState.isAdmin ? (
              <p className="admin-error">
                Signed in as {authState.user.email}, but this account is not the admin.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-shell">
        <div className="admin-hero">
          <div>
            <h1>Admin bookings calendar</h1>
            <p>Signed in as {authState.user?.email}.</p>
          </div>
          <div className="admin-hero-actions">
            <button type="button" className="admin-button" onClick={openCreateModal}>
              + New booking
            </button>
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="admin-card">
          <h2>Filter by vehicle</h2>
          <div className="admin-controls">
            <button
              type="button"
              className={`admin-pill ${
                vehicleFilter === VEHICLE_FILTER_ALL ? 'admin-pill-active' : ''
              }`}
              onClick={() => setVehicleFilter(VEHICLE_FILTER_ALL)}
            >
              All vehicles
            </button>
            {bookingVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                className={`admin-pill ${
                  vehicleFilter === vehicle.id ? 'admin-pill-active' : ''
                }`}
                onClick={() => setVehicleFilter(vehicle.id)}
              >
                {vehicle.shortName}
              </button>
            ))}
          </div>

          <div className="admin-calendar-toolbar">
            <button
              type="button"
              className="admin-button admin-button-secondary"
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
              className="admin-button admin-button-secondary"
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                )
              }
            >
              Next
            </button>
          </div>

          {isLoadingBookings ? (
            <p className="admin-loading">Loading bookings...</p>
          ) : null}
          {bookingsError ? <p className="admin-error">{bookingsError}</p> : null}

          <div
            className="admin-calendar-grid admin-calendar-headings"
            aria-hidden="true"
          >
            {calendarDays.slice(0, 7).map((day) => (
              <span
                key={`heading-${day.toISOString()}`}
                className="admin-calendar-heading"
              >
                {getDayLabel(day)}
              </span>
            ))}
          </div>

          <div className="admin-calendar-grid">
            {calendarDays.map((day) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = isSameDay(day, today);
              const dayBookings = bookingsByDay.get(day.toISOString()) ?? [];

              return (
                <div
                  key={day.toISOString()}
                  className={`admin-calendar-day ${
                    !isCurrentMonth ? 'admin-calendar-day-muted' : ''
                  } ${isToday ? 'admin-calendar-day-today' : ''}`}
                >
                  <span className="admin-calendar-day-number">{getDayNumber(day)}</span>
                  <div className="admin-calendar-bookings">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <button
                        key={booking.id}
                        type="button"
                        className={bookingPillClass(booking.status)}
                        onClick={() => setSelectedBookingId(booking.id)}
                        title={`${booking.clientName} — ${booking.vehicleName}`}
                      >
                        {booking.clientName} · {booking.vehicleName}
                      </button>
                    ))}
                    {dayBookings.length > 3 ? (
                      <span className="admin-calendar-more">
                        +{dayBookings.length - 3} more
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {!isLoadingBookings && filteredBookings.length === 0 ? (
            <p className="admin-empty">No bookings to display for this filter.</p>
          ) : null}
        </div>
      </div>

      {selectedBooking ? (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedBookingId(null)}
        >
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <p className="admin-modal-eyebrow">Booking details</p>
            <h2>{selectedBooking.clientName}</h2>
            <p>
              <span className={statusBadgeClass(selectedBooking.status)}>
                {selectedBooking.status}
              </span>
            </p>
            <dl className="admin-modal-detail">
              <dt>Vehicle</dt>
              <dd>{selectedBooking.vehicleName}</dd>
              <dt>Window</dt>
              <dd>{formatDateTimeRange(selectedBooking.startAt, selectedBooking.endAt)}</dd>
              <dt>Duration</dt>
              <dd>{getDurationLabel(selectedBooking.startAt, selectedBooking.endAt)}</dd>
              <dt>Price</dt>
              <dd>{formatPrice(selectedBooking.price)}</dd>
              <dt>Submitted</dt>
              <dd>{formatTimestamp(selectedBooking.createdAt)}</dd>
              <dt>Booking ID</dt>
              <dd>{selectedBooking.id}</dd>
            </dl>
            <div className="admin-modal-actions admin-modal-actions-split">
              {selectedBooking.status !== 'cancelled' ? (
                <button
                  type="button"
                  className="admin-button admin-button-danger"
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  disabled={isCancellingBooking}
                >
                  {isCancellingBooking ? 'Cancelling...' : 'Cancel booking'}
                </button>
              ) : (
                <span className="admin-modal-note">Already cancelled.</span>
              )}
              <button
                type="button"
                className="admin-button"
                onClick={() => setSelectedBookingId(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCreatingBooking ? (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={closeCreateModal}
        >
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <p className="admin-modal-eyebrow">Add booking</p>
            <h2>New booking</h2>
            <form className="admin-form" onSubmit={handleCreateBooking}>
              <label className="admin-field">
                <span>Client name</span>
                <input
                  type="text"
                  name="clientName"
                  value={draft.clientName}
                  onChange={handleDraftChange}
                  placeholder="Enter client name"
                  autoComplete="name"
                />
              </label>

              <label className="admin-field">
                <span>Vehicle</span>
                <select
                  name="vehicleId"
                  value={draft.vehicleId}
                  onChange={handleDraftChange}
                >
                  {bookingVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-field">
                <span>Booking window</span>
                <div className="admin-datetime-grid">
                  <label>
                    <span>Start date</span>
                    <input
                      type="date"
                      name="startDate"
                      value={draft.startDate}
                      onChange={handleDraftChange}
                    />
                  </label>
                  <label>
                    <span>Start time</span>
                    <input
                      type="time"
                      name="startTime"
                      value={draft.startTime}
                      onChange={handleDraftChange}
                    />
                  </label>
                  <label>
                    <span>End date</span>
                    <input
                      type="date"
                      name="endDate"
                      value={draft.endDate}
                      onChange={handleDraftChange}
                    />
                  </label>
                  <label>
                    <span>End time</span>
                    <input
                      type="time"
                      name="endTime"
                      value={draft.endTime}
                      onChange={handleDraftChange}
                    />
                  </label>
                </div>
              </div>

              <label className="admin-field">
                <span>Price (GBP)</span>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="1"
                  value={draft.price}
                  onChange={handleDraftChange}
                  placeholder="e.g. 320"
                />
              </label>

              <label className="admin-field">
                <span>Status</span>
                <select name="status" value={draft.status} onChange={handleDraftChange}>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                </select>
              </label>

              {draftError ? <p className="admin-error">{draftError}</p> : null}

              <div className="admin-modal-actions admin-modal-actions-split">
                <button
                  type="button"
                  className="admin-button admin-button-secondary"
                  onClick={closeCreateModal}
                  disabled={isSubmittingDraft}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-button"
                  disabled={isSubmittingDraft}
                >
                  {isSubmittingDraft ? 'Saving...' : 'Add booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Admin;
