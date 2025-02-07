import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyBWIvsZeEpCDZ4gCA_4OWgJTHChjDMFOB0",
    authDomain: "demowebsite-f6e39.firebaseapp.com",
    databaseURL: "https://demowebsite-f6e39-default-rtdb.firebaseio.com/",
    projectId: "demowebsite-f6e39",
    storageBucket: "demowebsite-f6e39.appspot.com",
    messagingSenderId: "788668288815",
    appId: "1:788668288815:web:6804f9438d59256d599bda"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { firebaseConfig };  // Xuất firebaseConfig nếu cần