export interface ComponentTypeInfo {
  id: string;
  name: string;
  defaultLifetimeDistance: number; // meters
  defaultLifetimeDays?: number;
  description: string;
}

// Distance in meters (1 mile = 1609.34m)
const MI = 1609.34;

export const COMPONENT_TYPES: ComponentTypeInfo[] = [
  {
    id: 'chain',
    name: 'Chain',
    defaultLifetimeDistance: 2000 * MI,
    description: 'Drivetrain chain — replace when 0.5-0.75% wear is measured'
  },
  {
    id: 'cassette',
    name: 'Cassette',
    defaultLifetimeDistance: 5000 * MI,
    description: 'Rear cassette — typically lasts 2-3 chains'
  },
  {
    id: 'chainrings',
    name: 'Chainrings',
    defaultLifetimeDistance: 10000 * MI,
    description: 'Front chainrings — last significantly longer than cassettes'
  },
  {
    id: 'tires_front',
    name: 'Front Tire',
    defaultLifetimeDistance: 3500 * MI,
    description: 'Front tire — less wear than rear, check for cuts and wear indicators'
  },
  {
    id: 'tires_rear',
    name: 'Rear Tire',
    defaultLifetimeDistance: 3000 * MI,
    description: 'Rear tire — wears faster due to higher load and drive force'
  },
  {
    id: 'brake_pads',
    name: 'Brake Pads',
    defaultLifetimeDistance: 1000 * MI,
    description: 'Brake pads (rim or disc) — varies greatly with terrain and weather'
  },
  {
    id: 'bar_tape',
    name: 'Bar Tape',
    defaultLifetimeDistance: 5000 * MI,
    defaultLifetimeDays: 365,
    description: 'Handlebar tape — replace when worn, dirty, or losing grip'
  },
  {
    id: 'chain_wax',
    name: 'Chain Wax Application',
    defaultLifetimeDistance: 200 * MI,
    description: 'Hot wax chain treatment — reapply when chain gets noisy'
  },
  {
    id: 'chain_lube',
    name: 'Chain Lube Application',
    defaultLifetimeDistance: 100 * MI,
    description: 'Traditional chain lube — reapply when chain gets dry or noisy'
  },
  {
    id: 'cables',
    name: 'Cables & Housing',
    defaultLifetimeDistance: 5000 * MI,
    defaultLifetimeDays: 365,
    description: 'Shift and brake cables — replace when shifting becomes sluggish'
  },
  {
    id: 'wheels',
    name: 'Wheels',
    defaultLifetimeDistance: 20000 * MI,
    description: 'Wheelset — check spoke tension and rim wear regularly'
  },
  {
    id: 'bottom_bracket',
    name: 'Bottom Bracket',
    defaultLifetimeDistance: 10000 * MI,
    description: 'Bottom bracket bearings — replace when creaking or play develops'
  },
  {
    id: 'headset',
    name: 'Headset Bearings',
    defaultLifetimeDistance: 15000 * MI,
    description: 'Headset bearings — replace when notchy or loose'
  },
  {
    id: 'hub_bearings',
    name: 'Hub Bearings',
    defaultLifetimeDistance: 15000 * MI,
    description: 'Front and rear hub bearings — service or replace when rough'
  },
];

export function getComponentType(id: string): ComponentTypeInfo | undefined {
  return COMPONENT_TYPES.find(c => c.id === id);
}
