import { ArrowLeft, ArrowRight, Check, Clock, Coffee, Heart, MapPin, Receipt, ShoppingBag } from 'lucide-react'
import { cafe } from '../lib/prototypes'
import type { PrototypeProps } from './Prototype'
import './matcha.css'

const drinks: Record<string, { name: string; price: string; description: string }> = {
  'Classic Matcha': { name: 'Iced Classic Matcha', price: '$6.00', description: 'Ceremonial matcha over milk and ice' },
  'Strawberry Matcha': { name: 'Iced Strawberry Matcha', price: '$7.00', description: 'Strawberry purée, oat milk, ceremonial matcha' },
  'Vanilla Matcha': { name: 'Iced Vanilla Matcha', price: '$6.50', description: 'Vanilla bean, milk, and ceremonial matcha' },
}

export function MatchaApp({ screen, onNavigate, onBack, busy, actions = [], readonly, replayTarget }: PrototypeProps) {
  const view = cafe.screens[screen] ?? cafe.screens.home
  const actionHistory = [...actions].reverse()
  const choice = actionHistory.find(action => Object.hasOwn(drinks, action) || action === 'Reorder')
  const drink = drinks[choice ?? ''] ?? drinks['Strawberry Matcha']
  const time = actionHistory.find(action => action === '12:30 PM' || action === '1:00 PM') ?? '12:30 PM'
  const checkout = ['pickup', 'review', 'done'].includes(screen)

  function action(label: string, destination: string, content: React.ReactNode, style = '') {
    return readonly || !onNavigate
      ? <div className={style} data-replay-target={replayTarget === label ? 'tap' : undefined} key={label}>{content}</div>
      : <button className={style} key={label} type="button" disabled={busy} onClick={() => onNavigate(label, destination)}>{content}</button>
  }

  return <div className="matcha-phone">
    <div className="matcha-phone-camera" aria-hidden="true" />
    <section className="matcha-app" aria-label="Deep Space Café ordering app">
    <header className="matcha-header">
      <div className="matcha-brand"><Coffee size={17} aria-hidden /> Deep Space Café <span>PICKUP</span></div>
      <ShoppingBag size={19} aria-hidden />
    </header>
    <div className="matcha-main">
      {screen !== 'home' && screen !== 'done' && (readonly
        ? <div className="matcha-back" data-replay-target={replayTarget === 'Back' ? 'tap' : undefined}><ArrowLeft size={15} aria-hidden /> Back</div>
        : onBack && <button className="matcha-back" type="button" onClick={onBack} disabled={busy}><ArrowLeft size={15} aria-hidden /> Back</button>)}
      {screen === 'home' && <>
        <div className="matcha-hero">
          <h2>Meet your<br />matcha moment.</h2>
          <p>Hand-whisked and ready for pickup.</p>
        </div>
        {action('Browse Drinks', 'menu', <>Browse drinks <ArrowRight size={16} aria-hidden /></>, 'matcha-cta')}
        <div className="matcha-shortcuts">
          {action('Past Orders', 'orders', <><Receipt size={18} aria-hidden /> Past Orders</>, 'matcha-shortcut')}
          {action('Favorites', 'favorites', <><Heart size={18} aria-hidden /> Favorites</>, 'matcha-shortcut')}
        </div>
      </>}
      {screen !== 'home' && screen !== 'done' && <h2>{view.title}</h2>}
      {screen === 'menu' && view.buttons.map(([label, destination]) => {
        const item = drinks[label]
        return action(label, destination, <><span><strong>{item.name}</strong><small>{item.description}</small></span><b>{item.price}</b></>, 'matcha-item')
      })}
      {(screen === 'orders' || screen === 'favorites') && <>
        <div className="matcha-item"><span><strong>Iced Strawberry Matcha</strong><small>{screen === 'orders' ? 'Previous pickup · 1 item' : 'Saved drink · Oat milk'}</small></span><b>$7.00</b></div>
        {screen === 'favorites' && action('Reorder', 'pickup', <>Reorder <ArrowRight size={16} aria-hidden /></>, 'matcha-cta')}
      </>}
      {screen === 'pickup' && <>
        <p className="matcha-detail"><MapPin size={16} aria-hidden /> Deep Space Café · Pickup counter</p>
        {view.buttons.map(([label, destination]) => action(label, destination, <><span><Clock size={16} aria-hidden /> {label}</span><ArrowRight size={16} aria-hidden /></>, 'matcha-item'))}
      </>}
      {screen === 'done' && <div className="matcha-confirmation">
        <span className="matcha-check"><Check size={28} aria-hidden /></span>
        <h2>Pickup confirmed</h2>
        <p>See you at the pickup counter.</p>
      </div>}
      {checkout && screen !== 'pickup' && <div className="matcha-ticket">
        <div><span>Pickup time</span><strong>{time}</strong></div>
        <div><span>Location</span><strong>Deep Space Café</strong></div>
        <div><span>1 × {drink.name}</span><strong>{drink.price}</strong></div>
      </div>}
      {screen === 'review' && action('Confirm Pickup', 'done', <>Confirm pickup <ArrowRight size={16} aria-hidden /></>, 'matcha-cta')}
    </div>
    <footer className="matcha-footer"><MapPin size={14} aria-hidden /> Pickup at Deep Space Café</footer>
    </section>
    <div className="matcha-phone-gesture" aria-hidden="true" />
  </div>
}
