-- Bible Verses Seed File
-- 50 carefully selected verses for emotional support
-- Run this after the initial schema.sql to populate bible_verses table
--
-- Categories:
-- - positive: Celebration, joy, gratitude
-- - negative_anxious: Worry, stress, fear, anxiety
-- - negative_sad: Sadness, grief, disappointment, loss
-- - neutral_encouragement: General wisdom, daily strength
-- - at_risk: Crisis support, hope in darkness, life affirmation

-- Clear existing verses to avoid duplicates (optional - comment out if you want to append)
-- TRUNCATE TABLE public.bible_verses;

-- ============================================================================
-- POSITIVE (10 verses) - For joy, celebration, gratitude
-- ============================================================================

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match, language) VALUES
('Psalm 118:24', 'This is the day the Lord has made; let us rejoice and be glad in it.', 'positive', 'english'),
('Philippians 4:4', 'Rejoice in the Lord always. I will say it again: Rejoice!', 'positive', 'english'),
('Psalm 16:11', 'You make known to me the path of life; you will fill me with joy in your presence, with eternal pleasures at your right hand.', 'positive', 'english'),
('James 1:17', 'Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.', 'positive', 'english'),
('Psalm 126:3', 'The Lord has done great things for us, and we are filled with joy.', 'positive', 'english'),
('Nehemiah 8:10', 'Do not grieve, for the joy of the Lord is your strength.', 'positive', 'english'),
('Psalm 30:11', 'You turned my wailing into dancing; you removed my sackcloth and clothed me with joy.', 'positive', 'english'),
('Romans 15:13', 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.', 'positive', 'english'),
('Psalm 107:1', 'Give thanks to the Lord, for he is good; his love endures forever.', 'positive', 'english'),
('1 Thessalonians 5:16-18', 'Rejoice always, pray continually, give thanks in all circumstances; for this is God''s will for you in Christ Jesus.', 'positive', 'english')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NEGATIVE_ANXIOUS (10 verses) - For worry, stress, fear, anxiety
-- ============================================================================

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match, language) VALUES
('Philippians 4:6-7', 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', 'negative_anxious', 'english'),
('Matthew 11:28', 'Come to me, all you who are weary and burdened, and I will give you rest.', 'negative_anxious', 'english'),
('Psalm 46:1', 'God is our refuge and strength, an ever-present help in trouble.', 'negative_anxious', 'english'),
('1 Peter 5:7', 'Cast all your anxiety on him because he cares for you.', 'negative_anxious', 'english'),
('Isaiah 26:3', 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.', 'negative_anxious', 'english'),
('Psalm 94:19', 'When anxiety was great within me, your consolation brought me joy.', 'negative_anxious', 'english'),
('Matthew 6:34', 'Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.', 'negative_anxious', 'english'),
('John 14:27', 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.', 'negative_anxious', 'english'),
('Psalm 55:22', 'Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.', 'negative_anxious', 'english'),
('2 Timothy 1:7', 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', 'negative_anxious', 'english')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NEGATIVE_SAD (10 verses) - For sadness, grief, disappointment, loss
-- ============================================================================

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match, language) VALUES
('Psalm 34:18', 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', 'negative_sad', 'english'),
('2 Corinthians 1:3-4', 'Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles.', 'negative_sad', 'english'),
('Revelation 21:4', 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.', 'negative_sad', 'english'),
('Psalm 147:3', 'He heals the brokenhearted and binds up their wounds.', 'negative_sad', 'english'),
('Matthew 5:4', 'Blessed are those who mourn, for they will be comforted.', 'negative_sad', 'english'),
('Psalm 30:5', 'Weeping may stay for the night, but rejoicing comes in the morning.', 'negative_sad', 'english'),
('Romans 8:18', 'I consider that our present sufferings are not worth comparing with the glory that will be revealed in us.', 'negative_sad', 'english'),
('Psalm 73:26', 'My flesh and my heart may fail, but God is the strength of my heart and my portion forever.', 'negative_sad', 'english'),
('John 16:33', 'I have told you these things, so that in me you may have peace. In this world you will have trouble. But take heart! I have overcome the world.', 'negative_sad', 'english'),
('Lamentations 3:22-23', 'Because of the Lord''s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.', 'negative_sad', 'english')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NEUTRAL_ENCOURAGEMENT (10 verses) - For general wisdom, daily strength
-- ============================================================================

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match, language) VALUES
('Proverbs 3:5-6', 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', 'neutral_encouragement', 'english'),
('Romans 8:28', 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', 'neutral_encouragement', 'english'),
('Jeremiah 29:11', 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', 'neutral_encouragement', 'english'),
('Isaiah 40:31', 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', 'neutral_encouragement', 'english'),
('Joshua 1:9', 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', 'neutral_encouragement', 'english'),
('Psalm 37:4', 'Take delight in the Lord, and he will give you the desires of your heart.', 'neutral_encouragement', 'english'),
('Philippians 4:13', 'I can do all this through him who gives me strength.', 'neutral_encouragement', 'english'),
('Psalm 23:1-3', 'The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.', 'neutral_encouragement', 'english'),
('Proverbs 16:3', 'Commit to the Lord whatever you do, and he will establish your plans.', 'neutral_encouragement', 'english'),
('Ecclesiastes 3:1', 'There is a time for everything, and a season for every activity under the heavens.', 'neutral_encouragement', 'english')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- AT_RISK (10 verses) - For crisis support, hope in darkness, life affirmation
-- These verses emphasize God's presence, protection, and the value of life
-- ============================================================================

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match, language) VALUES
('Isaiah 41:10', 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', 'at_risk', 'english'),
('Psalm 139:13-14', 'For you created my inmost being; you knit me together in my mother''s womb. I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.', 'at_risk', 'english'),
('Deuteronomy 31:8', 'The Lord himself goes before you and will be with you; he will never leave you nor forsake you. Do not be afraid; do not be discouraged.', 'at_risk', 'english'),
('Psalm 27:1', 'The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?', 'at_risk', 'english'),
('Romans 8:38-39', 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.', 'at_risk', 'english'),
('Psalm 91:1-2', 'Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty. I will say of the Lord, "He is my refuge and my fortress, my God, in whom I trust."', 'at_risk', 'english'),
('Isaiah 43:1-2', 'Do not fear, for I have redeemed you; I have summoned you by name; you are mine. When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you.', 'at_risk', 'english'),
('Psalm 121:1-2', 'I lift up my eyes to the mountains—where does my help come from? My help comes from the Lord, the Maker of heaven and earth.', 'at_risk', 'english'),
('Jeremiah 31:3', 'The Lord appeared to us in the past, saying: I have loved you with an everlasting love; I have drawn you with unfailing kindness.', 'at_risk', 'english'),
('Zephaniah 3:17', 'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.', 'at_risk', 'english')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY
-- Run this to verify the seed was successful
-- ============================================================================

-- SELECT sentiment_match, COUNT(*) as count
-- FROM public.bible_verses
-- GROUP BY sentiment_match
-- ORDER BY sentiment_match;

-- Expected output:
-- at_risk              | 10
-- negative_anxious     | 10
-- negative_sad         | 10
-- neutral_encouragement| 10
-- positive             | 10
