import { ArrowLeft, ArrowRight, Check, LockKeyhole, ShoppingBag } from 'lucide-react'
import { studioProducts } from '../lib/prototypes'
import type { PrototypeProps } from './Prototype'
import './studio.css'

type Product = (typeof studioProducts)[number]

function cartFromActions(actions: readonly string[]) {
  const cart: { product: Product; size: string }[] = []
  let selected: Product | undefined
  for (const action of actions) {
    if (action.startsWith('Remove item ')) {
      cart.splice(Number(action.slice('Remove item '.length)) - 1, 1)
      continue
    }
    const product = studioProducts.find(item => item.name === action)
    if (product) selected = product
    if (selected && ['Small', 'Medium', 'Large', 'One size'].includes(action)) {
      cart.push({ product: selected, size: action })
    }
  }
  return cart
}

function Garment({ product }: { product: Product }) {
  return <div className={`studio-product-art studio-photo-${product.id}`} aria-hidden="true" />
}

export function StudioApp({ prototype, screen, actions = [], onBack, onNavigate, busy, readonly, replayTarget }: PrototypeProps) {
  const view = prototype.screens[screen]
  const product = studioProducts.find(item => item.id === screen)
  const cart = cartFromActions(actions)
  const hasPair = cart.some(item => item.product.id === 'tee') && cart.some(item => item.product.id === 'sweatshirt')
  const finishedCart = screen === 'done' && actions.at(-1) === 'Finish cart task'
  const inCheckout = ['bag', 'checkout', 'done'].includes(screen)

  return <div className="studio-laptop"><div className="studio-display">
    <span className="studio-webcam" aria-hidden="true" />
    <section className="studio-window" aria-label="DeepSpace Apparel storefront">
    <header className="studio-browser">
      <div className="studio-lights" aria-hidden="true"><i /><i /><i /></div>
      <div className="studio-address"><LockKeyhole size={12} aria-hidden="true" /> DeepSpace Apparel</div>
    </header>
    <div className="studio-brand"><strong>DEEPSPACE APPAREL</strong><span><ShoppingBag size={16} aria-hidden="true" />{cart.length}</span></div>
    <div className="studio-content">
      {onBack && <button className="studio-back" type="button" disabled={busy} onClick={onBack}><ArrowLeft size={15} aria-hidden="true" /> Back</button>}
      {screen === 'done' && <span className="studio-confirmed"><Check size={20} aria-hidden="true" /></span>}
      <h2>{finishedCart ? 'Both items added' : view.title}</h2>
      {product && <><Garment product={product} /><p>{product.description} · {product.price}</p></>}
      {inCheckout && <ul className="studio-cart">
        {cart.map(({ product, size }, index) => <li className="studio-order" key={index}>
          <strong>{product.name}</strong><span>Size {size} · {product.price}</span>
          {screen === 'bag' && onNavigate && !readonly && <button className="studio-remove" type="button"
            aria-label={`Remove ${product.name}, size ${size}`} disabled={busy}
            onClick={() => onNavigate(`Remove item ${index + 1}`, 'bag')}>Remove</button>}
        </li>)}
      </ul>}
      {screen === 'checkout' && <p>Simulated checkout. No payment or shipping details are collected.</p>}
      <div className={screen === 'home' ? 'studio-grid' : 'studio-actions'}>
        {view.buttons.map(([label, destination]) => {
          if (label === 'Checkout' && !cart.length) return null
          if (label === 'Finish cart task' && !hasPair) return null
          const listing = studioProducts.find(item => item.id === destination)
          const content = listing ? <><Garment product={listing} /><strong>{listing.name}</strong><span>{listing.price}</span></>
            : <>{product && `Add ${label} to bag` || label}<ArrowRight size={15} aria-hidden="true" /></>
          return readonly || !onNavigate
            ? <div className="studio-choice" data-replay-target={replayTarget === label ? 'cursor' : undefined} key={label}>{content}</div>
            : <button className="studio-choice" key={label} type="button" disabled={busy} onClick={() => onNavigate(label, destination)}>{content}</button>
        })}
      </div>
    </div>
    </section></div>
    <div className="studio-laptop-base" aria-hidden="true" />
  </div>
}
