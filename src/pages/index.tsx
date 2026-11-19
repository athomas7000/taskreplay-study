import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { seo } from '../seo'
import '../replay.css'

export default function Landing() {
  return (
    <div className="replay landing" data-testid="static-landing">
      <Seo {...seo} path="/" />
      <div className="landing-content">
        <div className="eyebrow">TASKREPLAY</div>
        <h1>See where testers<br />take a wrong turn.</h1>
        <p>Run a usability study, follow each click live, and replay the steps that shaped your next design decision.</p>
        <Link className="primary" to="/home">Open study dashboard →</Link>
        <Link className="secondary" to="/test">Join as a tester</Link>
      </div>
    </div>
  )
}
