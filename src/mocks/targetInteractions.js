// Recent interactions per target, surfaced in TargetDetailDrawer's
// "Recent activity" list (drawer slices to 5).
//
// type:
//   'follow'       — engine followed @username via this target
//   'follow_back'  — @username followed the user back
//
// Timestamps anchor to NOW so the demo always reads "fresh" across
// runs. Same pattern as src/mocks/activity.js.
const NOW = new Date()
const hoursAgo = (h) => new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString()

export const mockTargetInteractions = {
  t_001: [
    { id: 'i_001_1', type: 'follow_back', username: '@yoga.ashley', createdAt: hoursAgo(1) },
    { id: 'i_001_2', type: 'follow', username: '@plantbased.priya', createdAt: hoursAgo(2.5) },
    { id: 'i_001_3', type: 'follow_back', username: '@marcus.lifts', createdAt: hoursAgo(5) },
    { id: 'i_001_4', type: 'follow', username: '@brand.partner', createdAt: hoursAgo(6) },
    { id: 'i_001_5', type: 'follow_back', username: '@cleanfoodcrush', createdAt: hoursAgo(8) },
  ],
  t_002: [
    { id: 'i_002_1', type: 'follow', username: '@homeworkout.daily', createdAt: hoursAgo(2) },
    { id: 'i_002_2', type: 'follow_back', username: '@kettlebell.kev', createdAt: hoursAgo(4) },
    { id: 'i_002_3', type: 'follow', username: '@fit.maria', createdAt: hoursAgo(7) },
    { id: 'i_002_4', type: 'follow', username: '@gym.notes', createdAt: hoursAgo(10) },
  ],
  t_003: [
    { id: 'i_003_1', type: 'follow_back', username: '@yoga.studio.east', createdAt: hoursAgo(20) },
    { id: 'i_003_2', type: 'follow_back', username: '@vinyasa.lab', createdAt: hoursAgo(28) },
    { id: 'i_003_3', type: 'follow', username: '@morningflow', createdAt: hoursAgo(34) },
  ],
  t_004: [
    { id: 'i_004_1', type: 'follow', username: '@cleanfoodcrush', createdAt: hoursAgo(48) },
    { id: 'i_004_2', type: 'follow_back', username: '@whole.kitchen', createdAt: hoursAgo(60) },
    { id: 'i_004_3', type: 'follow', username: '@meal.minimal', createdAt: hoursAgo(72) },
  ],
  t_005: [
    { id: 'i_005_1', type: 'follow_back', username: '@runners.club', createdAt: hoursAgo(0.5) },
    { id: 'i_005_2', type: 'follow', username: '@trail.tales', createdAt: hoursAgo(2) },
    { id: 'i_005_3', type: 'follow', username: '@5k.everyday', createdAt: hoursAgo(3) },
    { id: 'i_005_4', type: 'follow_back', username: '@long.miles', createdAt: hoursAgo(6) },
  ],
  t_006: [
    { id: 'i_006_1', type: 'follow', username: '@startup.daily', createdAt: hoursAgo(1) },
    { id: 'i_006_2', type: 'follow', username: '@indie.maker', createdAt: hoursAgo(3) },
    { id: 'i_006_3', type: 'follow_back', username: '@built.in.public', createdAt: hoursAgo(5) },
  ],
  t_007: [
    { id: 'i_007_1', type: 'follow_back', username: '@cafe.minimal', createdAt: hoursAgo(2) },
    { id: 'i_007_2', type: 'follow', username: '@espresso.daily', createdAt: hoursAgo(4) },
    { id: 'i_007_3', type: 'follow_back', username: '@brew.book', createdAt: hoursAgo(7) },
    { id: 'i_007_4', type: 'follow', username: '@latte.lab', createdAt: hoursAgo(9) },
  ],
  t_008: [
    { id: 'i_008_1', type: 'follow', username: '@designer.notes', createdAt: hoursAgo(0.75) },
    { id: 'i_008_2', type: 'follow_back', username: '@ux.weekly', createdAt: hoursAgo(2.5) },
    { id: 'i_008_3', type: 'follow', username: '@type.daily', createdAt: hoursAgo(4) },
    { id: 'i_008_4', type: 'follow_back', username: '@figma.fans', createdAt: hoursAgo(6) },
    { id: 'i_008_5', type: 'follow', username: '@grid.gallery', createdAt: hoursAgo(8) },
  ],
  t_009: [
    { id: 'i_009_1', type: 'follow', username: '@photo.essay', createdAt: hoursAgo(3) },
    { id: 'i_009_2', type: 'follow_back', username: '@street.frames', createdAt: hoursAgo(5) },
    { id: 'i_009_3', type: 'follow', username: '@analog.only', createdAt: hoursAgo(8) },
  ],
  t_010: [
    { id: 'i_010_1', type: 'follow', username: '@hiking.atlas', createdAt: hoursAgo(72) },
    { id: 'i_010_2', type: 'follow_back', username: '@trail.notes', createdAt: hoursAgo(96) },
  ],
  // Archived targets keep their history so the drawer renders something
  // when the user drills in from the Archived bucket.
  t_011: [
    { id: 'i_011_1', type: 'follow_back', username: '@old.partner', createdAt: hoursAgo(240) },
    { id: 'i_011_2', type: 'follow', username: '@old.peer', createdAt: hoursAgo(264) },
  ],
  t_012: [
    { id: 'i_012_1', type: 'follow', username: '@old.brand', createdAt: hoursAgo(312) },
  ],
}
