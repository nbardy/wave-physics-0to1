import { createContext, useContext, type ReactNode } from 'react'
import { catalogue, type Audience, type Catalogue } from './registry'

const AudienceContext = createContext<Catalogue | null>(null)

/** Hands every page the catalogue its visitor may reach. Built once per audience. */
export function AudienceProvider({ audience, children }: { audience: Audience; children: ReactNode }) {
  return <AudienceContext.Provider value={catalogue(audience)}>{children}</AudienceContext.Provider>
}

/**
 * The catalogue for the current visitor. Throws outside the provider: a page
 * rendered without an audience is a wiring bug, not a reader to fall back to.
 */
export function useCatalogue(): Catalogue {
  const value = useContext(AudienceContext)
  if (value === null) throw new Error('useCatalogue() called outside <AudienceProvider>')
  return value
}
