-- ─── Seed milestone definitions ───
-- These are the milestone templates that users can earn.
-- The milestoneRules.ts in frontend checks stats and awards them.

INSERT INTO milestones (slug, title, description, icon)
VALUES
  ('first-steps',        'First Steps',        'Log your very first practice session',    'footprints'),
  ('building-momentum',  'Building Momentum',  'Maintain a 7-day practice streak',        'fire'),
  ('challenge-champion', 'Challenge Champion',  'Complete 5 creative challenges',          'trophy'),
  ('explorer',           'Explorer',            'Try 3 different hobbies',                 'compass'),
  ('dedicated-creator',  'Dedicated Creator',   'Accumulate 10 hours of practice',         'clock'),
  ('consistency-king',   'Consistency King',    'Maintain a 30-day practice streak',       'crown'),
  ('month-one',          'Month One',           'Be on your creative journey for 30 days', 'calendar')
ON CONFLICT (slug) DO NOTHING;
