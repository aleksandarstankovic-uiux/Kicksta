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
  growthPlusActive: false,
  filters: {
    followingMin: 100,
    followingMax: 5000,
    followerMin: 200,
    followerMax: 50000,
    mediaMin: 10,
    mediaMax: null,
    accountPrivacy: 'all',
    genderTarget: null,
    excludeNsfw: true,
  },
}
