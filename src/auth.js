import { supabase } from '../supabase.js'

const $ = (id) => document.getElementById(id)

const modal = $('auth-modal')
const signupForm = $('signup-form')
const loginForm = $('login-form')
const tabSignup = $('tab-signup')
const tabLogin = $('tab-login')

function showMsg(el, text, ok = false) {
  el.textContent = text
  el.className = 'text-sm ' + (ok ? 'text-green-600' : 'text-red-600')
}

function clearMsgs() {
  ;[$('su-msg'), $('li-msg')].forEach((m) => m.classList.add('hidden'))
}

export function openAuth(tab = 'signup') {
  modal.classList.remove('hidden')
  switchTab(tab)
}

export function closeAuth() {
  modal.classList.add('hidden')
  clearMsgs()
}

function switchTab(tab) {
  const isSignup = tab === 'signup'
  signupForm.classList.toggle('hidden', !isSignup)
  loginForm.classList.toggle('hidden', isSignup)
  tabSignup.className = 'border-b-2 pb-3 -mb-px ' + (isSignup ? 'border-blue-600 font-semibold text-slate-900' : 'border-transparent text-slate-400')
  tabLogin.className = 'border-b-2 pb-3 -mb-px ' + (!isSignup ? 'border-blue-600 font-semibold text-slate-900' : 'border-transparent text-slate-400')
  clearMsgs()
}

tabSignup.addEventListener('click', () => switchTab('signup'))
tabLogin.addEventListener('click', () => switchTab('login'))
$('auth-close').addEventListener('click', closeAuth)
modal.addEventListener('click', (e) => { if (e.target === modal) closeAuth() })
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAuth() })

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const msg = $('su-msg')
  const name = $('su-name').value.trim()
  const email = $('su-email').value.trim()
  const password = $('su-password').value

  if (!name) return showMsg(msg, 'Enter your full name.')
  if (!/^\S+@\S+\.\S+$/.test(email)) return showMsg(msg, 'Enter a valid email address.')
  if (password.length < 8) return showMsg(msg, 'Password must be at least 8 characters.')

  $('su-submit').disabled = true
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })
  $('su-submit').disabled = false

  if (error) return showMsg(msg, error.message)
  if (data.session) {
    showMsg(msg, 'Account created. Redirecting…', true)
    setTimeout(() => { closeAuth(); window.location.hash = '#/create' }, 600)
  } else {
    showMsg(msg, 'Account created. Check your email to confirm, then log in.', true)
  }
})

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const msg = $('li-msg')
  const email = $('li-email').value.trim()
  const password = $('li-password').value

  if (!email || !password) return showMsg(msg, 'Enter your email and password.')

  $('li-submit').disabled = true
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  $('li-submit').disabled = false

  if (error) return showMsg(msg, 'Wrong email or password. Try again.')
  closeAuth()
  window.location.hash = '#/manage'
})

$('forgot-btn').addEventListener('click', async () => {
  const msg = $('li-msg')
  const email = $('li-email').value.trim()
  if (!email) return showMsg(msg, 'Enter your email above first.')
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) return showMsg(msg, error.message)
  showMsg(msg, 'Password reset link sent. Check your email.', true)
})

document.querySelectorAll('[data-auth]').forEach((btn) =>
  btn.addEventListener('click', () => openAuth(btn.dataset.auth))
)