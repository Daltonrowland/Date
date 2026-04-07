import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('rs_token') || null,
  user: JSON.parse(localStorage.getItem('rs_user') || 'null'),

  setAuth: (token, user) => {
    localStorage.setItem('rs_token', token)
    localStorage.setItem('rs_user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('rs_token')
    localStorage.removeItem('rs_user')
    set({ token: null, user: null })
  },

  updateUser: (updates) =>
    set((state) => {
      const updated = { ...state.user, ...updates }
      localStorage.setItem('rs_user', JSON.stringify(updated))
      return { user: updated }
    }),
}))

export default useAuthStore
