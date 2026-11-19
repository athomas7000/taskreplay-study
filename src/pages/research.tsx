import { ArrowLeft, ArrowRight, CirclePlay } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { seo } from '../seo'
import '../replay.css'
import '../landing.css'

export default function ResearchPage() {
  return <div className="replay research-page">
    <Seo {...seo} title="Why test? · TaskReplay" description="Learn how usability testing can reveal where customers get stuck and what to test next." path="/research" />
    <header className="landing-nav">
      <Link className="landing-brand" to="/"><CirclePlay size={24} aria-hidden="true" /> TaskReplay</Link>
      <Link className="primary" to="/home">Run a Study <ArrowRight size={15} aria-hidden="true" /></Link>
    </header>
    <main className="research-main">
      <Link className="project-back" to="/home"><ArrowLeft size={16} aria-hidden="true" /> Manager View</Link>
      <header className="research-intro">
        <p className="eyebrow">WHY USABILITY TESTING MATTERS</p>
        <h1>Get to know your customers and users.</h1>
        <p>Watch people try a real task. Their first click, detours, and abandoned attempts can point to what your team should investigate before shipping a change.</p>
      </header>
      <section aria-label="Research evidence" className="research-stats">
        <article className="panel">
          <strong className="research-stat">17%</strong>
          <h2>Checkout complexity</h2>
          <p>Baymard reports that 17% of surveyed US online shoppers cited a long or complicated checkout as a reason for abandoning a cart.</p>
          <a href="https://baymard.com/lists/cart-abandonment-rate">Baymard Institute · Cart abandonment research</a>
        </article>
        <article className="panel">
          <strong className="research-stat">5 users</strong>
          <h2>A starting point for qualitative testing</h2>
          <p>Nielsen Norman Group recommends small rounds with representative users to find usability issues, make changes, and test the revision.</p>
          <a href="https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/">Nielsen Norman Group · Testing with five users</a>
        </article>
      </section>
      <section className="panel research-analysis">
        <h2>What this means for your team</h2>
        <p>A checkout metric can tell you that people left. A replay can show the step they reached and whether they tried another route. If several Café testers open Past Orders before finding Reorder under Favorites, you have a specific change to try: put a reorder action on the receipt screen and test it again.</p>
        <p>Counts from a small study help you prioritize what to investigate. Estimating how often a problem affects your whole customer base requires a broader measurement plan.</p>
        <h2>Recommendations for your first study</h2>
        <ol className="role-steps">
          <li><strong>Choose one important task.</strong> Write the outcome in the customer’s words and leave out instructions about which buttons to click.</li>
          <li><strong>Recruit people who would actually do it.</strong> Note where they backtrack, stop, or take an unexpected route. Replay examples before choosing a fix.</li>
          <li><strong>Change one thing and retest.</strong> Compare completion and backtracking on the same task so the result tells you whether the change helped.</li>
        </ol>
        <Link className="primary" to="/home">Run your first study</Link>
      </section>
    </main>
  </div>
}
