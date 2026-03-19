/**
 * Gamification utility for Schedulr
 * Handles XP calculation and leveling logic
 */

export const ACTIONS = {
  TASK_COMPLETED: 'task_completed',
  EXAM_LOGGED: 'exam_logged',
  PLANNER_CREATED: 'planner_created',
  DAILY_LOGIN: 'daily_login',
  STUDY_SESSION: 'study_session',
  FOCUS_SESSION_COMPLETED: 'focus_session_completed',
  AI_OPTIMIZATION: 'ai_optimization',
  STUDY_GROUP_JOINED: 'study_group_joined'
}

const XP_VALUES = {
  [ACTIONS.TASK_COMPLETED]: 15,
  [ACTIONS.EXAM_LOGGED]: 50,
  [ACTIONS.PLANNER_CREATED]: 30,
  [ACTIONS.DAILY_LOGIN]: 10,
  [ACTIONS.STUDY_SESSION]: 20, // per hour
  [ACTIONS.FOCUS_SESSION_COMPLETED]: 20,
  [ACTIONS.AI_OPTIMIZATION]: 50,
  [ACTIONS.STUDY_GROUP_JOINED]: 10
}

/**
 * Calculates current level based on total XP
 * Formula: Level = floor(sqrt(xp / 20)) + 1
 */
export const calculateLevel = (xp = 0) => {
  if (xp <= 0) return 1
  return Math.floor(Math.sqrt(xp / 20)) + 1
}

/**
 * Calculates XP required for a specific level
 */
export const xpForLevel = (level) => {
  if (level <= 1) return 0
  return Math.pow(level - 1, 2) * 20
}

/**
 * Calculates progress percentage within current level
 */
export const getLevelProgress = (xp = 0) => {
  const currentLevel = calculateLevel(xp)
  const xpBasis = xpForLevel(currentLevel)
  const nextLevelXp = xpForLevel(currentLevel + 1)
  
  const xpGainedInLevel = xp - xpBasis
  const totalXpInLevel = nextLevelXp - xpBasis
  
  return Math.min(100, Math.max(0, (xpGainedInLevel / totalXpInLevel) * 100))
}

/**
 * Gets XP reward for a specific action
 */
export const getXPForAction = (action) => {
  return XP_VALUES[action] || 0
}
