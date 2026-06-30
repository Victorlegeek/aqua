importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyCmoq27TebzHv36zBsm79gglEz7VO4R6Ic",
  authDomain: "aqua-f4785.firebaseapp.com",
  projectId: "aqua-f4785",
  storageBucket: "aqua-f4785.firebasestorage.app",
  messagingSenderId: "921080424201",
  appId: "1:921080424201:web:89138daabb8408193795d8"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icons/icon-192.png"
  })
})