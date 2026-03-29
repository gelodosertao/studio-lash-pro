importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// These values are from your firebase-applet-config.json
firebase.initializeApp({
  apiKey: "AIzaSyAlQxrBrWUGFKTqRGXsGJETUZankhR8_QY",
  authDomain: "gen-lang-client-0584784634.firebaseapp.com",
  projectId: "gen-lang-client-0584784634",
  storageBucket: "gen-lang-client-0584784634.firebasestorage.app",
  messagingSenderId: "366233582880",
  appId: "1:366233582880:web:e1c83c8537617fa745eb45"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Add your logo here if you have one
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
