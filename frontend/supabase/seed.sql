-- ═══════════════════════════════════════════════════════════
-- Meraki — Seed Data (Full, Updated)
-- Run after the migration to populate reference tables.
-- ═══════════════════════════════════════════════════════════


-- ─── Hobby Categories ───────────────────────────────────
insert into public.hobby_categories (id, name, description) values
  ('a1000000-0000-0000-0000-000000000001', 'Creative Arts',
   'Visual, written, digital, and expressive creative practices'),

  ('a1000000-0000-0000-0000-000000000002', 'Crafts',
   'Hands-on, tactile making and functional art'),

  ('a1000000-0000-0000-0000-000000000003', 'Gardening & Nature',
   'Plant-based, nature-connected, and slow creative practices');


-- ─── Hobbies ────────────────────────────────────────────
insert into public.hobbies
(slug, name, category_id, description, difficulty_level, time_commitment, cost_range, color, light_color)
values

-- ── Creative Arts ───────────────────────────────────────
('drawing', 'Drawing',
 'a1000000-0000-0000-0000-000000000001',
 'Sketching and drawing with pencil, pen, or charcoal',
 'beginner', 'quick', 'low', '#4A4A4A', '#E0E0E0'),

('watercolor', 'Watercolor Painting',
 'a1000000-0000-0000-0000-000000000001',
 'Expressive painting with water-based pigments',
 'beginner', 'moderate', 'low', '#60B5FF', '#AFDDFF'),

('acrylic-painting', 'Acrylic Painting',
 'a1000000-0000-0000-0000-000000000001',
 'Bold, fast-drying painting with acrylic paints',
 'beginner', 'moderate', 'low', '#FF6F61', '#FFD6D1'),

('gouache', 'Gouache Painting',
 'a1000000-0000-0000-0000-000000000001',
 'Opaque watercolor-style painting with vibrant color',
 'beginner', 'moderate', 'low', '#8E7CC3', '#E4DEF4'),

('calligraphy', 'Calligraphy',
 'a1000000-0000-0000-0000-000000000001',
 'The art of expressive and beautiful handwriting',
 'beginner', 'quick', 'low', '#5CC8D7', '#C8EFF4'),

('hand-lettering', 'Hand Lettering',
 'a1000000-0000-0000-0000-000000000001',
 'Illustrated lettering and typographic drawing',
 'beginner', 'quick', 'low', '#F28C28', '#FFE1BF'),

('digital-illustration', 'Digital Illustration',
 'a1000000-0000-0000-0000-000000000001',
 'Drawing and painting using digital tools and tablets',
 'beginner', 'moderate', 'low', '#6A5ACD', '#DAD6F5'),

('digital-collage', 'Digital Collage',
 'a1000000-0000-0000-0000-000000000001',
 'Creating compositions from images, textures, and text',
 'beginner', 'quick', 'low', '#3CB371', '#CFEFE0'),

('pixel-art', 'Pixel Art',
 'a1000000-0000-0000-0000-000000000001',
 'Designing images one pixel at a time',
 'beginner', 'quick', 'free', '#FFB347', '#FFE6C7'),

('zentangle', 'Zentangle',
 'a1000000-0000-0000-0000-000000000001',
 'Meditative pattern-based drawing',
 'beginner', 'quick', 'free', '#2F4F4F', '#D5E0E0'),

('mandala-art', 'Mandala Drawing',
 'a1000000-0000-0000-0000-000000000001',
 'Symmetrical, repetitive pattern drawing for focus and flow',
 'beginner', 'quick', 'free', '#B565A7', '#F0DCEF'),

('creative-writing', 'Creative Writing',
 'a1000000-0000-0000-0000-000000000001',
 'Writing short stories, scenes, or personal essays',
 'beginner', 'moderate', 'free', '#6B705C', '#E3E6DC'),

('journaling', 'Journaling',
 'a1000000-0000-0000-0000-000000000001',
 'Reflective and expressive personal writing practice',
 'beginner', 'quick', 'free', '#A5A58D', '#ECEDE4'),

('poetry', 'Poetry Writing',
 'a1000000-0000-0000-0000-000000000001',
 'Expressive writing through verse and imagery',
 'beginner', 'quick', 'free', '#9A031E', '#F5C6CE'),

('spoken-word', 'Spoken Word',
 'a1000000-0000-0000-0000-000000000001',
 'Voice-based poetic and expressive performance',
 'beginner', 'quick', 'free', '#3A0CA3', '#DAD2F5'),

('guitar', 'Guitar',
 'a1000000-0000-0000-0000-000000000001',
 'Playing acoustic or electric guitar',
 'beginner', 'moderate', 'medium', '#FF9149', '#FFECDB'),


-- ── Crafts ──────────────────────────────────────────────
('pottery', 'Pottery',
 'a1000000-0000-0000-0000-000000000002',
 'Hand-building functional and decorative objects with clay',
 'beginner', 'moderate', 'low', '#D4845A', '#F2DCCF'),

('ceramics', 'Ceramics (Hand-Building)',
 'a1000000-0000-0000-0000-000000000002',
 'Decorative and sculptural clay work without a wheel',
 'beginner', 'moderate', 'low', '#C26D4A', '#F1D5C8'),

('embroidery', 'Embroidery',
 'a1000000-0000-0000-0000-000000000002',
 'Decorating fabric with needle and thread',
 'beginner', 'quick', 'low', '#E87DA5', '#F9D6E3'),

('knitting', 'Knitting',
 'a1000000-0000-0000-0000-000000000002',
 'Creating fabric from yarn using needles',
 'beginner', 'moderate', 'low', '#B8A9E8', '#E8E2F7'),

('crochet', 'Crochet',
 'a1000000-0000-0000-0000-000000000002',
 'Looping yarn with a hook to create fabric',
 'beginner', 'moderate', 'low', '#7F7EFF', '#E2E1FF'),

('weaving', 'Weaving',
 'a1000000-0000-0000-0000-000000000002',
 'Creating fabric by interlacing threads',
 'beginner', 'moderate', 'low', '#C19A6B', '#EFE1CF'),

('sewing', 'Sewing',
 'a1000000-0000-0000-0000-000000000002',
 'Creating and repairing fabric items using hand or machine sewing',
 'beginner', 'moderate', 'low', '#C97C5D', '#F2D6C9'),

('beading', 'Beading',
 'a1000000-0000-0000-0000-000000000002',
 'Designing decorative items using beads, thread, or wire',
 'beginner', 'quick', 'low', '#9D4EDD', '#E9D9F7'),

('jewelry-making', 'Jewelry Making',
 'a1000000-0000-0000-0000-000000000002',
 'Designing wearable art using beads and wire',
 'beginner', 'quick', 'low', '#FFD166', '#FFF1C1'),

('paper-crafts', 'Paper Crafts',
 'a1000000-0000-0000-0000-000000000002',
 'Origami, collage, and paper-based making',
 'beginner', 'quick', 'free', '#F4A261', '#FFE3CF'),

('candle-making', 'Candle Making',
 'a1000000-0000-0000-0000-000000000002',
 'Crafting decorative and scented candles',
 'beginner', 'quick', 'low', '#FDC740', '#FEEDA8'),

('soap-making', 'Soap Making',
 'a1000000-0000-0000-0000-000000000002',
 'Creating handmade soaps using melt-and-pour methods',
 'beginner', 'quick', 'low', '#90DBF4', '#E6F7FD'),

('resin-art', 'Resin Art',
 'a1000000-0000-0000-0000-000000000002',
 'Creating glossy art objects using resin',
 'beginner', 'moderate', 'medium', '#6D597A', '#E6DBEB'),

('mini-woodworking', 'Mini Woodworking',
 'a1000000-0000-0000-0000-000000000002',
 'Small-scale woodworking and carving projects',
 'beginner', 'moderate', 'medium', '#8D6E63', '#E3D5CF'),

('leather-crafting', 'Leather Crafting',
 'a1000000-0000-0000-0000-000000000002',
 'Making small leather goods like keychains and bookmarks',
 'beginner', 'moderate', 'medium', '#A97142', '#E7D3C2'),


-- ── Gardening & Nature ──────────────────────────────────
('gardening', 'Gardening',
 'a1000000-0000-0000-0000-000000000003',
 'Growing plants, herbs, and flowers',
 'beginner', 'moderate', 'free', '#7BC47F', '#D4EFCF'),

('container-gardening', 'Container Gardening',
 'a1000000-0000-0000-0000-000000000003',
 'Growing plants in pots and small spaces',
 'beginner', 'moderate', 'low', '#4CAF50', '#DFF2E1'),

('herb-gardening', 'Herb Gardening',
 'a1000000-0000-0000-0000-000000000003',
 'Growing culinary and medicinal herbs',
 'beginner', 'moderate', 'low', '#6B8E23', '#E3EAD3'),

('indoor-plants', 'Indoor Plants',
 'a1000000-0000-0000-0000-000000000003',
 'Caring for and styling houseplants',
 'beginner', 'quick', 'low', '#2E8B57', '#D2EFE1'),

('terrariums', 'Terrarium Making',
 'a1000000-0000-0000-0000-000000000003',
 'Creating miniature plant ecosystems in glass containers',
 'beginner', 'moderate', 'low', '#3A5F0B', '#DCE9C8'),

('floral-arranging', 'Floral Arranging',
 'a1000000-0000-0000-0000-000000000003',
 'Designing floral compositions for beauty and expression',
 'beginner', 'quick', 'low', '#FF7F7F', '#FFD6D6'),

('nature-journaling', 'Nature Journaling',
 'a1000000-0000-0000-0000-000000000003',
 'Observing and recording nature through drawing and writing',
 'beginner', 'quick', 'free', '#556B2F', '#E1E8D5'),

('pressed-flower-art', 'Pressed Flower Art',
 'a1000000-0000-0000-0000-000000000003',
 'Creating artwork using pressed plants and flowers',
 'beginner', 'quick', 'free', '#B56576', '#F0DADF');


-- ─── Milestones ─────────────────────────────────────────
insert into public.milestones (slug, title, description, icon, criteria) values
  ('first-session',        'First Session',        'Completed your first practice session',  '🌟', '{"type":"session_count","threshold":1}'),
  ('week-warrior',         'Week Warrior',         '7-day practice streak',                  '🔥', '{"type":"streak","threshold":7}'),
  ('challenge-accepted',   'Challenge Accepted',   'Completed your first challenge',         '🎯', '{"type":"challenge_count","threshold":1}'),
  ('multi-creative',       'Multi-Creative',       'Explored 2 or more hobbies',             '🎨', '{"type":"hobby_count","threshold":2}'),
  ('month-master',         'Month Master',         '30-day practice streak',                 '💎', '{"type":"streak","threshold":30}'),
  ('challenge-champion',   'Challenge Champion',   'Completed 10 challenges',                '🏆', '{"type":"challenge_count","threshold":10}'),
  ('century-club',         'Century Club',         '100 practice sessions',                  '💯', '{"type":"session_count","threshold":100}'),
  ('early-riser',          'Early Riser',          '5 morning sessions before 9am',          '🌅', '{"type":"morning_sessions","threshold":5}');


-- ─── Sample Challenges (Pottery) ────────────────────────
insert into public.challenges (hobby_id, title, description, why_this_challenge, skills, difficulty, estimated_time, tips, what_youll_learn) values
  (
    (select id from public.hobbies where slug = 'pottery'),
    'Coil Bowl Challenge',
    'Build a bowl using only the coil technique. Make it at least 4 inches wide and try to get the walls as smooth as possible on the inside.',
    'You''ve mastered pinch pots. Coiling is the natural next step for building larger, more controlled forms.',
    array['Coil building', 'Smoothing', 'Form control'],
    'medium',
    '45–60 minutes',
    array['Roll coils to a consistent pencil-thickness before starting.', 'Score and slip each layer before adding the next coil.', 'Smooth the interior with a damp finger or rib tool after every 2–3 coils.'],
    array['Coil construction technique', 'Joining and smoothing clay surfaces', 'Building larger forms with control']
  ),
  (
    (select id from public.hobbies where slug = 'pottery'),
    'Texture Sampler Tile',
    'Roll out a flat slab of clay and divide it into 6 sections. Press a different texture into each section using only household objects. Label each one.',
    'Your coil work is getting great, but exploring texture will add a whole new dimension to your pieces.',
    array['Surface decoration', 'Slab technique', 'Creative observation'],
    'medium',
    '30–45 minutes',
    array['Try forks, keys, fabric, leaves, and bottle caps for textures.', 'Roll the slab to an even ¼ inch thickness first.', 'Press firmly but don''t go more than halfway through.'],
    array['How different objects create different effects in clay', 'Slab rolling and thickness control', 'Planning surface decoration before building']
  ),
  (
    (select id from public.hobbies where slug = 'pottery'),
    'Closed-Eyes Pinch Pot',
    'Make an entire pinch pot with your eyes closed. Focus completely on the feeling of the clay in your hands.',
    'Your pinch pots are getting precise. This will deepen your tactile sensitivity and help you "feel" the clay.',
    array['Tactile awareness', 'Muscle memory', 'Letting go of perfection'],
    'easy',
    '15–20 minutes',
    array['Start with a ball about the size of a tennis ball.', 'Focus on the thickness of the walls using only touch.', 'It''s okay if it''s lopsided — that''s the point!'],
    array['Heightened tactile sensitivity', 'Trusting your hands over your eyes', 'Embracing imperfection']
  );


-- ─── Sample Challenges (Watercolor) ─────────────────────
insert into public.challenges (hobby_id, title, description, why_this_challenge, skills, difficulty, estimated_time, tips, what_youll_learn) values
  (
    (select id from public.hobbies where slug = 'watercolor'),
    'Loose Florals',
    'Paint a bouquet of flowers using only loose, gestural brushstrokes. No pencil sketch first — go straight with the brush.',
    'Your technique is getting precise but a bit stiff. This will free up your brushwork.',
    array['Gestural painting', 'Brush control', 'Spontaneity'],
    'easy',
    '20–30 minutes',
    array['Use a big brush — it forces you to stay loose.', 'Don''t overthink. Move fast and let the paint bloom.', 'It''s supposed to look messy. That''s the style!'],
    array['Loose, gestural painting technique', 'Brush confidence and speed', 'Embracing controlled chaos']
  ),
  (
    (select id from public.hobbies where slug = 'watercolor'),
    'Three-Color Landscape',
    'Paint a landscape using only three colors: one warm, one cool, and one earth tone. Mix everything you need from these three.',
    'Your color work is getting bolder. Limiting your palette will teach you more about color mixing than any lesson.',
    array['Color theory', 'Color mixing', 'Composition'],
    'medium',
    '45–60 minutes',
    array['Good trio: ultramarine blue + burnt sienna + yellow ochre.', 'Make a small test grid of mixes before starting the painting.', 'You''ll be surprised how many colors three tubes can make!'],
    array['Color mixing fundamentals', 'Understanding warm and cool relationships', 'Painting with a limited palette']
  );
