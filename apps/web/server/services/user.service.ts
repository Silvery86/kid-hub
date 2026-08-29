import 'server-only'

import * as studentRepo from '@/server/repositories/student.repository'

export const getUserProgress = (studentId: string) => studentRepo.getUserProgress(studentId)

export const getUserById = (studentId: string) => studentRepo.getById(studentId)

export const getKidAccessSettings = (studentId: string) =>
  studentRepo.getKidAccessSettings(studentId)

export const saveKidAccessSettings = (studentId: string, settings: Record<string, boolean>) =>
  studentRepo.saveKidAccessSettings(studentId, settings)
