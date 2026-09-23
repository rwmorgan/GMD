/* Curated avatar icon set. Students pick one for their profile;
   picker id is stored in profiles.avatar and rendered wherever a
   name appears (nav, class overview, student list). No uploads —
   keeps this free of storage/moderation for a classroom of minors. */

export const AVATARS = [
  { id: 'fox', icon: '🦊', label: 'Fox' },
  { id: 'wolf', icon: '🐺', label: 'Wolf' },
  { id: 'lion', icon: '🦁', label: 'Lion' },
  { id: 'tiger', icon: '🐯', label: 'Tiger' },
  { id: 'panda', icon: '🐼', label: 'Panda' },
  { id: 'koala', icon: '🐨', label: 'Koala' },
  { id: 'owl', icon: '🦉', label: 'Owl' },
  { id: 'eagle', icon: '🦅', label: 'Eagle' },
  { id: 'penguin', icon: '🐧', label: 'Penguin' },
  { id: 'octopus', icon: '🐙', label: 'Octopus' },
  { id: 'turtle', icon: '🐢', label: 'Turtle' },
  { id: 'shark', icon: '🦈', label: 'Shark' },
  { id: 'dragon', icon: '🐉', label: 'Dragon' },
  { id: 'unicorn', icon: '🦄', label: 'Unicorn' },
  { id: 'trex', icon: '🦖', label: 'T-Rex' },
  { id: 'frog', icon: '🐸', label: 'Frog' },
  { id: 'robot', icon: '🤖', label: 'Robot' },
  { id: 'alien', icon: '👾', label: 'Alien' },
  { id: 'ufo', icon: '🛸', label: 'UFO' },
  { id: 'rocket', icon: '🚀', label: 'Rocket' },
  { id: 'ninja', icon: '🥷', label: 'Ninja' },
  { id: 'wizard', icon: '🧙', label: 'Wizard' },
  { id: 'hero', icon: '🦸', label: 'Hero' },
  { id: 'crown', icon: '👑', label: 'Crown' },
  { id: 'shield', icon: '🛡️', label: 'Shield' },
  { id: 'sword', icon: '⚔️', label: 'Sword' },
  { id: 'crystalball', icon: '🔮', label: 'Crystal Ball' },
  { id: 'dice', icon: '🎲', label: 'Dice' },
  { id: 'controller', icon: '🎮', label: 'Controller' },
  { id: 'joystick', icon: '🕹️', label: 'Joystick' },
  { id: 'puzzle', icon: '🧩', label: 'Puzzle' },
  { id: 'star', icon: '🌟', label: 'Star' },
];

const AVATAR_MAP = new Map(AVATARS.map(a => [a.id, a.icon]));

export function avatarIcon(id) {
  return AVATAR_MAP.get(id) || null;
}
