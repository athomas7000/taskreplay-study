import { z } from 'zod'

const screen = z.object({
  title: z.string().min(1).max(80),
  body: z.string().max(300).optional(),
  buttons: z.array(z.tuple([z.string().min(1).max(60), z.string()])).max(10),
})
const script = z.object({
  name: z.string().min(1).max(60),
  screens: z.record(z.string().regex(/^[a-z][a-z0-9_-]{0,29}$/), screen),
}).refine(({ screens }) => {
  const keys = Object.keys(screens)
  return keys.length <= 20 && keys.includes('home') && keys.includes('done')
    && screens.done.buttons.length === 0
    && Object.values(screens).every(view => view.buttons.every(([, target]) => Object.hasOwn(screens, target)))
}, 'Include home and done screens, use valid destinations, and limit the script to 20 screens.')

export type Script = z.infer<typeof script>

export const cafe: Script = {
  name: 'Deep Space Café',
  screens: {
    home: { title: 'What are you sipping?', body: 'Order ahead from our matcha bar.', buttons: [['Past Orders', 'orders'], ['Favorites', 'favorites'], ['Browse Drinks', 'menu']] },
    orders: { title: 'Past Orders', body: 'Receipt · Iced Strawberry Matcha · $7', buttons: [] },
    favorites: { title: 'Your Favorites', body: 'Iced Strawberry Matcha', buttons: [['Reorder', 'pickup']] },
    menu: { title: 'Matcha Menu', buttons: [['Classic Matcha', 'pickup'], ['Strawberry Matcha', 'pickup'], ['Vanilla Matcha', 'pickup']] },
    pickup: { title: 'Choose Pickup Time', buttons: [['12:30 PM', 'review'], ['1:00 PM', 'review']] },
    review: { title: 'Review Your Order', body: 'Check your drink and pickup time.', buttons: [['Confirm Pickup', 'done']] },
    done: { title: 'Pickup Confirmed', body: 'Your matcha order is saved in this demo.', buttons: [] },
  },
}

export const studioProducts = [
  { id: 'tee', name: 'I ❤️ SDKs Tee', price: '$32', description: 'Heavyweight cotton in washed black.', mark: 'I ♥ SDKs' },
  { id: 'hoodie', name: 'Orbital Hoodie', price: '$68', description: 'Brushed fleece in lunar gray.', mark: 'ORBITAL' },
  { id: 'cap', name: 'Signal Cap', price: '$24', description: 'Adjustable six-panel cap in forest green.', mark: 'DS' },
  { id: 'sweatshirt', name: 'Starburst Crewneck', price: '$54', description: 'Midweight fleece with a chest starburst.', mark: 'DEEP SPACE' },
] as const

const originalStudio: Script = {
  name: 'DEEP SPACE STUDIO',
  screens: {
    home: { title: 'Shop the collection', buttons: studioProducts.slice(0, 3).map(item => [item.name, item.id]) },
    tee: { title: studioProducts[0].name, buttons: [['Small', 'bag'], ['Medium', 'bag'], ['Large', 'bag']] },
    hoodie: { title: studioProducts[1].name, buttons: [['Small', 'bag'], ['Medium', 'bag'], ['Large', 'bag']] },
    cap: { title: studioProducts[2].name, buttons: [['One size', 'bag']] },
    bag: { title: 'Shopping bag', buttons: [['Checkout', 'checkout']] },
    checkout: { title: 'Review order', buttons: [['Place order', 'done']] },
    done: { title: 'Order confirmed', buttons: [] },
  },
}

export const studio: Script = {
  ...originalStudio,
  name: 'DeepSpace Apparel',
  screens: {
    ...originalStudio.screens,
    home: { ...originalStudio.screens.home, buttons: studioProducts.map(item => [item.name, item.id]) },
    sweatshirt: { title: studioProducts[3].name, buttons: [['Small', 'bag'], ['Medium', 'bag'], ['Large', 'bag']] },
    bag: { title: 'Shopping bag', buttons: [['Continue shopping', 'home'], ['Finish cart task', 'done'], ['Checkout', 'checkout']] },
  },
}

export function isStudioPrototype(prototype: Script) {
  const source = JSON.stringify(prototype)
  return source === JSON.stringify(studio)
    || source === JSON.stringify({ ...studio, name: originalStudio.name })
    || source === JSON.stringify(originalStudio)
}

export const defaultScript = JSON.stringify(cafe)
const legacyCafeScript = JSON.stringify({ ...cafe, name: 'Juniper Matcha' })

export function isCafePrototype(prototype: Script) {
  const source = JSON.stringify(prototype)
  return source === defaultScript || source === legacyCafeScript
}

export function parseScript(source: string): Script {
  if (source.length > 32_000) throw new Error('Keep the script under 32,000 characters.')
  return script.parse(JSON.parse(source))
}

export function readScript(source?: string): Script {
  try {
    return source ? parseScript(source) : cafe
  } catch {
    return cafe
  }
}

export const projectNames = { cafe: 'Deep Space Café', apparel: 'DeepSpace Apparel', custom: 'Custom' } as const
export type Project = keyof typeof projectNames

export function projectForScript(source?: string): Project {
  const prototype = readScript(source)
  if (isCafePrototype(prototype)) return 'cafe'
  if (isStudioPrototype(prototype)) return 'apparel'
  return 'custom'
}
