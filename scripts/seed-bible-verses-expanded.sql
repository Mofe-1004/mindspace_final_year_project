-- Expanded Bible Verses Seed Data
-- Run this in Supabase SQL Editor to populate the bible_verses table
-- Total: 140+ verses across 7 sentiment categories

-- Clear existing verses (optional - uncomment if replacing)
-- DELETE FROM public.bible_verses;

-- ====================================================================================
-- CATEGORY: positive (for positive sentiments - joy, gratitude, hope)
-- ====================================================================================

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match, language)
VALUES
('Psalm 118:24', 'This is the day the Lord has made; let us rejoice and be glad in it.', 'positive', 'english'),
('Philippians 4:4', 'Rejoice in the Lord always. I will say it again: Rejoice!', 'positive', 'english'),
('Psalm 16:11', 'You make known to me the path of life; you will fill me with joy in your presence, with eternal pleasures at your right hand.', 'positive', 'english'),
('Nehemiah 8:10', 'Do not grieve, for the joy of the Lord is your strength.', 'positive', 'english'),
('Psalm 30:11', 'You turned my wailing into dancing; you removed my sackcloth and clothed me with joy.', 'positive', 'english'),
('Psalm 126:3', 'The Lord has done great things for us, and we are filled with joy.', 'positive', 'english'),
('Romans 15:13', 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.', 'positive', 'english'),
('Psalm 100:1-2', 'Shout for joy to the Lord, all the earth. Worship the Lord with gladness; come before him with joyful songs.', 'positive', 'english'),
('1 Thessalonians 5:16-18', 'Rejoice always, pray continually, give thanks in all circumstances; for this is God''s will for you in Christ Jesus.', 'positive', 'english'),
('Psalm 9:1-2', 'I will give thanks to you, Lord, with all my heart; I will tell of all your wonderful deeds. I will be glad and rejoice in you.', 'positive', 'english'),
('James 1:17', 'Every good and perfect gift is from above, coming down from the Father of the heavenly lights.', 'positive', 'english'),
('Psalm 34:8', 'Taste and see that the Lord is good; blessed is the one who takes refuge in him.', 'positive', 'english'),
('Colossians 3:15', 'Let the peace of Christ rule in your hearts, since as members of one body you were called to peace. And be thankful.', 'positive', 'english'),
('Psalm 107:1', 'Give thanks to the Lord, for he is good; his love endures forever.', 'positive', 'english'),
('Ecclesiastes 3:12-13', 'I know that there is nothing better for people than to be happy and to do good while they live. That each of them may eat and drink, and find satisfaction in all their toil—this is the gift of God.', 'positive', 'english'),
('Psalm 68:3', 'But may the righteous be glad and rejoice before God; may they be happy and joyful.', 'positive', 'english'),
('Isaiah 12:2', 'Surely God is my salvation; I will trust and not be afraid. The Lord, the Lord himself, is my strength and my defense; he has become my salvation.', 'positive', 'english'),
('Zephaniah 3:17', 'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.', 'positive', 'english'),
('Psalm 37:4', 'Take delight in the Lord, and he will give you the desires of your heart.', 'positive', 'english'),
('Habakkuk 3:18', 'Yet I will rejoice in the Lord, I will be joyful in God my Savior.', 'positive', 'english')
ON CONFLICT DO NOTHING;

-- ====================================================================================
-- CATEGORY: negative_anxious (for anxiety, worry, stress, fear)
-- ====================================================================================

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match, language)
VALUES
('Philippians 4:6-7', 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', 'negative_anxious', 'english'),
('Matthew 11:28', 'Come to me, all you who are weary and burdened, and I will give you rest.', 'negative_anxious', 'english'),
('1 Peter 5:7', 'Cast all your anxiety on him because he cares for you.', 'negative_anxious', 'english'),
('Isaiah 41:10', 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', 'negative_anxious', 'english'),
('Psalm 55:22', 'Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.', 'negative_anxious', 'english'),
('Matthew 6:34', 'Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.', 'negative_anxious', 'english'),
('Psalm 94:19', 'When anxiety was great within me, your consolation brought me joy.', 'negative_anxious', 'english'),
('John 14:27', 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.', 'negative_anxious', 'english'),
('2 Timothy 1:7', 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', 'negative_anxious', 'english'),
('Psalm 27:1', 'The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?', 'negative_anxious', 'english'),
('Isaiah 26:3', 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.', 'negative_anxious', 'english'),
('Psalm 56:3', 'When I am afraid, I put my trust in you.', 'negative_anxious', 'english'),
('Matthew 6:25-26', 'Therefore I tell you, do not worry about your life, what you will eat or drink; or about your body, what you will wear. Look at the birds of the air; they do not sow or reap or store away in barns, and yet your heavenly Father feeds them. Are you not much more valuable than they?', 'negative_anxious', 'english'),
('Psalm 23:4', 'Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.', 'negative_anxious', 'english'),
('Deuteronomy 31:6', 'Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you.', 'negative_anxious', 'english'),
('Proverbs 12:25', 'Anxiety weighs down the heart, but a kind word cheers it up.', 'negative_anxious', 'english'),
('Romans 8:31', 'If God is for us, who can be against us?', 'negative_anxious', 'english'),
('Psalm 46:10', 'Be still, and know that I am God.', 'negative_anxious', 'english'),
('Joshua 1:9', 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', 'negative_anxious', 'english'),
('Hebrews 13:6', 'So we say with confidence, "The Lord is my helper; I will not be afraid. What can mere mortals do to me?"', 'negative_anxious', 'english')
ON CONFLICT DO NOTHING;

-- ====================================================================================
-- CATEGORY: negative_sad (for sadness, grief, loss, loneliness)
-- ====================================================================================

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match, language)
VALUES
('Psalm 34:18', 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', 'negative_sad', 'english'),
('2 Corinthians 1:3-4', 'Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles.', 'negative_sad', 'english'),
('Revelation 21:4', 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.', 'negative_sad', 'english'),
('Psalm 147:3', 'He heals the brokenhearted and binds up their wounds.', 'negative_sad', 'english'),
('Matthew 5:4', 'Blessed are those who mourn, for they will be comforted.', 'negative_sad', 'english'),
('Psalm 42:11', 'Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God, for I will yet praise him, my Savior and my God.', 'negative_sad', 'english'),
('Isaiah 49:13', 'Shout for joy, you heavens; rejoice, you earth; burst into song, you mountains! For the Lord comforts his people and will have compassion on his afflicted ones.', 'negative_sad', 'english'),
('Psalm 30:5', 'Weeping may stay for the night, but rejoicing comes in the morning.', 'negative_sad', 'english'),
('Romans 8:18', 'I consider that our present sufferings are not worth comparing with the glory that will be revealed in us.', 'negative_sad', 'english'),
('Psalm 73:26', 'My flesh and my heart may fail, but God is the strength of my heart and my portion forever.', 'negative_sad', 'english'),
('John 16:33', 'I have told you these things, so that in me you may have peace. In this world you will have trouble. But take heart! I have overcome the world.', 'negative_sad', 'english'),
('Isaiah 43:2', 'When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you.', 'negative_sad', 'english'),
('Lamentations 3:22-23', 'Because of the Lord''s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.', 'negative_sad', 'english'),
('Psalm 31:24', 'Be strong and take heart, all you who hope in the Lord.', 'negative_sad', 'english'),
('Isaiah 54:10', 'Though the mountains be shaken and the hills be removed, yet my unfailing love for you will not be shaken nor my covenant of peace be removed.', 'negative_sad', 'english'),
('Psalm 46:1', 'God is our refuge and strength, an ever-present help in trouble.', 'negative_sad', 'english'),
('2 Corinthians 4:17', 'For our light and momentary troubles are achieving for us an eternal glory that far outweighs them all.', 'negative_sad', 'english'),
('Romans 8:28', 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', 'negative_sad', 'english'),
('Psalm 116:1-2', 'I love the Lord, for he heard my voice; he heard my cry for mercy. Because he turned his ear to me, I will call on him as long as I live.', 'negative_sad', 'english'),
('Isaiah 40:31', 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', 'negative_sad', 'english')
ON CONFLICT DO NOTHING;

-- ====================================================================================
-- CATEGORY: negative_angry (for anger, frustration, annoyance — patience, endurance & comfort)
-- Mix of: patience/endurance verses, God's justice verses, and a few gentle forgiveness verses.
-- Avoids: corrective "stop being angry" verses, guilt-tripping, or calling the student a sinner.
-- ====================================================================================

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match, language)
VALUES
-- Patience & endurance (for institutional/situational frustration)
('James 1:2-4', 'Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance. Let perseverance finish its work so that you may be mature and complete, not lacking anything.', 'negative_angry', 'english'),
('Romans 12:12', 'Be joyful in hope, patient in affliction, faithful in prayer.', 'negative_angry', 'english'),
('Psalm 37:7', 'Be still before the Lord and wait patiently for him; do not fret when people succeed in their ways, when they carry out their wicked schemes.', 'negative_angry', 'english'),
('Psalm 62:5-6', 'Yes, my soul, find rest in God; my hope comes from him. Truly he is my rock and my salvation; he is my fortress, I will not be shaken.', 'negative_angry', 'english'),
('Hebrews 10:36', 'You need to persevere so that when you have done the will of God, you will receive what he has promised.', 'negative_angry', 'english'),
('Galatians 6:9', 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.', 'negative_angry', 'english'),
('Isaiah 40:31', 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', 'negative_angry', 'english'),
('Psalm 27:14', 'Wait for the Lord; be strong and take heart and wait for the Lord.', 'negative_angry', 'english'),
('Lamentations 3:25-26', 'The Lord is good to those whose hope is in him, to the one who seeks him; it is good to wait quietly for the salvation of the Lord.', 'negative_angry', 'english'),
-- God's justice & vindication (for when others treat you unfairly)
('Romans 12:19', 'Do not take revenge, my dear friends, but leave room for God''s wrath, for it is written: "It is mine to avenge; I will repay," says the Lord.', 'negative_angry', 'english'),
('Psalm 37:5-6', 'Commit your way to the Lord; trust in him and he will do this: He will make your righteous reward shine like the dawn, your vindication like the noonday sun.', 'negative_angry', 'english'),
('Isaiah 30:18', 'Yet the Lord longs to be gracious to you; therefore he will rise up to show you compassion. For the Lord is a God of justice. Blessed are all who wait for him!', 'negative_angry', 'english'),
('Psalm 9:9', 'The Lord is a refuge for the oppressed, a stronghold in times of trouble.', 'negative_angry', 'english'),
('Nahum 1:7', 'The Lord is good, a refuge in times of trouble. He cares for those who trust in him.', 'negative_angry', 'english'),
-- Gentle relationship/forgiveness verses (for personal conflict — not preachy)
('Colossians 3:13', 'Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.', 'negative_angry', 'english'),
('1 Peter 3:9', 'Do not repay evil with evil or insult with insult. On the contrary, repay evil with blessing, because to this you were called so that you may inherit a blessing.', 'negative_angry', 'english'),
('Romans 12:17-18', 'Do not repay anyone evil for evil. Be careful to do what is right in the eyes of everyone. If it is possible, as far as it depends on you, live at peace with everyone.', 'negative_angry', 'english'),
-- Peace & comfort (calming without lecturing)
('Proverbs 19:11', 'A person''s wisdom yields patience; it is to one''s glory to overlook an offense.', 'negative_angry', 'english'),
('Romans 12:21', 'Do not be overcome by evil, but overcome evil with good.', 'negative_angry', 'english'),
('Philippians 4:6-7', 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', 'negative_angry', 'english'),
('John 14:27', 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.', 'negative_angry', 'english'),
('Psalm 55:22', 'Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.', 'negative_angry', 'english'),
('2 Thessalonians 3:16', 'Now may the Lord of peace himself give you peace at all times and in every way. The Lord be with all of you.', 'negative_angry', 'english')
ON CONFLICT DO NOTHING;

-- ====================================================================================
-- CATEGORY: negative_struggle (addiction, abuse, bondage — freedom & deliverance)
-- ====================================================================================

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match, language)
VALUES
('John 8:36', 'So if the Son sets you free, you will be free indeed.', 'negative_struggle', 'english'),
('2 Corinthians 12:9', 'But he said to me, "My grace is sufficient for you, for my power is made perfect in weakness." Therefore I will boast all the more gladly about my weaknesses, so that Christ''s power may rest on me.', 'negative_struggle', 'english'),
('Isaiah 61:1', 'The Spirit of the Sovereign Lord is on me, because the Lord has anointed me to proclaim good news to the poor. He has sent me to bind up the brokenhearted, to proclaim freedom for the captives and release from darkness for the prisoners.', 'negative_struggle', 'english'),
('Galatians 5:1', 'It is for freedom that Christ has set us free. Stand firm, then, and do not let yourselves be burdened again by a yoke of slavery.', 'negative_struggle', 'english'),
('Psalm 107:13-14', 'Then they cried to the Lord in their trouble, and he saved them from their distress. He brought them out of darkness, the utter darkness, and broke away their chains.', 'negative_struggle', 'english'),
('Romans 6:14', 'For sin shall no longer be your master, because you are not under the law, but under grace.', 'negative_struggle', 'english'),
('1 Corinthians 10:13', 'No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear. But when you are tempted, he will also provide a way out so that you can endure it.', 'negative_struggle', 'english'),
('Philippians 4:13', 'I can do all this through him who gives me strength.', 'negative_struggle', 'english'),
('Psalm 34:17', 'The righteous cry out, and the Lord hears them; he delivers them from all their troubles.', 'negative_struggle', 'english'),
('Isaiah 40:29', 'He gives strength to the weary and increases the power of the weak.', 'negative_struggle', 'english'),
('Psalm 40:2', 'He lifted me out of the slimy pit, out of the mud and mire; he set my feet on a rock and gave me a firm place to stand.', 'negative_struggle', 'english'),
('2 Timothy 1:7', 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', 'negative_struggle', 'english'),
('Romans 8:37', 'No, in all these things we are more than conquerors through him who loved us.', 'negative_struggle', 'english'),
('Psalm 18:6', 'In my distress I called to the Lord; I cried to my God for help. From his temple he heard my voice; my cry came before him, into his ears.', 'negative_struggle', 'english'),
('James 4:7', 'Submit yourselves, then, to God. Resist the devil, and he will flee from you.', 'negative_struggle', 'english'),
('Psalm 46:1', 'God is our refuge and strength, an ever-present help in trouble.', 'negative_struggle', 'english'),
('Jeremiah 17:14', 'Heal me, Lord, and I will be healed; save me and I will be saved, for you are the one I praise.', 'negative_struggle', 'english'),
('Psalm 55:22', 'Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.', 'negative_struggle', 'english'),
('Lamentations 3:25-26', 'The Lord is good to those whose hope is in him, to the one who seeks him; it is good to wait quietly for the salvation of the Lord.', 'negative_struggle', 'english'),
('Nahum 1:7', 'The Lord is good, a refuge in times of trouble. He cares for those who trust in him.', 'negative_struggle', 'english')
ON CONFLICT DO NOTHING;

-- ====================================================================================
-- CATEGORY: neutral_encouragement (general encouragement, motivation)
-- ====================================================================================

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match, language)
VALUES
('Proverbs 3:5-6', 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', 'neutral_encouragement', 'english'),
('Jeremiah 29:11', 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', 'neutral_encouragement', 'english'),
('Philippians 4:13', 'I can do all this through him who gives me strength.', 'neutral_encouragement', 'english'),
('Proverbs 16:3', 'Commit to the Lord whatever you do, and he will establish your plans.', 'neutral_encouragement', 'english'),
('Psalm 37:5', 'Commit your way to the Lord; trust in him and he will do this.', 'neutral_encouragement', 'english'),
('Colossians 3:23', 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.', 'neutral_encouragement', 'english'),
('Proverbs 16:9', 'In their hearts humans plan their course, but the Lord establishes their steps.', 'neutral_encouragement', 'english'),
('Isaiah 40:29', 'He gives strength to the weary and increases the power of the weak.', 'neutral_encouragement', 'english'),
('Psalm 32:8', 'I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you.', 'neutral_encouragement', 'english'),
('Philippians 1:6', 'Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus.', 'neutral_encouragement', 'english'),
('Proverbs 4:23', 'Above all else, guard your heart, for everything you do flows from it.', 'neutral_encouragement', 'english'),
('Galatians 6:9', 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.', 'neutral_encouragement', 'english'),
('Psalm 119:105', 'Your word is a lamp for my feet, a light on my path.', 'neutral_encouragement', 'english'),
('Romans 12:2', 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind.', 'neutral_encouragement', 'english'),
('Proverbs 19:21', 'Many are the plans in a person''s heart, but it is the Lord''s purpose that prevails.', 'neutral_encouragement', 'english'),
('Ecclesiastes 3:1', 'There is a time for everything, and a season for every activity under the heavens.', 'neutral_encouragement', 'english'),
('Psalm 90:12', 'Teach us to number our days, that we may gain a heart of wisdom.', 'neutral_encouragement', 'english'),
('Hebrews 12:1', 'Let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us.', 'neutral_encouragement', 'english'),
('James 1:5', 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.', 'neutral_encouragement', 'english'),
('Micah 6:8', 'He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.', 'neutral_encouragement', 'english')
ON CONFLICT DO NOTHING;

-- ====================================================================================
-- CATEGORY: at_risk (for high-risk situations - crisis support, comfort)
-- ====================================================================================

INSERT INTO public.bible_verses (verse_reference, verse_text, sentiment_match, language)
VALUES
('Psalm 46:1-2', 'God is our refuge and strength, an ever-present help in trouble. Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea.', 'at_risk', 'english'),
('Isaiah 41:10', 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', 'at_risk', 'english'),
('Psalm 23:1-4', 'The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul. Even though I walk through the darkest valley, I will fear no evil, for you are with me.', 'at_risk', 'english'),
('Deuteronomy 31:8', 'The Lord himself goes before you and will be with you; he will never leave you nor forsake you. Do not be afraid; do not be discouraged.', 'at_risk', 'english'),
('Romans 8:38-39', 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.', 'at_risk', 'english'),
('Psalm 34:17-18', 'The righteous cry out, and the Lord hears them; he delivers them from all their troubles. The Lord is close to the brokenhearted and saves those who are crushed in spirit.', 'at_risk', 'english'),
('Matthew 28:20', 'And surely I am with you always, to the very end of the age.', 'at_risk', 'english'),
('Isaiah 43:1', 'Do not fear, for I have redeemed you; I have summoned you by name; you are mine.', 'at_risk', 'english'),
('Psalm 91:1-2', 'Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty. I will say of the Lord, "He is my refuge and my fortress, my God, in whom I trust."', 'at_risk', 'english'),
('2 Corinthians 12:9', 'But he said to me, "My grace is sufficient for you, for my power is made perfect in weakness."', 'at_risk', 'english'),
('Psalm 139:7-10', 'Where can I go from your Spirit? Where can I flee from your presence? If I go up to the heavens, you are there; if I make my bed in the depths, you are there. If I rise on the wings of the dawn, if I settle on the far side of the sea, even there your hand will guide me, your right hand will hold me fast.', 'at_risk', 'english'),
('Psalm 121:1-2', 'I lift up my eyes to the mountains—where does my help come from? My help comes from the Lord, the Maker of heaven and earth.', 'at_risk', 'english'),
('Jeremiah 29:11', 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', 'at_risk', 'english'),
('Isaiah 40:29-31', 'He gives strength to the weary and increases the power of the weak. Even youths grow tired and weary, and young men stumble and fall; but those who hope in the Lord will renew their strength.', 'at_risk', 'english'),
('Psalm 27:13-14', 'I remain confident of this: I will see the goodness of the Lord in the land of the living. Wait for the Lord; be strong and take heart and wait for the Lord.', 'at_risk', 'english'),
('Nahum 1:7', 'The Lord is good, a refuge in times of trouble. He cares for those who trust in him.', 'at_risk', 'english'),
('John 10:10', 'The thief comes only to steal and kill and destroy; I have come that they may have life, and have it to the full.', 'at_risk', 'english'),
('Psalm 18:2', 'The Lord is my rock, my fortress and my deliverer; my God is my rock, in whom I take refuge, my shield and the horn of my salvation, my stronghold.', 'at_risk', 'english'),
('Romans 15:13', 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.', 'at_risk', 'english'),
('Psalm 62:1-2', 'Truly my soul finds rest in God; my salvation comes from him. Truly he is my rock and my salvation; he is my fortress, I will never be shaken.', 'at_risk', 'english')
ON CONFLICT DO NOTHING;
