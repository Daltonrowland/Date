import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rs_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 — clear token and redirect
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rs_token')
      localStorage.removeItem('rs_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (email: string, password: string, first_name: string) =>
    api.post('/auth/register', { email, password, first_name }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),
}

// ── Profile ───────────────────────────────────────────────────────────────────
export const profileAPI = {
  onboarding: (data: OnboardingData) => api.post('/profile/onboarding', data),
  getMe: () => api.get('/profile/me'),
  update: (data: Partial<ProfileUpdateData>) => api.patch('/profile/me', data),
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
export const quizAPI = {
  getAllQuestions: () => api.get('/quiz/questions'),
  getQuestion: (n: number) => api.get(`/quiz/question/${n}`),
  getState: () => api.get('/quiz/state'),
  submitAnswer: (question_number: number, answer_letter: string) =>
    api.post('/quiz/answer', { question_number, answer_letter }),
  complete: () => api.post('/quiz/complete'),
}

// ── Matches ───────────────────────────────────────────────────────────────────
export const matchesAPI = {
  list: () => api.get('/matches/'),
  get: (id: string) => api.get(`/matches/${id}`),
  like: (match_id: string, liked: boolean) => api.post('/matches/like', { match_id, liked }),
}

// ── Sanctuary ─────────────────────────────────────────────────────────────────
export const sanctuaryAPI = {
  createSession: (module_id: string, reflection_text?: string) =>
    api.post('/sanctuary/session', { module_id, reflection_text }),
  listSessions: () => api.get('/sanctuary/sessions'),
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface OnboardingData {
  first_name: string
  last_name?: string
  date_of_birth: string
  gender: string
  seeking_gender: string
  zodiac_sign: string
  location?: string
  bio?: string
}

export interface ProfileUpdateData {
  bio?: string
  location?: string
  photo_url?: string
  display_name?: string
}

export interface AuthUser {
  user_id: string
  email: string
  account_state: string
  first_name: string | null
  quiz_completed: boolean
  onboarding_completed: boolean
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: string
  account_state: string
  first_name: string | null
  quiz_completed: boolean
}

export interface Profile {
  id: string
  first_name: string
  last_name?: string
  display_name?: string
  bio?: string
  date_of_birth?: string
  gender?: string
  seeking_gender?: string
  location?: string
  photo_url?: string
  zodiac_sign?: string
  life_path_number?: number
  archetype_primary?: string
  archetype_secondary?: string
  shadow_pattern?: string
  compatibility_score?: number
  tier?: string
  core_norm?: number
  stability_avg?: number
  chemistry_avg?: number
  depth_score: number
  readiness_score?: number
  readiness_forecast?: string
  onboarding_completed: boolean
  quiz_completed: boolean
}

export interface QuizQuestion {
  question_number: number
  question_id: string
  phase: string
  dimension_primary: string
  dimension_secondary?: string
  weight: number
  question_text: string
  options: { letter: string; text: string; archetype?: string }[]
  total_questions: number
}

export interface Match {
  id: string
  user: {
    id: string
    first_name: string
    display_name?: string
    photo_url?: string
    archetype_primary?: string
    zodiac_sign?: string
    location?: string
    bio?: string
  }
  compatibility_score: number
  tier: string
  core_norm?: number
  stability_avg?: number
  chemistry_avg?: number
  zodiac_norm?: number
  numerology_norm?: number
  top_drivers?: { positive: any[]; friction: any[] }
  archetype_fit_note?: string
  is_mutual: boolean
  revealed_to_me: boolean
  matched_at: string
}
