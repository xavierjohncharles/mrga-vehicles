// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_Cml5byle3MvL7fU2kobSIO3haJfbjCU",
  authDomain: "mrga-vehicles.firebaseapp.com",
  projectId: "mrga-vehicles",
  storageBucket: "mrga-vehicles.firebasestorage.app",
  messagingSenderId: "610700556335",
  appId: "1:610700556335:web:923bbf3c01f4dce6da2eda",
  measurementId: "G-LDJJ2PGQLS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);