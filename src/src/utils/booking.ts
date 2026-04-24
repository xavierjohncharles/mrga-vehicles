export type AvailabilityBlock = {
  id: string;
  vehicleId: string;
  vehicleName: string;
  startAt: string;
  endAt: string;
  status: 'pending' | 'confirmed';
};

const monthLabelFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
});

const dayNumberFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
});

const dayLabelFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/London',
});

export const buildDefaultDateRange = () => {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);

  const end = new Date(start);
  end.setHours(end.getHours() + 8);

  return {
    start,
    end,
  };
};

export const toInputDateTimeValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatMoney = (value: string) => {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return 'Not set';
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(numericValue);
};

export const getCalendarDays = (month: Date) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstDay);
  const offset = (firstDay.getDay() + 6) % 7;
  gridStart.setDate(firstDay.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
};

export const getMonthLabel = (date: Date) => monthLabelFormatter.format(date);

export const getDayLabel = (date: Date) => dayLabelFormatter.format(date);

export const getDayNumber = (date: Date) => dayNumberFormatter.format(date);

export const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const overlaps = (
  requestedStart: Date,
  requestedEnd: Date,
  existingStart: Date,
  existingEnd: Date
) => requestedStart < existingEnd && requestedEnd > existingStart;

export const blockTouchesDay = (block: AvailabilityBlock, day: Date) => {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return overlaps(dayStart, dayEnd, new Date(block.startAt), new Date(block.endAt));
};

export const formatDateTimeRange = (startAt: string, endAt: string) =>
  `${dateTimeFormatter.format(new Date(startAt))} - ${dateTimeFormatter.format(
    new Date(endAt)
  )}`;

export const getDurationLabel = (startAt: string, endAt: string) => {
  if (!startAt || !endAt) {
    return 'Select a start and end time';
  }

  const start = new Date(startAt);
  const end = new Date(endAt);
  const diffMs = end.getTime() - start.getTime();

  if (Number.isNaN(diffMs) || diffMs <= 0) {
    return 'End time must be after the start time';
  }

  const totalHours = diffMs / (1000 * 60 * 60);

  if (totalHours < 24) {
    const roundedHours = Math.round(totalHours * 10) / 10;
    return `${roundedHours} hour booking`;
  }

  const days = Math.floor(totalHours / 24);
  const hours = Math.round((totalHours % 24) * 10) / 10;

  if (!hours) {
    return `${days} day booking`;
  }

  return `${days} day ${hours} hour booking`;
};
