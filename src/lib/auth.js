import { supabase } from './supabase'

// ─── SIGN UP ───────────────────────────────────────────
// Called when a new user creates an account
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName, // Saved in user's profile metadata
      },
    },
  })
  return { data, error }
}

// ─── LOGIN ─────────────────────────────────────────────
// Called when an existing user logs in
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// ─── LOGOUT ────────────────────────────────────────────
// Called when user clicks logout
export async function logout() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// ─── GET CURRENT USER ──────────────────────────────────
// Returns the currently logged-in user (or null)
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}