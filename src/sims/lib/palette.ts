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

  // Physics P2, p-bits (articles/05-pbits/PLAN.md §Palette) — the role-rhyme
  // continues: amber "the thing we watch" (a spin pointing up), blue its other
  // face, violet "the derived meter" (the TV readout and every sampled bar).
  // The ghost gray is the exact distribution and is the SAME gray in every
  // figure of the lesson — the article's second protagonist wears one coat.
  sUp: '#d97706', // spin +1 ink
  sDn: '#2563eb', // spin −1 ink
  ferro: '#dc2626', // ferromagnetic coupling J > 0 (agree)
  anti: '#0891b2', // antiferromagnetic coupling J < 0 (disagree)
  ghost: '#9ca3af', // the exact distribution — enumeration's bars, always this gray
  held: '#059669', // clamp halo — a spin held by hand
  meter: '#7c3aed', // sampled distributions, TV distance, derived readouts

  // Physics P3, the Z1 compiler (articles/06-z1-compiler/PLAN.md §Persistent
  // chrome) — the series' two promoted inks. `visit` is Part 2's one new
  // color: the visitation glow q(x), how often the upstream program shows an
  // input — warm attention, adjacent to nothing in the p-bit set. `hid` is
  // the hidden-role pink of the three-role kernel partition (input green =
  // held, output violet = meter, hidden pink = summed out) — same hex as
  // dye2, renamed so prose binds to the role. By series convention ferro's
  // red doubles as the violation ink — write conflicts, leaked off-graph
  // mass, broken rate limits all wear it, because a violated coupling and a
  // violated invariant point the same accusing color.
  visit: '#fb923c', // visitation glow q(x) — the program's attention on an input
  hid: '#db2777', // hidden-role spins V_hid — free, summed out, never read

  // CAD C1, the primitives (articles/cad/01-cad-primitives/PLAN.md §Palette) —
  // the role-rhyme again: amber is the thing we watch and drag (the finite
  // coordinates), blue is the thing that acts (the basis, and the curve or
  // surface it produces), violet is the derived meter (basis plots, deviation
  // readouts, counts). Green is the knot — the one quantity in this lesson that
  // is neither coordinate nor output but the partition both live on. Red is the
  // selected topological entity, because in the B-rep panel the question is
  // never "what value" but "which thing", and red is the article's pointing
  // finger. Cyan is the trimmed-away region: the part of an infinite surface a
  // wire refuses.
  ctrl: '#d97706', // control points, cage vertices, T-mesh anchors — what you drag
  curve: '#2563eb', // the evaluated curve or limit surface — what the basis produces
  basis: '#7c3aed', // basis functions, deviation meters, vertex/face counts
  knot: '#059669', // knots, knot lines, refinement strips
  topo: '#dc2626', // the selected B-rep entity — the pointing finger
  hole: '#0891b2', // inner wire, trimmed-away region, the hole that isn't material
} as const

export type PaletteKey = keyof typeof PALETTE
