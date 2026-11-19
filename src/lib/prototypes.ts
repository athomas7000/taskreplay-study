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
  name: 'Juniper Matcha',
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

export const game: Script = {
  name: 'Moonbase Rescue',
  screens: {
    home: { title: 'Mission Control', body: 'Find a power cell and restore the beacon.', buttons: [['Hangar', 'hangar'], ['Supply Room', 'supplies'], ['Control Room', 'control'], ['Crew Quarters', 'quarters']] },
    hangar: { title: 'Hangar', body: 'The repair drone has already left.', buttons: [['Read the flight log', 'log']] },
    log: { title: 'Flight Log', body: 'The crew moved spare cells to the supply room.', buttons: [['Go to supplies', 'supplies']] },
    quarters: { title: 'Crew Quarters', buttons: [['Read the note', 'log'], ['Go to control', 'control']] },
    supplies: { title: 'Supply Room', buttons: [['Take the power cell', 'repair'], ['Check empty crates', 'crates']] },
    crates: { title: 'Empty Crates', buttons: [] },
    control: { title: 'Control Room', body: 'The beacon needs a power cell.', buttons: [['Look for supplies', 'supplies'], ['Read the flight log', 'log']] },
    repair: { title: 'Beacon Panel', buttons: [['Install power cell', 'done']] },
    done: { title: 'Beacon Online', buttons: [] },
  },
}

export const defaultScript = JSON.stringify(cafe)

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
