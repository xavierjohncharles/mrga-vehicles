import { bookingVehicles } from '../data/bookingVehicles';
import type { AvailabilityBlock } from '../utils/booking';

const AVAILABILITY_COLLECTION = 'availabilityBlocks';
const BOOKINGS_COLLECTION = 'bookings';
const FALLBACK_BLOCKS_KEY = 'mrga-booking-availability-blocks';
const AVAILABILITY_CACHE_KEY = 'mrga-booking-availability-cache-v1';
const AVAILABILITY_CACHE_TTL_MS = 5 * 60 * 1000;
const BLOCKING_STATUSES = new Set(['confirmed']);

type AvailabilityByVehicle = Record<string, AvailabilityBlock[]>;
type StoredAvailabilityCache = {
  blocks: AvailabilityBlock[];
  storedAt: number;
};

type CreateBookingRequestInput = {
  clientName: string;
  vehicleId: string;
  vehicleName: string;
  startAt: Date;
  endAt: Date;
  price: number;
};

let inMemoryAvailabilityBlocks: AvailabilityBlock[] | null = null;

const getFirestoreContext = async () => {
  const [{ db }, firestore] = await Promise.all([
    import('../firebase'),
    import('firebase/firestore'),
  ]);

  return {
    db,
    collection: firestore.collection,
    deleteDoc: firestore.deleteDoc,
    doc: firestore.doc,
    getDocs: firestore.getDocs,
    orderBy: firestore.orderBy,
    query: firestore.query,
    where: firestore.where,
    serverTimestamp: firestore.serverTimestamp,
    updateDoc: firestore.updateDoc,
    writeBatch: firestore.writeBatch,
  };
};

export type AdminBooking = {
  id: string;
  clientName: string;
  vehicleId: string;
  vehicleName: string;
  startAt: string;
  endAt: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string | null;
};

export const fetchAllBookings = async (): Promise<AdminBooking[]> => {
  const { db, collection, getDocs, orderBy, query } = await getFirestoreContext();

  if (!db) {
    throw new Error('Firestore is not initialised in this environment.');
  }

  const snapshot = await getDocs(
    query(collection(db, BOOKINGS_COLLECTION), orderBy('startAt', 'asc'))
  );

  return snapshot.docs
    .map((record) => {
      const data = record.data();

      if (
        typeof data.clientName !== 'string' ||
        typeof data.vehicleId !== 'string' ||
        typeof data.vehicleName !== 'string' ||
        typeof data.startAt !== 'string' ||
        typeof data.endAt !== 'string' ||
        typeof data.price !== 'number' ||
        typeof data.status !== 'string'
      ) {
        return null;
      }

      const createdAtRaw = data.createdAt;
      const createdAt =
        createdAtRaw && typeof createdAtRaw.toDate === 'function'
          ? createdAtRaw.toDate().toISOString()
          : null;

      return {
        id: record.id,
        clientName: data.clientName,
        vehicleId: data.vehicleId,
        vehicleName: data.vehicleName,
        startAt: data.startAt,
        endAt: data.endAt,
        price: data.price,
        status: data.status,
        createdAt,
      } as AdminBooking;
    })
    .filter((booking): booking is AdminBooking => Boolean(booking));
};

export const preloadBookingInfrastructure = async () => {
  try {
    await getFirestoreContext();
  } catch {
    return null;
  }

  return true;
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
        typeof block?.endAt === 'string' &&
        BLOCKING_STATUSES.has(block?.status)
    );
  } catch {
    return [];
  }
};

const readAvailabilityCache = (): StoredAvailabilityCache | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(AVAILABILITY_CACHE_KEY);

    if (!storedValue) {
      return null;
    }

    const parsed = JSON.parse(storedValue);

    if (
      !parsed ||
      !Array.isArray(parsed.blocks) ||
      typeof parsed.storedAt !== 'number'
    ) {
      return null;
    }

    const blocks = parsed.blocks.filter(
      (block: AvailabilityBlock) =>
        typeof block?.id === 'string' &&
        typeof block?.vehicleId === 'string' &&
        typeof block?.vehicleName === 'string' &&
        typeof block?.startAt === 'string' &&
        typeof block?.endAt === 'string' &&
        BLOCKING_STATUSES.has(block?.status)
    );

    return {
      blocks,
      storedAt: parsed.storedAt,
    };
  } catch {
    return null;
  }
};

const persistAvailabilityCache = (blocks: AvailabilityBlock[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: StoredAvailabilityCache = {
    blocks,
    storedAt: Date.now(),
  };

  window.localStorage.setItem(AVAILABILITY_CACHE_KEY, JSON.stringify(payload));
};

const sortBlocks = (blocks: AvailabilityBlock[]) =>
  [...blocks].sort(
    (left, right) =>
      new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
  );

const mergeBlocks = (primaryBlocks: AvailabilityBlock[], fallbackBlocks: AvailabilityBlock[]) => {
  const mergedBlocks = [...primaryBlocks];

  fallbackBlocks.forEach((fallbackBlock) => {
    if (!mergedBlocks.some((remoteBlock) => remoteBlock.id === fallbackBlock.id)) {
      mergedBlocks.push(fallbackBlock);
    }
  });

  return sortBlocks(mergedBlocks);
};

const groupBlocksByVehicle = (blocks: AvailabilityBlock[]): AvailabilityByVehicle => {
  const grouped: AvailabilityByVehicle = bookingVehicles.reduce(
    (accumulator, vehicle) => ({
      ...accumulator,
      [vehicle.id]: [],
    }),
    {} as AvailabilityByVehicle
  );

  blocks.forEach((block) => {
    if (!grouped[block.vehicleId]) {
      grouped[block.vehicleId] = [];
    }

    grouped[block.vehicleId].push(block);
  });

  return Object.fromEntries(
    Object.entries(grouped).map(([vehicleId, vehicleBlocks]) => [
      vehicleId,
      sortBlocks(vehicleBlocks),
    ])
  );
};

const readFreshCachedBlocks = () => {
  const cachedAvailability = readAvailabilityCache();

  if (!cachedAvailability) {
    return null;
  }

  if (Date.now() - cachedAvailability.storedAt > AVAILABILITY_CACHE_TTL_MS) {
    return null;
  }

  return mergeBlocks(cachedAvailability.blocks, readFallbackBlocks());
};

export const getCachedAvailabilityByVehicle = (): AvailabilityByVehicle =>
  groupBlocksByVehicle(readFreshCachedBlocks() ?? readFallbackBlocks());

const fetchAvailabilitySnapshot = async () => {
  const fallbackBlocks = readFallbackBlocks();

  if (inMemoryAvailabilityBlocks) {
    return mergeBlocks(inMemoryAvailabilityBlocks, fallbackBlocks);
  }

  const cachedBlocks = readFreshCachedBlocks();

  if (cachedBlocks) {
    inMemoryAvailabilityBlocks = cachedBlocks;
    return cachedBlocks;
  }

  try {
    const { db, collection, getDocs } = await getFirestoreContext();

    if (!db) {
      const mergedFallbackBlocks = sortBlocks(fallbackBlocks);
      inMemoryAvailabilityBlocks = mergedFallbackBlocks;
      persistAvailabilityCache(mergedFallbackBlocks);
      return mergedFallbackBlocks;
    }

    const snapshot = await getDocs(collection(db, AVAILABILITY_COLLECTION));
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

        if (!BLOCKING_STATUSES.has(data.status)) {
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

    const mergedBlocks = mergeBlocks(remoteBlocks, fallbackBlocks);
    inMemoryAvailabilityBlocks = mergedBlocks;
    persistAvailabilityCache(mergedBlocks);

    return mergedBlocks;
  } catch {
    const mergedFallbackBlocks = sortBlocks(fallbackBlocks);
    inMemoryAvailabilityBlocks = mergedFallbackBlocks;
    persistAvailabilityCache(mergedFallbackBlocks);

    return mergedFallbackBlocks;
  }
};

export const fetchAllVehicleAvailability = async () =>
  groupBlocksByVehicle(await fetchAvailabilitySnapshot());

export const fetchVehicleAvailability = async (vehicleId: string) => {
  const fallbackBlocks = readFallbackBlocks().filter((block) => block.vehicleId === vehicleId);
  const cachedBlocks = getCachedAvailabilityByVehicle()[vehicleId] ?? [];

  try {
    const { db, collection, getDocs, query, where } = await getFirestoreContext();

    if (!db) {
      return sortBlocks(mergeBlocks(cachedBlocks, fallbackBlocks));
    }

    const snapshot = await getDocs(
      query(collection(db, AVAILABILITY_COLLECTION), where('vehicleId', '==', vehicleId))
    );

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

        if (!BLOCKING_STATUSES.has(data.status)) {
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

    const allKnownBlocks = (inMemoryAvailabilityBlocks ?? readFreshCachedBlocks() ?? []).filter(
      (block) => block.vehicleId !== vehicleId
    );
    const mergedVehicleBlocks = mergeBlocks(remoteBlocks, fallbackBlocks);
    const nextBlocks = sortBlocks([...allKnownBlocks, ...mergedVehicleBlocks]);

    inMemoryAvailabilityBlocks = nextBlocks;
    persistAvailabilityCache(nextBlocks);

    return mergedVehicleBlocks;
  } catch {
    return sortBlocks(mergeBlocks(cachedBlocks, fallbackBlocks));
  }
};

export const createBookingRequest = async ({
  clientName,
  vehicleId,
  vehicleName,
  startAt,
  endAt,
  price,
}: CreateBookingRequestInput): Promise<{ id: string; status: 'pending' }> => {
  const bookingId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const { db, collection, doc, serverTimestamp, writeBatch } = await getFirestoreContext();

  if (!db) {
    throw new Error('Firestore is not initialised in this environment.');
  }

  const bookingRef = doc(collection(db, BOOKINGS_COLLECTION), bookingId);
  const batch = writeBatch(db);

  batch.set(bookingRef, {
    clientName,
    vehicleId,
    vehicleName,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    price,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  await batch.commit();

  return { id: bookingId, status: 'pending' };
};

type CreateAdminBookingInput = {
  clientName: string;
  vehicleId: string;
  vehicleName: string;
  startAt: Date;
  endAt: Date;
  price: number;
  status: 'pending' | 'confirmed';
};

export const createAdminBooking = async ({
  clientName,
  vehicleId,
  vehicleName,
  startAt,
  endAt,
  price,
  status,
}: CreateAdminBookingInput): Promise<AdminBooking> => {
  const bookingId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const { db, collection, doc, serverTimestamp, writeBatch } = await getFirestoreContext();

  if (!db) {
    throw new Error('Firestore is not initialised in this environment.');
  }

  const startIso = startAt.toISOString();
  const endIso = endAt.toISOString();

  const bookingRef = doc(collection(db, BOOKINGS_COLLECTION), bookingId);
  const availabilityRef = doc(collection(db, AVAILABILITY_COLLECTION), bookingId);
  const batch = writeBatch(db);

  batch.set(bookingRef, {
    clientName,
    vehicleId,
    vehicleName,
    startAt: startIso,
    endAt: endIso,
    price,
    status,
    createdAt: serverTimestamp(),
  });

  if (status === 'confirmed') {
    batch.set(availabilityRef, {
      vehicleId,
      vehicleName,
      startAt: startIso,
      endAt: endIso,
      status: 'confirmed',
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();

  inMemoryAvailabilityBlocks = null;

  return {
    id: bookingId,
    clientName,
    vehicleId,
    vehicleName,
    startAt: startIso,
    endAt: endIso,
    price,
    status,
    createdAt: new Date().toISOString(),
  };
};

export const cancelAdminBooking = async (bookingId: string): Promise<void> => {
  const { db, collection, deleteDoc, doc, updateDoc } = await getFirestoreContext();

  if (!db) {
    throw new Error('Firestore is not initialised in this environment.');
  }

  const bookingRef = doc(collection(db, BOOKINGS_COLLECTION), bookingId);
  const availabilityRef = doc(collection(db, AVAILABILITY_COLLECTION), bookingId);

  await updateDoc(bookingRef, { status: 'cancelled' });

  try {
    await deleteDoc(availabilityRef);
  } catch (error) {
    console.warn('[bookings] availability block delete skipped', error);
  }

  inMemoryAvailabilityBlocks = null;
};
