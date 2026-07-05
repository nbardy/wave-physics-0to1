// The lesson-wide palette contract (articles/01-navier-stokes/PLAN.md §Palette).
// Quantity → color, fixed at first appearance, never redesigned.
// Prose binds to these via <C k="…">; figures import them directly.

export const PALETTE = {
  vel: '#2563eb', // velocity, arrows
  dye: '#d97706', // dye, markers, parcels
  pHi: '#dc2626', // pressure above ambient
  pLo: '#0891b2', // pressure below ambient
  div: '#7c3aed', // divergence — the crime
  visc: '#059669', // viscosity, smoothing
  wall: '#6b7280', // obstacles, walls

  // Lesson 02 (articles/02-fiber-bundles/PLAN.md §Palette) — deliberate role-rhyme
  // with lesson 01: amber is still "the thing we watch", blue "the field that acts",
  // violet "the derived meter". Same hex, new semantic names — prose binds to roles.
  theta: '#d97706', // the section: wave value, needle angle θ
  conn: '#2563eb', // the connection / transport rule A
  gauge: '#059669', // the prankster's regauge α
  curv: '#7c3aed', // curvature / holonomy F
  efield: '#dc2626', // electric field (dictionary panes only, §8–9)
  bfield: '#0891b2', // magnetic field (dictionary panes only, §8–9)
} as const

export type PaletteKey = keyof typeof PALETTE
