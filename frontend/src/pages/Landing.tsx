import { Link, useNavigate } from 'react-router-dom'
import Illustration from '../components/Illustration'
import { SiteNav } from '../components/Layout'
import { EXAMPLES } from '../lib/examples'
import { useStore } from '../lib/store'

export default function Landing() {
  const { caps, user } = useStore()
  const nav = useNavigate()
  return (
    <div className="site">
      <SiteNav />
      <section className="hero">
        <div>
          <h1>Different languages.<em>Same world.</em></h1>
          <p className="lede">Paste any text. LEXIA recognizes the language, shows how sure it is, and translates it with the meaning behind the words.</p>
          <div className="hero-actions">
            <Link to={user ? "/translate" : "/login?next=/translate"} className="btn primary">Start translating</Link>
            <Link to={user ? "/explore" : "/login?next=/explore"} className="btn ghost">Browse languages</Link>
          </div>
          <div className="hero-facts">
            <div><b>{caps ? `${caps.languages}` : '130+'}</b><span>languages supported</span></div>
            <div><b>Automatic</b><span>language detection</span></div>
            <div><b>{caps?.styles.formal ? 'Three' : 'Two'}</b><span>translation styles</span></div>
          </div>
        </div>
        <Illustration />
      </section>

      <div className="band">
        <section className="section">
          <h2>Every script, read on its own terms.</h2>
          <p className="sub">Choose a greeting to see how LEXIA recognizes it: the language, its family, its script and how confident the detector is.</p>
          <div className="scripts">
            {EXAMPLES.map((e) => (
              <button key={e.name} className="script-card" onClick={() => nav(user ? '/recognize' : '/login?next=/recognize', { state: { text: e.text } })}
                aria-label={`Recognize ${e.name}: ${e.text}`}>
                <span className="greet" lang={e.name === 'Arabic' ? 'ar' : undefined} dir={e.name === 'Arabic' ? 'rtl' : undefined}>{e.text}</span>
                <span className="meta"><b>{e.name}</b><span>{e.script}</span></span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="section">
        <h2>From a line of text to its meaning.</h2>
        <ol className="steps">
          <li><h3>Recognize</h3><p>LEXIA reads the script and the words, names the language and reports its confidence, with close alternatives when text is short or mixed.</p></li>
          <li><h3>Choose</h3><p>Pick a target language and a style{caps?.styles.formal ? ': natural, formal or literal' : ': natural or literal'}. Swap directions any time.</p></li>
          <li><h3>Understand</h3><p>Get the translation plus a meaning check: a back-translation, word-by-word glosses{caps?.llm ? ', and written notes on tone and usage' : ''}.</p></li>
        </ol>
      </section>

      <div className="band">
        <section className="section cta">
          <h2>Say it in a language that listens.</h2>
          <Link to={user ? "/translate" : "/login?next=/translate"} className="btn primary">Open the translator</Link>
        </section>
      </div>
      <footer className="footer"><span>LEXIA · Language recognition and translation</span><span><Link to={user ? "/explore" : "/login?next=/explore"}>Languages</Link> · <Link to={user ? "/history" : "/login?next=/history"}>History</Link> · <Link to={user ? "/settings" : "/login?next=/settings"}>Settings</Link></span></footer>
    </div>
  )
}
