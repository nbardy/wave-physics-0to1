import { RailwayReform } from '../sims/RailwayReform'
import { DictionaryReplay } from '../sims/DictionaryReplay'
import { WhichForce } from '../sims/WhichForce'
import { LinkedRings } from '../sims/LinkedRings'

// TEMPORARY verification harness for the four new lesson-02 gap figures.
// This file is restored to its committed state after screenshotting.
export default function StackCheck() {
  return (
    <div className="prose">
      <h1>Gap figures preview</h1>
      <h2>a — RailwayReform</h2>
      <RailwayReform />
      <h2>b — DictionaryReplay</h2>
      <DictionaryReplay />
      <h2>c — WhichForce</h2>
      <WhichForce />
      <h2>d — LinkedRings</h2>
      <LinkedRings />
    </div>
  )
}
