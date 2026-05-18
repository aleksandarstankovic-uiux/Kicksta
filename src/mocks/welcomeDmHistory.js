// Recent welcome DMs sent, surfaced on /engagement under the Welcome
// DM card (only when the toggle is on and the user is on Advanced).
//
// Anchors to NOW so the demo always reads "fresh" ("2h ago", "1d ago")
// on first load rather than drifting stale against hardcoded ISO
// strings. Pravatar URLs provide deterministic avatar thumbnails per
// username; production swaps these for real IG profile pics.
const NOW = new Date()
const _minAgo = (m) => new Date(NOW.getTime() - m * 60 * 1000).toISOString()
const _hourAgo = (h) => new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString()

export const mockWelcomeDmHistory = [
  {
    id: 'wdm_1',
    username: '@yoga.ashley',
    createdAt: _minAgo(35),
    profilePic: 'https://i.pravatar.cc/80?u=yoga.ashley',
  },
  {
    id: 'wdm_2',
    username: '@plantbased.priya',
    createdAt: _hourAgo(2),
    profilePic: 'https://i.pravatar.cc/80?u=plantbased.priya',
  },
  {
    id: 'wdm_3',
    username: '@marcus.lifts',
    createdAt: _hourAgo(6),
    profilePic: 'https://i.pravatar.cc/80?u=marcus.lifts',
  },
  {
    id: 'wdm_4',
    username: '@cleanfoodcrush',
    createdAt: _hourAgo(11),
    profilePic: 'https://i.pravatar.cc/80?u=cleanfoodcrush',
  },
  {
    id: 'wdm_5',
    username: '@brand.partner',
    createdAt: _hourAgo(20),
    profilePic: 'https://i.pravatar.cc/80?u=brand.partner',
  },
  {
    id: 'wdm_6',
    username: '@runners.club',
    createdAt: _hourAgo(28),
    profilePic: 'https://i.pravatar.cc/80?u=runners.club',
  },
  {
    id: 'wdm_7',
    username: '@trail.tales',
    createdAt: _hourAgo(36),
    profilePic: 'https://i.pravatar.cc/80?u=trail.tales',
  },
  {
    id: 'wdm_8',
    username: '@chefjules.co',
    createdAt: _hourAgo(44),
    profilePic: 'https://i.pravatar.cc/80?u=chefjules.co',
  },
  {
    id: 'wdm_9',
    username: '@morning.moves',
    createdAt: _hourAgo(52),
    profilePic: 'https://i.pravatar.cc/80?u=morning.moves',
  },
  {
    id: 'wdm_10',
    username: '@studioflora',
    createdAt: _hourAgo(60),
    profilePic: 'https://i.pravatar.cc/80?u=studioflora',
  },
  {
    id: 'wdm_11',
    username: '@bikepacker.ben',
    createdAt: _hourAgo(68),
    profilePic: 'https://i.pravatar.cc/80?u=bikepacker.ben',
  },
  {
    id: 'wdm_12',
    username: '@ceramics.kai',
    createdAt: _hourAgo(76),
    profilePic: 'https://i.pravatar.cc/80?u=ceramics.kai',
  },
  {
    id: 'wdm_13',
    username: '@homebrew.dan',
    createdAt: _hourAgo(84),
    profilePic: 'https://i.pravatar.cc/80?u=homebrew.dan',
  },
  {
    id: 'wdm_14',
    username: '@espresso.eva',
    createdAt: _hourAgo(92),
    profilePic: 'https://i.pravatar.cc/80?u=espresso.eva',
  },
]
