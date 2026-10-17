// Manually-defined enum types that match both the PostgreSQL schema (production)
// and the SQLite dev schema (where enums become plain strings).

export type Platform = 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'LINKEDIN' | 'TWITTER' | 'OTHER';
export type ContentFormat = 'SHORT_VIDEO' | 'LONG_VIDEO' | 'CAROUSEL' | 'STATIC_POST' | 'BLOG' | 'PODCAST' | 'OTHER';
export type ContentStatus = 'IDEA' | 'PLANNED' | 'SCRIPT_READY' | 'IN_PRODUCTION' | 'READY_TO_PUBLISH' | 'PUBLISHED';
export type IdeaStatus = 'SAVED' | 'CONVERTED' | 'REJECTED';
export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type GoalPeriod = 'WEEKLY' | 'MONTHLY';
