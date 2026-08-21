import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCrhPmKzRoijISO4DfhOn875fFz-UNhlwM",
  authDomain: "nsem-320eb.firebaseapp.com",
  databaseURL:
    "https://nsem-320eb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nsem-320eb",
  storageBucket: "nsem-320eb.firebasestorage.app",
  messagingSenderId: "168824941268",
  appId: "1:168824941268:web:2ff9625ea8d388b3882941",
  measurementId: "G-RY0Q2DD1D9",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
export default app;