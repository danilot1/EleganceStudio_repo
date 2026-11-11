import { describe, expect, it } from 'vitest'
import { isFirebaseConfigured } from './firebaseConfig'

describe('ambiente de teste', () => {
  it('nunca usa o projeto Firebase do .env', () => {
    expect(import.meta.env.VITE_FIREBASE_PROJECT_ID).toBeFalsy()
    expect(isFirebaseConfigured).toBe(false)
  })
})
