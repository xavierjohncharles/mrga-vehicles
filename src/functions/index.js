'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const { Resend } = require('resend');
const { setGlobalOptions, logger } = require('firebase-functions/v2');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const {
  defineSecret,
  defineString,
  projectID,
} = require('firebase-functions/params');

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

const REGION = 'us-central1';
const BOOKINGS_COLLECTION = 'bookings';
const AVAILABILITY_COLLECTION = 'availabilityBlocks';
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const BOOKING_ADMIN_EMAIL = defineString('BOOKING_ADMIN_EMAIL', {
  default: 'mrga.vehicles@gmail.com',
  description: 'Admin inbox that receives new booking approval requests.',
});
const BOOKING_EMAIL_FROM = defineString('BOOKING_EMAIL_FROM', {
  default: 'MRGA Bookings <bookings@mrga-vehicles.com>',
  description: 'Verified sender identity used for admin booking emails.',
});
const BOOKING_ACCEPT_BASE_URL = defineString('BOOKING_ACCEPT_BASE_URL', {
  default: '',
  description:
    'Optional absolute URL for the accept-booking endpoint. Leave blank to use the default Firebase function URL.',
});

const db = admin.firestore();

const formatDateTime = (isoString) =>
  new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  }).format(new Date(isoString));

const formatMoney = (value) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildAcceptLink = (bookingId, token) => {
  const configuredBaseUrl = BOOKING_ACCEPT_BASE_URL.value().trim();
  const fallbackBaseUrl = `https://${REGION}-${projectID.value()}.cloudfunctions.net/acceptBookingRequest`;
  const targetUrl = new URL(configuredBaseUrl || fallbackBaseUrl);

  targetUrl.searchParams.set('bookingId', bookingId);
  targetUrl.searchParams.set('token', token);

  return targetUrl.toString();
};

const getUpcomingBookingsSnapshot = async (incomingBooking) => {
  const upcomingSnapshot = await db
    .collection(BOOKINGS_COLLECTION)
    .where('endAt', '>=', new Date().toISOString())
    .orderBy('endAt', 'asc')
    .limit(30)
    .get();

  const bookings = upcomingSnapshot.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }))
    .filter((booking) => booking.status === 'pending' || booking.status === 'confirmed');

  if (!bookings.some((booking) => booking.id === incomingBooking.id)) {
    bookings.push(incomingBooking);
  }

  return bookings.sort(
    (left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
  );
};

const renderCalendarTable = (bookings, highlightedBookingId) => {
  if (!bookings.length) {
    return '<p style="margin:0;color:#444;">No upcoming bookings yet.</p>';
  }

  const rows = bookings
    .map((booking) => {
      const isHighlighted = booking.id === highlightedBookingId;
      const rowBackground = isHighlighted ? '#fff4d8' : '#ffffff';
      const badgeBackground = booking.status === 'confirmed' ? '#225c2a' : '#7c5d13';
      const badgeLabel = isHighlighted ? 'NEW REQUEST' : booking.status.toUpperCase();

      return `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #e8e8e8;background:${rowBackground};">${escapeHtml(
            formatDateTime(booking.startAt)
          )}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e8e8e8;background:${rowBackground};">${escapeHtml(
            formatDateTime(booking.endAt)
          )}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e8e8e8;background:${rowBackground};">${escapeHtml(
            booking.vehicleName
          )}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e8e8e8;background:${rowBackground};">${escapeHtml(
            booking.clientName || 'Existing booking'
          )}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e8e8e8;background:${rowBackground};">${escapeHtml(
            formatMoney(booking.price || 0)
          )}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e8e8e8;background:${rowBackground};">
            <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:${badgeBackground};color:#fff;font-size:12px;letter-spacing:0.08em;">
              ${escapeHtml(badgeLabel)}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:18px;overflow:hidden;">
      <thead>
        <tr style="background:#2c2c2c;color:#fff;text-align:left;">
          <th style="padding:12px 14px;">Start</th>
          <th style="padding:12px 14px;">End</th>
          <th style="padding:12px 14px;">Vehicle</th>
          <th style="padding:12px 14px;">Client</th>
          <th style="padding:12px 14px;">Price</th>
          <th style="padding:12px 14px;">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

const renderBookingEmail = ({ booking, acceptLink, calendarTableHtml }) => `
  <div style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px;color:#111;">
    <div style="max-width:900px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #dedede;">
      <div style="padding:28px 32px;background:#2c2c2c;color:#fff;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">MRGA Booking Approval</p>
        <h1 style="margin:0;font-size:30px;line-height:1.1;">New booking request needs approval</h1>
      </div>

      <div style="padding:28px 32px;">
        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">
          A customer has submitted a new booking request. Review the details below, compare them with the updated calendar snapshot, and accept the request if everything looks correct.
        </p>

        <div style="padding:20px 22px;border-radius:20px;background:#f7f7f7;margin-bottom:24px;">
          <h2 style="margin:0 0 16px;font-size:24px;">New request details</h2>
          <p style="margin:0 0 8px;"><strong>Client:</strong> ${escapeHtml(booking.clientName)}</p>
          <p style="margin:0 0 8px;"><strong>Vehicle:</strong> ${escapeHtml(booking.vehicleName)}</p>
          <p style="margin:0 0 8px;"><strong>Start:</strong> ${escapeHtml(formatDateTime(booking.startAt))}</p>
          <p style="margin:0 0 8px;"><strong>End:</strong> ${escapeHtml(formatDateTime(booking.endAt))}</p>
          <p style="margin:0 0 8px;"><strong>Price:</strong> ${escapeHtml(formatMoney(booking.price))}</p>
          <p style="margin:0;"><strong>Status:</strong> Pending approval</p>
        </div>

        <div style="margin-bottom:28px;">
          <a href="${escapeHtml(
            acceptLink
          )}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#2c2c2c;color:#fff;text-decoration:none;font-weight:700;">
            Accept this booking request
          </a>
        </div>

        <h2 style="margin:0 0 16px;font-size:24px;">Updated booking calendar snapshot</h2>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
          This shows the upcoming calendar as it would look with the new request included.
        </p>
        ${calendarTableHtml}

        <p style="margin:24px 0 0;font-size:13px;color:#555;line-height:1.6;">
          If the button does not work, copy and paste this link into your browser:<br />
          <a href="${escapeHtml(acceptLink)}" style="color:#111;">${escapeHtml(acceptLink)}</a>
        </p>
      </div>
    </div>
  </div>
`;

const renderAdminResponsePage = ({ title, body, accent = '#2c2c2c' }) => `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f4f4f4;
          color: #111;
          display: grid;
          min-height: 100vh;
          place-items: center;
          padding: 24px;
        }
        main {
          width: min(640px, 100%);
          background: #fff;
          border-radius: 24px;
          padding: 32px;
          border-top: 8px solid ${accent};
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
        }
        h1 { margin: 0 0 16px; font-size: 32px; }
        p { margin: 0; line-height: 1.7; font-size: 16px; }
      </style>
    </head>
    <body>
      <main>
        <h1>${escapeHtml(title)}</h1>
        <p>${body}</p>
      </main>
    </body>
  </html>
`;

exports.emailAdminForNewBooking = onDocumentCreated(
  {
    document: `${BOOKINGS_COLLECTION}/{bookingId}`,
    region: REGION,
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      logger.warn('Booking creation event arrived without document data.');
      return;
    }

    const bookingId = snapshot.id;
    const booking = snapshot.data();

    if (
      typeof booking.clientName !== 'string' ||
      typeof booking.vehicleId !== 'string' ||
      typeof booking.vehicleName !== 'string' ||
      typeof booking.startAt !== 'string' ||
      typeof booking.endAt !== 'string' ||
      typeof booking.price !== 'number'
    ) {
      logger.error('Booking document is missing required fields.', { bookingId, booking });
      await snapshot.ref.set(
        {
          adminEmailStatus: 'failed',
          adminEmailError: 'booking document missing required fields',
        },
        { merge: true }
      );
      return;
    }

    const actionToken = crypto.randomBytes(24).toString('hex');
    const acceptLink = buildAcceptLink(bookingId, actionToken);
    const calendarSnapshot = await getUpcomingBookingsSnapshot({
      id: bookingId,
      ...booking,
    });
    const calendarTableHtml = renderCalendarTable(calendarSnapshot, bookingId);
    const emailHtml = renderBookingEmail({
      booking: {
        ...booking,
        id: bookingId,
      },
      acceptLink,
      calendarTableHtml,
    });

    await snapshot.ref.set(
      {
        adminActionToken: actionToken,
        adminActionTokenIssuedAt: admin.firestore.FieldValue.serverTimestamp(),
        adminEmailStatus: 'sending',
        adminEmailRecipient: BOOKING_ADMIN_EMAIL.value(),
      },
      { merge: true }
    );

    try {
      const resend = new Resend(RESEND_API_KEY.value());
      const response = await resend.emails.send({
        from: BOOKING_EMAIL_FROM.value(),
        to: [BOOKING_ADMIN_EMAIL.value()],
        subject: `Booking approval needed: ${booking.vehicleName} for ${booking.clientName}`,
        html: emailHtml,
        text: [
          'A new booking request needs approval.',
          `Client: ${booking.clientName}`,
          `Vehicle: ${booking.vehicleName}`,
          `Start: ${formatDateTime(booking.startAt)}`,
          `End: ${formatDateTime(booking.endAt)}`,
          `Price: ${formatMoney(booking.price)}`,
          `Accept request: ${acceptLink}`,
        ].join('\n'),
      });

      if (response.error) {
        throw new Error(response.error.message || 'Resend reported an unknown error');
      }

      await snapshot.ref.set(
        {
          adminEmailStatus: 'sent',
          adminEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
          adminEmailMessageId: response.data?.id || null,
        },
        { merge: true }
      );
    } catch (error) {
      logger.error('Failed to email admin about booking request.', { bookingId, error });
      await snapshot.ref.set(
        {
          adminEmailStatus: 'failed',
          adminEmailError: error instanceof Error ? error.message : 'unknown email failure',
        },
        { merge: true }
      );
    }
  }
);

exports.acceptBookingRequest = onRequest(
  {
    region: REGION,
    secrets: [RESEND_API_KEY],
  },
  async (request, response) => {
    const bookingId = typeof request.query.bookingId === 'string' ? request.query.bookingId : '';
    const token = typeof request.query.token === 'string' ? request.query.token : '';

    if (!bookingId || !token) {
      response
        .status(400)
        .send(
          renderAdminResponsePage({
            title: 'Invalid approval link',
            body: 'This approval link is missing the booking ID or token.',
            accent: '#8d2727',
          })
        );
      return;
    }

    try {
      const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(bookingId);
      const availabilityRef = db.collection(AVAILABILITY_COLLECTION).doc(bookingId);

      const result = await db.runTransaction(async (transaction) => {
        const bookingSnapshot = await transaction.get(bookingRef);

        if (!bookingSnapshot.exists) {
          return { state: 'missing' };
        }

        const booking = bookingSnapshot.data();

        if (!booking || booking.adminActionToken !== token) {
          return { state: 'invalid' };
        }

        if (booking.status === 'confirmed') {
          return { state: 'already-confirmed', booking };
        }

        if (booking.status !== 'pending') {
          return { state: 'not-pending', booking };
        }

        transaction.set(
          bookingRef,
          {
            status: 'confirmed',
            adminAcceptedAt: admin.firestore.FieldValue.serverTimestamp(),
            adminActionToken: admin.firestore.FieldValue.delete(),
          },
          { merge: true }
        );
        transaction.set(
          availabilityRef,
          {
            vehicleId: booking.vehicleId,
            vehicleName: booking.vehicleName,
            startAt: booking.startAt,
            endAt: booking.endAt,
            status: 'confirmed',
            createdAt: booking.createdAt || admin.firestore.FieldValue.serverTimestamp(),
            confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        return { state: 'confirmed', booking };
      });

      if (result.state === 'missing') {
        response
          .status(404)
          .send(
            renderAdminResponsePage({
              title: 'Booking not found',
              body: 'The booking attached to this approval link no longer exists.',
              accent: '#8d2727',
            })
          );
        return;
      }

      if (result.state === 'invalid') {
        response
          .status(403)
          .send(
            renderAdminResponsePage({
              title: 'Approval link rejected',
              body: 'This link is invalid or has already been replaced by a newer one.',
              accent: '#8d2727',
            })
          );
        return;
      }

      if (result.state === 'already-confirmed') {
        response.send(
          renderAdminResponsePage({
            title: 'Booking already accepted',
            body: `This booking for ${escapeHtml(
              result.booking.vehicleName
            )} is already confirmed.`,
            accent: '#225c2a',
          })
        );
        return;
      }

      if (result.state === 'not-pending') {
        response.send(
          renderAdminResponsePage({
            title: 'Booking no longer pending',
            body: `This booking is currently marked as ${escapeHtml(
              result.booking.status
            )}, so no action was taken.`,
            accent: '#7c5d13',
          })
        );
        return;
      }

      response.send(
        renderAdminResponsePage({
          title: 'Booking accepted',
          body: `The request for ${escapeHtml(
            result.booking.vehicleName
          )} has been accepted and the calendar is now confirmed for ${escapeHtml(
            formatDateTime(result.booking.startAt)
          )} to ${escapeHtml(formatDateTime(result.booking.endAt))}.`,
          accent: '#225c2a',
        })
      );
    } catch (error) {
      logger.error('Failed to accept booking request.', { bookingId, error });
      response
        .status(500)
        .send(
          renderAdminResponsePage({
            title: 'Approval failed',
            body: 'Something went wrong while trying to accept this booking request.',
            accent: '#8d2727',
          })
        );
    }
  }
);
