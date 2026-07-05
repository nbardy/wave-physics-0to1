import { StringWaveDemo } from '../sims/StringWaveDemo'
import { TeX } from '../components/TeX'
import { GpuParityCheck } from '../components/GpuParityCheck'

// This page exists only to prove the toolchain renders correctly:
// React + router + KaTeX math + a canvas sim. Delete it once real lessons exist.
export default function StackCheck() {
  return (
    <div className="prose">
      <h1>Stack check</h1>
      <p>
        A scaffold self-test — it confirms math and sims render. It is not lesson content; delete
        it once the curriculum is under way.
      </p>

      <h2>Math (KaTeX)</h2>
      <p>The 1-D wave equation, as display math:</p>
      <TeX block>{String.raw`\frac{\partial^2 u}{\partial t^2} = c^2\,\frac{\partial^2 u}{\partial x^2}`}</TeX>
      <p>
        and inline, the wave speed on a string: <TeX>{String.raw`c = \sqrt{T/\mu}`}</TeX>.
      </p>

      <h2>Interactive sim (canvas)</h2>
      <p>A plucked string, integrated with explicit finite differences:</p>
      <StringWaveDemo />

      <h2>WebGPU solver (compute shaders)</h2>
      <p>
        Invariant checks for the WGSL Stable Fluids port (analytic advection, projection,
        CPU/GPU agreement):
      </p>
      <GpuParityCheck />
    </div>
  )
}
