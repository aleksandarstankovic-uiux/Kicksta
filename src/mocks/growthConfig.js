export const mockGrowthConfig = {
  mode: 'auto',
  likeAfterFollow: true,
  welcomeDm: {
    enabled: false,
    message: 'Hey! Thanks for the follow \ud83d\ude4c Check out our latest drop \u2192 link in bio',
  },
  closeFriendsAdder: {
    enabled: false,
    mode: 'add',
  },
  growthPlusControls: {
    enabled: true,
    speed: 'steady',
    quality: 'targeted',
  },
  growthPlusActive: false,
  // Defaults match the "Most users" Quick preset so each Range dropdown
  // opens on a labelled option (mid) rather than the "Custom…" tail.
  filters: {
    followingMin: 500,
    followingMax: 5000,
    followerMin: 1000,
    followerMax: 50000,
    mediaMin: 10,
    mediaMax: 100,
    accountPrivacy: 'all',
    genderTarget: null,
    excludeNsfw: true,
  },
}

// Mock progress for the Close Friends Adder. Values are intentionally
// mid-flight so the progress bar shows movement.
export const mockCloseFriendsProgress = {
  added: 127,
  total: 482,
}

// Handles cycled through by the Close Friends ticker. Same list is
// reused for both "Adding" (mode === 'add') and "Removing" (mode === 'remove')
// states \u2014 copy is differentiated by the consumer.
export const mockCloseFriendsRecentHandles = [
  '@taylor.fit',
  '@noah.brews',
  '@maya.studio',
  '@kai.rides',
  '@lena.chefs',
]
