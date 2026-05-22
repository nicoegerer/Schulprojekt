import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey:            "AIzaSyCqngpyxTf8EMyJmmvKThZRCdSMfrqZzoU",
  authDomain:        "speedclick-7079c.firebaseapp.com",
  databaseURL:       "https://speedclick-7079c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "speedclick-7079c",
  storageBucket:     "speedclick-7079c.firebasestorage.app",
  messagingSenderId: "134851412374",
  appId:             "1:134851412374:web:fffe081d72aa5616a21db7",
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)