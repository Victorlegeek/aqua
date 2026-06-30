// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js"

const firebaseConfig = {
  apiKey: "AIzaSyCmoq27TebzHv36zBsm79gglEz7VO4R6Ic",
  authDomain: "aqua-f4785.firebaseapp.com",
  projectId: "aqua-f4785",
  storageBucket: "aqua-f4785.firebasestorage.app",
  messagingSenderId: "921080424201",
  appId: "1:921080424201:web:89138daabb8408193795d8"
}

export const app = initializeApp(firebaseConfig)
export const messaging = getMessaging(app)

// 🔑 clé VAPID (obligatoire)
const VAPID_KEY = "BDClkSswcOj0HUoiVvM4pFCI3i1q612TZpsFoIfv3oWv74lPlTzuF78uu4D_PC8E5MqHPxWvBz6PO8lsgH23vjI"

export async function activerPush() {
  const permission = await Notification.requestPermission()
  if (permission !== "granted") return null

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY
  })

  console.log("🔥 TOKEN FCM :", token)
  return token
}

// notifications quand app ouverte
onMessage(messaging, (payload) => {
  console.log("Message reçu :", payload)

  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icons/icon-192.png"
  })
})