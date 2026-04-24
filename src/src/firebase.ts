import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA_Cml5byle3MvL7fU2kobSIO3haJfbjCU',
  authDomain: 'mrga-vehicles.firebaseapp.com',
  projectId: 'mrga-vehicles',
  storageBucket: 'mrga-vehicles.firebasestorage.app',
  messagingSenderId: '610700556335',
  appId: '1:610700556335:web:923bbf3c01f4dce6da2eda',
  measurementId: 'G-LDJJ2PGQLS',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let analytics: ReturnType<typeof getAnalytics> | null = null;

if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}

export { analytics, app, db };
