import { useEffect, useState } from 'react'
import { Check, CirclePlay, Coffee, MousePointer2, ShoppingBag, TabletSmartphone, UserRound } from 'lucide-react'
import { Prototype } from './Prototype'
import { cafe, studio } from '../lib/prototypes'
import '../landing.css'

const examples = {
  cafe: {
    prototype: cafe,
    task: 'Reorder your usual matcha for pickup at 12:30 PM.',
    targets: ['Past Orders', 'Back', 'Favorites', 'Reorder', '12:30 PM', 'Confirm Pickup'],
    notes: [
      'Start on the café home screen and show me how you would reorder your usual drink.',
      'They opened Past Orders first. That seems like a natural place to look for a reorder option.',
      'They went back after seeing the receipt. I’ll flag this screen to review later.',
      'They found the saved drink under Favorites.',
      'Reorder took them directly to pickup time selection.',
      'They selected 12:30 PM. The review screen gives them a chance to check the time.',
      'Pickup confirmed. I’d test adding a reorder button to Past Orders next.',
    ],
    steps: [
      { label: 'Started session', screen: 'home' },
      { label: 'Opened past orders', screen: 'orders' },
      { label: 'Went back', screen: 'home' },
      { label: 'Opened favorites', screen: 'favorites' },
      { label: 'Selected reorder', screen: 'pickup', action: 'Reorder' },
      { label: 'Selected 12:30 PM', screen: 'review', action: '12:30 PM' },
      { label: 'Confirmed pickup', screen: 'done', action: 'Confirm Pickup' },
    ],
  },
  apparel: {
    prototype: studio,
    task: 'Add a tee and crewneck to the bag.',
    targets: ['I ❤️ SDKs Tee', 'Medium', 'Continue shopping', 'Starburst Crewneck', 'Large', 'Finish cart task'],
    notes: [
      'Find the SDKs tee and the Starburst Crewneck, then add both to the bag.',
      'They found the tee in the collection.',
      'The bag shows the tee in medium.',
      'They returned to the collection to find the second item.',
      'They opened the Starburst Crewneck.',
      'The bag shows both items and their selected sizes.',
      'Both items are in the bag. The tester finished the task.',
    ],
    steps: [
      { label: 'Opened the collection', screen: 'home' },
      { label: 'Opened the SDKs tee', screen: 'tee', action: 'I ❤️ SDKs Tee' },
      { label: 'Added medium tee', screen: 'bag', action: 'Medium' },
      { label: 'Continued shopping', screen: 'home' },
      { label: 'Opened the crewneck', screen: 'sweatshirt', action: 'Starburst Crewneck' },
      { label: 'Added large crewneck', screen: 'bag', action: 'Large' },
      { label: 'Finished cart task', screen: 'done', action: 'Finish cart task' },
    ],
  },
}

type Example = keyof typeof examples

export function SampleReplay() {
  const [example, setExample] = useState<Example>('cafe')
  const [step, setStep] = useState(0)
  const { prototype, task, steps, notes, targets } = examples[example]
  const current = steps[step]
  const atEnd = step === steps.length - 1

  useEffect(() => {
    const timer = window.setTimeout(() => setStep(atEnd ? 0 : step + 1), atEnd ? 4600 : 3400)
    return () => window.clearTimeout(timer)
  }, [example, atEnd, step])

  function changeExample(next: Example) {
    setExample(next)
    setStep(0)
  }

  return <section className="landing-demo" id="sample-replay" aria-labelledby="sample-heading">
    <header className="landing-demo-header">
      <h2 id="sample-heading"><CirclePlay size={19} aria-hidden="true" /> Sample replay</h2>
      <div className="landing-demo-selector">
        <p id="sample-choice-label">Which one do you want to test?</p>
        <div className="landing-switch" role="group" aria-labelledby="sample-choice-label">
        <button type="button" aria-pressed={example === 'cafe'} onClick={() => changeExample('cafe')}><Coffee size={15} aria-hidden="true" /> Deep Space Café</button>
        <button type="button" aria-pressed={example === 'apparel'} onClick={() => changeExample('apparel')}><ShoppingBag size={15} aria-hidden="true" /> DeepSpace Apparel</button>
      </div>
    </div>
    </header>
    <div className="landing-demo-grid">
      <div className="landing-events">
        <h3 className="landing-view-title"><UserRound size={15} aria-hidden="true" /> Manager View</h3>
        <div className="landing-manager">
          <h3>Manager commentary</h3>
          <p>{notes[step]}</p>
        </div>
        <ol aria-label="Recorded tester actions" key={example}>
          {steps.slice(0, step + 1).map(({ label }, index) => <li key={label} aria-current={step === index ? 'step' : undefined}>
            {index === steps.length - 1 ? <Check size={14} aria-hidden="true" /> : <MousePointer2 size={14} aria-hidden="true" />}
            {label}
          </li>)}
        </ol>
      </div>
      <div className="landing-preview">
        <h3 className="landing-view-title"><TabletSmartphone size={15} aria-hidden="true" /> Tester View</h3>
        <div className="landing-assigned-task">
          <h3>Tester task</h3>
          <p>{task}</p>
        </div>
        <div className="landing-device-stage">
          <Prototype prototype={prototype} screen={current.screen} readonly replayTarget={targets[step]}
          actions={steps.slice(0, step + 1).flatMap(item => 'action' in item && item.action ? [item.action] : [])} />
        </div>
      </div>
    </div>
  </section>
}
