import api from './client'
import type { AuthUser } from '@/store/authStore'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: AuthUser
}

export const authApi = {
  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    consentGiven: boolean
  }) => api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  googleLogin: (data: {
    email: string
    firstName?: string
    lastName?: string
    googleId?: string
    avatarUrl?: string
  }) => api.post<AuthResponse>('/auth/google', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: () => api.post('/auth/logout'),
}

export const profileApi = {
  get: () => api.get('/profile').then((r) => r.data),
  update: (data: Record<string, unknown>) => api.put('/profile', data).then((r) => r.data),
  deleteAccount: () => api.delete('/profile'),
}

export const resumeApi = {
  list: () => api.get('/resumes').then((r) => r.data),
  upload: (formData: FormData) =>
    api.post('/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
  createBuilt: (data: {
    label?: string
    fileName?: string
    parsedJson: Record<string, unknown>
  }) => api.post('/resumes/builder', data).then((r) => r.data),
  setPrimary: (id: number) => api.put(`/resumes/${id}/primary`).then((r) => r.data),
  delete: (id: number) => api.delete(`/resumes/${id}`),
}

export const jobApi = {
  search: (params: Record<string, unknown>) =>
    api.get('/jobs', { params }).then((r) => r.data),
  getById: (id: number) => api.get(`/jobs/${id}`).then((r) => r.data),
  recommendations: (limit: number = 50) =>
    api.get('/matches/recommendations', { params: { limit } }).then((r) => r.data),
  seed: () => api.post('/jobs/seed').then((r) => r.data),
}

export const matchApi = {
  getMatch: (jobId: number) => api.get(`/matches/${jobId}`).then((r) => r.data),
}

export const enhancementApi = {
  enhance: (jobId: number) => api.post(`/enhancements/${jobId}`).then((r) => r.data),
}

export const applicationApi = {
  list: () => api.get('/applications').then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/applications', data).then((r) => r.data),
  updateStatus: (id: number, status: string, note?: string) =>
    api.put(`/applications/${id}/status`, { status, note }).then((r) => r.data),
}

export const notificationApi = {
  list: () => api.get('/notifications').then((r) => r.data),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
}
