-- TechPulse Seed Data: 28 Tech Categories & Verified Official RSS/Atom Sources
-- Migration: 20261117000003_seed_categories_and_sources.sql

-- ============================================================
-- 1. SEED 28 NEWS CATEGORIES
-- ============================================================
INSERT INTO public.categories (name, slug, group_name) VALUES
  ('Artificial Intelligence', 'artificial-intelligence', 'AI & Machine Learning'),
  ('Machine Learning', 'machine-learning', 'AI & Machine Learning'),
  ('Large Language Models', 'large-language-models', 'AI & Machine Learning'),
  ('AI Agents', 'ai-agents', 'AI & Machine Learning'),
  ('Web Development', 'web-development', 'Programming'),
  ('Programming', 'programming', 'Programming'),
  ('JavaScript', 'javascript', 'Programming'),
  ('React', 'react', 'Programming'),
  ('Node.js', 'nodejs', 'Programming'),
  ('Python', 'python', 'Programming'),
  ('Startups', 'startups', 'Startups'),
  ('Big Tech', 'big-tech', 'Startups'),
  ('Cybersecurity', 'cybersecurity', 'Cybersecurity'),
  ('Cloud Computing', 'cloud-computing', 'Cloud & DevOps'),
  ('DevOps', 'devops', 'Cloud & DevOps'),
  ('Open Source', 'open-source', 'Open Source'),
  ('GitHub Projects', 'github-projects', 'Open Source'),
  ('Hardware', 'hardware', 'Hardware'),
  ('Semiconductors', 'semiconductors', 'Hardware'),
  ('Robotics', 'robotics', 'Hardware'),
  ('Space Technology', 'space-technology', 'Science & Space'),
  ('Science', 'science', 'Science & Space'),
  ('Gaming', 'gaming', 'Gaming'),
  ('Gadgets', 'gadgets', 'Hardware'),
  ('Mobile Technology', 'mobile-technology', 'Hardware'),
  ('Databases', 'databases', 'Cloud & DevOps'),
  ('Developer Tools', 'developer-tools', 'Programming'),
  ('Research Papers', 'research-papers', 'AI & Machine Learning')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. SEED OFFICIAL RSS / ATOM SOURCES
-- Note: Sources can be toggled or edited directly in the database.
-- ============================================================
INSERT INTO public.sources (name, feed_url, website_url, favicon_url, category, reliability_score, enabled) VALUES
  ('Hacker News', 'https://hnrss.org/frontpage', 'https://news.ycombinator.com', 'https://news.ycombinator.com/favicon.ico', 'Programming', 88, TRUE),
  ('TechCrunch', 'https://techcrunch.com/feed/', 'https://techcrunch.com', 'https://techcrunch.com/favicon.ico', 'Startups', 84, TRUE),
  ('The Verge', 'https://www.theverge.com/rss/index.xml', 'https://www.theverge.com', 'https://www.theverge.com/favicon.ico', 'Big Tech', 84, TRUE),
  ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'https://arstechnica.com', 'https://arstechnica.com/favicon.ico', 'Science', 90, TRUE),
  ('MIT Technology Review', 'https://www.technologyreview.com/feed/', 'https://www.technologyreview.com', 'https://www.technologyreview.com/favicon.ico', 'Artificial Intelligence', 92, TRUE),
  ('Google AI Blog', 'https://blog.google/technology/ai/rss/', 'https://blog.google/technology/ai/', 'https://blog.google/favicon.ico', 'Artificial Intelligence', 95, TRUE),
  ('OpenAI News', 'https://openai.com/news/rss.xml', 'https://openai.com/news/', 'https://openai.com/favicon.ico', 'Large Language Models', 95, TRUE),
  ('Anthropic News', 'https://raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml', 'https://www.anthropic.com/news', 'https://www.anthropic.com/favicon.ico', 'Large Language Models', 92, TRUE),
  ('Microsoft DevBlogs', 'https://devblogs.microsoft.com/feed/', 'https://devblogs.microsoft.com', 'https://devblogs.microsoft.com/favicon.ico', 'Developer Tools', 90, TRUE),
  ('GitHub Blog', 'https://github.blog/feed/', 'https://github.blog', 'https://github.githubassets.com/favicons/favicon.svg', 'Open Source', 92, TRUE),
  ('Cloudflare Blog', 'https://blog.cloudflare.com/rss/', 'https://blog.cloudflare.com', 'https://blog.cloudflare.com/favicon.ico', 'Cybersecurity', 94, TRUE),
  ('Mozilla Blog', 'https://blog.mozilla.org/en/feed/', 'https://blog.mozilla.org', 'https://www.mozilla.org/favicon.ico', 'Open Source', 88, TRUE),
  ('AWS News Blog', 'https://aws.amazon.com/blogs/aws/feed/', 'https://aws.amazon.com/blogs/aws/', 'https://aws.amazon.com/favicon.ico', 'Cloud Computing', 93, TRUE),
  ('NVIDIA Blog', 'https://blogs.nvidia.com/feed/', 'https://blogs.nvidia.com', 'https://blogs.nvidia.com/favicon.ico', 'Hardware', 92, TRUE),
  ('Android Developers Blog', 'https://android-developers.googleblog.com/feeds/posts/default', 'https://android-developers.googleblog.com', 'https://developer.android.com/favicon.ico', 'Mobile Technology', 91, TRUE),
  ('Apple Newsroom', 'https://www.apple.com/newsroom/rss-feed.rss', 'https://www.apple.com/newsroom/', 'https://www.apple.com/favicon.ico', 'Big Tech', 94, TRUE),
  ('WIRED', 'https://www.wired.com/feed/rss', 'https://www.wired.com', 'https://www.wired.com/favicon.ico', 'Science', 85, TRUE),
  ('VentureBeat', 'https://venturebeat.com/feed/', 'https://venturebeat.com', 'https://venturebeat.com/favicon.ico', 'Artificial Intelligence', 82, TRUE),
  ('Hugging Face Blog', 'https://huggingface.co/blog/feed.xml', 'https://huggingface.co/blog', 'https://huggingface.co/favicon.ico', 'Machine Learning', 93, TRUE),
  ('LWN.net (Linux & Open Source)', 'https://lwn.net/headlines/rss', 'https://lwn.net', 'https://lwn.net/favicon.ico', 'Open Source', 92, TRUE),
  ('Phoronix (Linux & Hardware)', 'https://www.phoronix.com/rss.php', 'https://www.phoronix.com', 'https://www.phoronix.com/favicon.ico', 'Hardware', 85, TRUE),
  ('The Hacker News (Security)', 'https://feeds.feedburner.com/TheHackersNews', 'https://thehackernews.com', 'https://thehackernews.com/favicon.ico', 'Cybersecurity', 88, TRUE),
  ('Space.com', 'https://www.space.com/feeds/all', 'https://www.space.com', 'https://www.space.com/favicon.ico', 'Space Technology', 84, TRUE),
  ('PC Gamer', 'https://www.pcgamer.com/rss/', 'https://www.pcgamer.com', 'https://www.pcgamer.com/favicon.ico', 'Gaming', 82, TRUE),
  ('arXiv CS.AI', 'https://rss.arxiv.org/rss/cs.AI', 'https://arxiv.org/list/cs.AI/recent', 'https://arxiv.org/favicon.ico', 'Research Papers', 90, TRUE)
ON CONFLICT (feed_url) DO NOTHING;
