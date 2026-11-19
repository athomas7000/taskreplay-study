import { ArrowDown, ArrowRight, CirclePlay } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { SampleReplay } from '../components/SampleReplay'
import { seo } from '../seo'
import '../replay.css'

export default function Landing() {
  return <div className="replay landing taskreplay-landing" data-testid="static-landing">
    <Seo {...seo} path="/" />
    <header className="landing-nav">
      <Link className="landing-brand" to="/"><CirclePlay size={24} aria-hidden="true" /> TaskReplay</Link>
      <div className="site-auth-actions">
        <Link to="/home?auth=login">Log in</Link>
        <Link className="site-sign-up" to="/home?auth=signup">Sign up</Link>
      </div>
    </header>
    <nav className="site-role-links" aria-label="Main navigation">
      <Link to="/home">Run a Study</Link><Link to="/test">Take a Test</Link><Link to="/research">Why Test?</Link>
    </nav>
    <main className="landing-grid">
      <section className="landing-intro">
        <p className="landing-category">Usability testing</p>
        <h1>See where testers <em>get stuck.</em></h1>
        <p className="landing-description">Run a study, follow clicks live, and replay the moment someone takes a wrong turn.</p>
        <div className="landing-cta">
          <Link className="primary" to="/home">Open Manager View <ArrowRight size={17} aria-hidden="true" /></Link>
          <a href="#sample-replay">Try a sample replay <ArrowDown size={15} aria-hidden="true" /></a>
        </div>
      </section>
      <SampleReplay />
    </main>
  </div>
}
