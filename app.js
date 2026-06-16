let etat = {
  total:        0,          // ml bus aujourd'hui
  objectif:     2000,       // ml objectif
  historique:   [],         // [{heure, ml}]
  rappelFreq:   2,          // heures entre chaque rappel
  notifActives: false,      // permission accordée ?
  dateJour:     today()     // date du jour pour le reset automatique
}

let intervalleRappel = null // référence au setInterval des rappels

function today() {
  return new Date().toLocaleDateString('fr-FR')
}

function heureNow() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function sauvegarder() {
  localStorage.setItem('hydro', JSON.stringify(etat))
}

function charger() {
  const data = localStorage.getItem('hydro')
  if (data) {
    etat = JSON.parse(data)
    if (etat.dateJour !== today()) {
      etat.total = 0
      etat.historique = []
      etat.dateJour = today()
      sauvegarder()
    }
  }
}

function rendrePage() {
  const pct = Math.min(Math.round((etat.total / etat.objectif) * 100), 100)
  const restant = Math.max(etat.objectif - etat.total, 0)
  const verres = Math.round((etat.total / 250) * 10) / 10

  document.getElementById('date-label').textContent =
    new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  document.getElementById('wave').style.height = pct + '%'

  document.getElementById('circle-ml').textContent = etat.total
  document.getElementById('circle-pct').textContent = pct + '%'
  document.getElementById('circle-goal-val').textContent = etat.objectif

  document.getElementById('stat-restant').textContent = restant + ' ml'
  document.getElementById('stat-pct').textContent = pct + '%'
  document.getElementById('stat-verres').textContent = verres

  const wave = document.getElementById('wave')
  if (pct >= 100) {
    wave.style.background = 'linear-gradient(180deg, #3de8a0, #1ab87a)'
  } else if (pct >= 60) {
    wave.style.background = 'linear-gradient(180deg, #38b6ff, #1a7abf)'
  } else if (pct >= 30) {
    wave.style.background = 'linear-gradient(180deg, #38b6ff, #1a7abf)'
  } else {
    wave.style.background = 'linear-gradient(180deg, #6ad0ff, #38b6ff)'
  }

  const liste = document.getElementById('history-list')
  if (etat.historique.length === 0) {
    liste.innerHTML = '<div class="history-empty">Aucune entrée pour aujourd\'hui</div>'
  } else {
    liste.innerHTML = [...etat.historique].reverse().map((item, i) => `
      <div class="history-item">
        <span class="history-time">${item.heure}</span>
        <span class="history-amount">+${item.ml} ml</span>
        <button class="history-delete" onclick="supprimerEntree(${etat.historique.length - 1 - i})">✕</button>
      </div>
    `).join('')
  }

  document.getElementById('input-objectif').value = etat.objectif
  document.getElementById('select-rappel').value = etat.rappelFreq

  mettreAJourBoutonNotif()
}

function ajouterEau(ml) {
  if (!ml || ml <= 0 || ml > 5000) return

  etat.total += ml
  etat.historique.push({ heure: heureNow(), ml: ml })
  sauvegarder()
  rendrePage()

  afficherToast('+' + ml + ' ml ajoutés')

  if (etat.total >= etat.objectif && etat.total - ml < etat.objectif) {
    setTimeout(() => lancerConfettis(), 400)
    afficherToast('Objectif atteint ! Bravo !')
  }
}

function ajouterPersonnalise() {
  const input = document.getElementById('custom-input')
  const val = parseInt(input.value)
  if (!val || val <= 0) {
    input.focus()
    return
  }
  ajouterEau(val)
  input.value = ''
}

function supprimerEntree(index) {
  etat.total -= etat.historique[index].ml
  if (etat.total < 0) etat.total = 0
  etat.historique.splice(index, 1)
  sauvegarder()
  rendrePage()
}

function resetJour() {
  if (!confirm('Remettre le compteur à zéro ?')) return
  etat.total = 0
  etat.historique = []
  sauvegarder()
  rendrePage()
  afficherToast('Compteur remis à zéro')
}

async function demanderNotifications() {
  if (!('Notification' in window)) {
    alert('Les notifications ne sont pas supportées sur ce navigateur.')
    return
  }

  const perm = await Notification.requestPermission()

  if (perm === 'granted') {
    etat.notifActives = true
    sauvegarder()
    programmerRappels()
    mettreAJourBoutonNotif()
    afficherToast('Rappels activés')
  } else {
    etat.notifActives = false
    sauvegarder()
    mettreAJourBoutonNotif()
  }
}

function programmerRappels() {
  if (intervalleRappel) clearInterval(intervalleRappel)

  if (!etat.notifActives) return

  const msInterval = etat.rappelFreq * 60 * 60 * 1000

  intervalleRappel = setInterval(() => {
    envoyerNotification()
  }, msInterval)
}

function envoyerNotification() {
  if (Notification.permission !== 'granted') return

  const restant = etat.objectif - etat.total
  let message = ''

  if (etat.total >= etat.objectif) {
    message = 'Objectif atteint ! Continue comme ça.'
  } else if (restant > 1000) {
    message = `Tu as bu ${etat.total}ml. Il te reste ${restant}ml à boire !`
  } else {
    message = `Plus que ${restant}ml pour atteindre ton objectif !`
  }

  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'NOTIFIER',
      message: message
    })
  } else {
    new Notification('Hydro', {
      body: message,
      icon: '/icons/icon-192.png'
    })
  }
}

function mettreAJourBoutonNotif() {
  const btn = document.getElementById('btn-notif')
  if (!btn) return

  const perm = Notification.permission

  if (perm === 'granted' && etat.notifActives) {
    btn.textContent = 'Rappels activés'
    btn.className = 'btn-notif active'
  } else if (perm === 'denied') {
    btn.textContent = 'Notifications bloquées (paramètres Safari)'
    btn.className = 'btn-notif denied'
  } else {
    btn.textContent = 'Activer les rappels'
    btn.className = 'btn-notif'
  }
}

function ouvrirSettings() {
  document.getElementById('modal').classList.add('open')
}

function fermerSettings() {
  document.getElementById('modal').classList.remove('open')
}

function sauvegarderSettings() {
  const nouvelObjectif = parseInt(document.getElementById('input-objectif').value)
  const nouvelleFreq = parseFloat(document.getElementById('select-rappel').value)

  if (nouvelObjectif >= 500 && nouvelObjectif <= 10000) {
    etat.objectif = nouvelObjectif
  }

  etat.rappelFreq = nouvelleFreq

  sauvegarder()
  programmerRappels()
  rendrePage()
  fermerSettings()
  afficherToast('Paramètres sauvegardés')
}

let toastTimeout = null

function afficherToast(message) {
  const toast = document.getElementById('toast')
  toast.textContent = message
  toast.classList.add('show')

  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show')
  }, 2200)
}

function lancerConfettis() {
  const couleurs = ['#38b6ff', '#3de8a0', '#ffd166', '#ff6b6b', '#ffffff']
  const cx = window.innerWidth / 2

  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const el = document.createElement('div')
      el.className = 'confetti-piece'
      el.style.cssText = `
        left: ${cx + (Math.random() - 0.5) * 300}px;
        top: ${Math.random() * 100 + 100}px;
        background: ${couleurs[Math.floor(Math.random() * couleurs.length)]};
        animation-duration: ${0.8 + Math.random() * 0.8}s;
        animation-delay: ${Math.random() * 0.3}s;
        width: ${6 + Math.random() * 8}px;
        height: ${6 + Math.random() * 8}px;
      `
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 1600)
    }, i * 30)
  }
}

async function enregistrerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker enregistré', reg)
    } catch (err) {
      console.warn('Service Worker non enregistré :', err)
    }
  }
}

function planifierResetMinuit() {
  const now = new Date()
  const minuit = new Date()
  minuit.setHours(24, 0, 0, 0)
  const msAvantMinuit = minuit - now

  setTimeout(() => {
    etat.total = 0
    etat.historique = []
    etat.dateJour = today()
    sauvegarder()
    rendrePage()
    afficherToast('Nouveau jour ! Bonne hydratation')
    planifierResetMinuit() // planifier le prochain
  }, msAvantMinuit)
}

document.addEventListener('DOMContentLoaded', async () => {
  charger()

  setTimeout(() => {
    document.getElementById('splash').classList.add('hidden')
  }, 1200)

  rendrePage()

  await enregistrerServiceWorker()

  if (etat.notifActives && Notification.permission === 'granted') {
    programmerRappels()
  }

  planifierResetMinuit()

  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === document.getElementById('modal')) fermerSettings()
  })

  document.getElementById('custom-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') ajouterPersonnalise()
  })
})