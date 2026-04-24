import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { AvailabilityBlock } from '../utils/booking';

const AVAILABILITY_COLLECTION = 'availabilityBlocks';
const BOOKINGS_COLLECTION = 'bookings';
const FALLBACK_BLOCKS_KEY = 'mrga-booking-availability-blocks';

type CreateBookingRequestInput = {
  clientName: string;
  vehicleId: string;
  vehicleName: string;
  startAt: Date;
  endAt: Date;
  price: number;
};

const readFallbackBlocks = (): AvailabilityBlock[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(FALLBACK_BLOCKS_KEY);

    if (!storedValue) {
      return [];
    }

    const parsed = JSON.parse(storedValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (block) =>
        typeof block?.id === 'string' &&
        typeof block?.vehicleId === 'string' &&
        typeof block?.vehicleName === 'string' &&
        typeof block?.startAt === 'string' &&
        typeof block?.endAt === 'string'
    );
  } catch {
    return [];
  }
};

const persistFallbackBlock = (block: AvailabilityBlock) => {
  if (typeof window === 'undefined') {
    return;
  }

  const existingBlocks = readFallbackBlocks();
  const nextBlocks = [...existingBlocks.filter((item) => item.id !== block.id), block];
  window.localStorage.setItem(FALLBACK_BLOCKS_KEY, JSON.stringify(nextBlocks));
};

const sortBlocks = (blocks: AvailabilityBlock[]) =>
  [...blocks].sort(
    (left, right) =>
      new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
  );

export const fetchVehicleAvailability = async (vehicleId: string) => {
  const fallbackBlocks = readFallbackBlocks().filter((block) => block.vehicleId === vehicleId);

  if (!db) {
    return sortBlocks(fallbackBlocks);
  }

  try {
    const availabilityQuery = query(
      collection(db, AVAILABILITY_COLLECTION),
      where('vehicleId', '==', vehicleId)
    );

    const snapshot = await getDocs(availabilityQuery);
    const remoteBlocks = snapshot.docs
      .map((record) => {
        const data = record.data();

        if (
          typeof data.vehicleId !== 'string' ||
          typeof data.vehicleName !== 'string' ||
          typeof data.startAt !== 'string' ||
          typeof data.endAt !== 'string'
        ) {
          return null;
        }

        if (data.status !== 'pending' && data.status !== 'confirmed') {
          return null;
        }

        return {
          id: record.id,
          vehicleId: data.vehicleId,
          vehicleName: data.vehicleName,
          startAt: data.startAt,
          endAt: data.endAt,
          status: data.status,
        } satisfies AvailabilityBlock;
      })
      .filter((block): block is AvailabilityBlock => Boolean(block));

    const mergedBlocks = [...remoteBlocks];

    fallbackBlocks.forEach((fallbackBlock) => {
      if (!mergedBlocks.some((remoteBlock) => remoteBlock.id === fallbackBlock.id)) {
        mergedBlocks.push(fallbackBlock);
      }
    });

    return sortBlocks(mergedBlocks);
  } catch {
    return sortBlocks(fallbackBlocks);
  }
};

export const createBookingRequest = async ({
  clientName,
  vehicleId,
  vehicleName,
  startAt,
  endAt,
  price,
}: CreateBookingRequestInput): Promise<AvailabilityBlock> => {
  const bookingId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const availabilityBlock: AvailabilityBlock = {
    id: bookingId,
    vehicleId,
    vehicleName,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    status: 'pending',
  };

  if (!db) {
    persistFallbackBlock(availabilityBlock);
    return availabilityBlock;
  }

  try {
    const bookingRef = doc(collection(db, BOOKINGS_COLLECTION), bookingId);
    const availabilityRef = doc(collection(db, AVAILABILITY_COLLECTION), bookingId);
    const batch = writeBatch(db);

    batch.set(bookingRef, {
      clientName,
      vehicleId,
      vehicleName,
      startAt: availabilityBlock.startAt,
      endAt: availabilityBlock.endAt,
      price,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    batch.set(availabilityRef, {
      vehicleId,
      vehicleName,
      startAt: availabilityBlock.startAt,
      endAt: availabilityBlock.endAt,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    await batch.commit();
    persistFallbackBlock(availabilityBlock);

    return availabilityBlock;
  } catch {
    persistFallbackBlock(availabilityBlock);
    return availabilityBlock;
  }
};
