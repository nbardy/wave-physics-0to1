// The lesson-wide palette contract (articles/01-navier-stokes/PLAN.md §Palette).
// Quantity → color, fixed at first appearance, never redesigned.
// Prose binds to these via <C k="…">; figures import them directly.

export const PALETTE = {
  vel: '#2563eb', // velocity, arrows
  dye: '#d97706', // dye, markers, parcels
  dye2: '#db2777', // the second dye current (wing hero, shear layers) — same substance, different shirt
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

  // Maths 01 (articles/maths/01-jacobian-hessian/PLAN.md §Palette) — same role-rhyme:
  // amber "the thing we watch", blue "the thing that acts", violet "the derived meter".
  stamp: '#d97706', // the stamp — the amber square we watch, and its image
  ex: '#2563eb', // the east unit arrow ê₁ and its landing (J's first column)
  ey: '#059669', // the north unit arrow ê₂ and its landing (J's second column)
  area: '#7c3aed', // determinant / area receipt / eigen readouts
  grad: '#db2777', // the gradient arrow(s) on the landscape
  hi: '#dc2626', // high ground on the landscape
  lo: '#0891b2', // low ground on the landscape

  // Physics 01 (articles/physics/01-wave-particle/PLAN.md §Palette) — the same
  // role-rhyme once more: amber "the thing we watch" (here, one detector click),
  // blue "the thing that acts" (the amplitude), violet "the derived meter"
  // (|ψ|², measured histograms, visibility).
  hit: '#d97706', // a single photon's arrival — one dot on the screen
  amp: '#2563eb', // the amplitude ψ — the phasor, the wave that acts
  pdf: '#7c3aed', // the derived meter: |ψ|², measured histograms, visibility
  slitA: '#2563eb', // the amplitude that came through the left slit
  slitB: '#db2777', // the amplitude that came through the right slit
  ejecta: '#dc2626', // ejected-electron energy (the photoelectric bench)
  cutoff: '#0891b2', // threshold frequency / the line a quantity cannot cross
} as const

export type PaletteKey = keyof typeof PALETTE
