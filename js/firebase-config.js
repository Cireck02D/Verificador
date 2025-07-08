// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBPef2XxHf4dXJ9FZrBgqdbahls7bEdkY",
  authDomain: "verificador-68675.firebaseapp.com",
  projectId: "verificador-68675",
  storageBucket: "verificador-68675.firebasestorage.app",
  messagingSenderId: "48881291127",
  appId: "1:48881291127:web:f3d7c67ec1ae412aa55b72"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar Firestore
export const db = getFirestore(app);
