/**
 * Rule-based multi-label category classifier covering all 28 TechPulse categories.
 * Returns an array of category slugs.
 */

export const CATEGORY_RULES = [
  {
    slug: 'artificial-intelligence',
    name: 'Artificial Intelligence',
    keywords: [
      'artificial intelligence', 'generative ai', 'ai model', 'ai system', 'deepmind',
      'openai', 'anthropic', 'gemini', 'claude', 'gpt-4', 'gpt-5', 'copilot', 'ai safety',
      'neural network', 'multimodal', 'foundation model', 'reasoning model',
    ],
  },
  {
    slug: 'machine-learning',
    name: 'Machine Learning',
    keywords: [
      'machine learning', 'deep learning', 'pytorch', 'tensorflow', 'hugging face',
      'fine-tuning', 'fine tuning', 'reinforcement learning', 'diffusion model', 'transformer',
      'training run', 'benchmark', 'weights', 'inference', 'quantization', 'mlops',
    ],
  },
  {
    slug: 'large-language-models',
    name: 'Large Language Models',
    keywords: [
      'llm', 'large language model', 'language model', 'chatgpt', 'claude', 'llama',
      'mistral', 'deepseek', 'qwen', 'gemini', 'context window', 'token', 'prompt engineering',
      'rag', 'retrieval-augmented', 'gpt-',
    ],
  },
  {
    slug: 'ai-agents',
    name: 'AI Agents',
    keywords: [
      'ai agent', 'agentic', 'autonomous agent', 'multi-agent', 'mcp', 'model context protocol',
      'tool use', 'coding agent', 'computer use', 'workflow agent',
    ],
  },
  {
    slug: 'web-development',
    name: 'Web Development',
    keywords: [
      'web development', 'frontend', 'html', 'css', 'tailwind', 'vite', 'webpack',
      'next.js', 'nextjs', 'remix', 'astro', 'svelte', 'browser', 'webassembly', 'wasm',
      'webgpu', 'pwa', 'service worker', 'http/3', 'dom',
    ],
  },
  {
    slug: 'programming',
    name: 'Programming',
    keywords: [
      'programming', 'software engineering', 'compiler', 'rust', 'golang', 'go ', 'c++',
      'typescript', 'algorithm', 'data structure', 'codebase', 'refactor', 'debugging',
      'programming language', 'sdk', 'api', 'developer',
    ],
  },
  {
    slug: 'javascript',
    name: 'JavaScript',
    keywords: [
      'javascript', 'ecmascript', 'typescript', 'v8 engine', 'bun', 'deno', 'npm', 'pnpm', 'es202',
    ],
  },
  {
    slug: 'react',
    name: 'React',
    keywords: [
      'react', 'react 19', 'react native', 'jsx', 'next.js', 'tanstack', 'redux', 'server components',
    ],
  },
  {
    slug: 'nodejs',
    name: 'Node.js',
    keywords: [
      'node.js', 'nodejs', 'express.js', 'fastify', 'nestjs', 'libuv', 'npm package',
    ],
  },
  {
    slug: 'python',
    name: 'Python',
    keywords: [
      'python', 'django', 'fastapi', 'flask', 'pypi', 'cpython', 'ruff', 'uv ', 'pandas', 'numpy',
    ],
  },
  {
    slug: 'startups',
    name: 'Startups',
    keywords: [
      'startup', 'series a', 'series b', 'series c', 'seed round', 'venture capital',
      'y combinator', 'founder', 'valuation', 'raises $', 'funding round', 'acquisition', 'ipo',
    ],
  },
  {
    slug: 'big-tech',
    name: 'Big Tech',
    keywords: [
      'apple', 'google', 'microsoft', 'meta', 'amazon', 'alphabet', 'tesla', 'antitrust',
      'earnings', 'big tech', 'silicon valley', 'tim cook', 'satya nadella', 'sundar pichai',
    ],
  },
  {
    slug: 'cybersecurity',
    name: 'Cybersecurity',
    keywords: [
      'cybersecurity', 'vulnerability', 'cve-', 'zero-day', 'zero day', 'ransomware',
      'malware', 'data breach', 'phishing', 'exploit', 'encryption', 'ddos', 'infosec',
      'security flaw', 'patch', 'botnet', 'passkey', 'backdoor',
    ],
  },
  {
    slug: 'cloud-computing',
    name: 'Cloud Computing',
    keywords: [
      'aws', 'amazon web services', 'azure', 'google cloud', 'gcp', 'cloudflare',
      'serverless', 'cloud computing', 's3', 'lambda', 'edge compute', 'multi-cloud', 'data center',
    ],
  },
  {
    slug: 'devops',
    name: 'DevOps',
    keywords: [
      'devops', 'kubernetes', 'k8s', 'docker', 'container', 'terraform', 'ci/cd',
      'github actions', 'observability', 'prometheus', 'grafana', 'sre', 'infrastructure as code',
      'helm', 'deployment',
    ],
  },
  {
    slug: 'open-source',
    name: 'Open Source',
    keywords: [
      'open source', 'open-source', 'foss', 'linux', 'kernel', 'mit license', 'apache license',
      'gpl', 'gnu', 'mozilla', 'firefox', 'ubuntu', 'debian', 'fedora', 'maintainer',
    ],
  },
  {
    slug: 'github-projects',
    name: 'GitHub Projects',
    keywords: [
      'github', 'repository', 'pull request', 'open-sourced on github', 'github copilot',
      'git ', 'release v', 'changelog',
    ],
  },
  {
    slug: 'hardware',
    name: 'Hardware',
    keywords: [
      'hardware', 'gpu', 'cpu', 'laptop', 'desktop', 'motherboard', 'ram', 'ssd',
      'pcie', 'workstation', 'server rack', 'macbook', 'thinkpad', 'arm64', 'risc-v',
    ],
  },
  {
    slug: 'semiconductors',
    name: 'Semiconductors',
    keywords: [
      'semiconductor', 'chip', 'tsmc', 'nvidia', 'amd', 'intel', 'qualcomm', 'broadcom',
      'asml', 'lithography', '2nm', '3nm', 'wafer', 'silicon', 'blackwell', 'h100', 'b200', 'npu',
    ],
  },
  {
    slug: 'robotics',
    name: 'Robotics',
    keywords: [
      'robot', 'robotics', 'humanoid', 'boston dynamics', 'figure ai', 'drone', 'autonomous vehicle',
      'waymo', 'lidar', 'actuator', 'embodied ai',
    ],
  },
  {
    slug: 'space-technology',
    name: 'Space Technology',
    keywords: [
      'space', 'nasa', 'spacex', 'starship', 'falcon 9', 'rocket', 'satellite', 'orbit',
      'starlink', 'mars', 'lunar', 'moon', 'esa', 'isro', 'telescope', 'jwst', 'astronaut',
    ],
  },
  {
    slug: 'science',
    name: 'Science',
    keywords: [
      'science', 'physics', 'quantum computing', 'qubit', 'fusion', 'biotech', 'crispr',
      'climate', 'battery', 'solid-state', 'neuroscience', 'breakthrough', 'discovery', 'study finds',
    ],
  },
  {
    slug: 'gaming',
    name: 'Gaming',
    keywords: [
      'gaming', 'video game', 'steam', 'playstation', 'xbox', 'nintendo', 'switch',
      'unreal engine', 'unity', 'esports', 'rtx', 'dlss', 'frame rate', 'valve', 'steam deck',
    ],
  },
  {
    slug: 'gadgets',
    name: 'Gadgets',
    keywords: [
      'gadget', 'wearable', 'smartwatch', 'earbuds', 'headset', 'vr', 'ar glasses',
      'vision pro', 'camera', 'smart home', 'hands-on', 'review:',
    ],
  },
  {
    slug: 'mobile-technology',
    name: 'Mobile Technology',
    keywords: [
      'android', 'ios', 'iphone', 'pixel', 'samsung galaxy', 'smartphone', 'mobile app',
      'kotlin', 'swift', '5g', 'play store', 'app store', 'snapdragon',
    ],
  },
  {
    slug: 'databases',
    name: 'Databases',
    keywords: [
      'database', 'postgres', 'postgresql', 'supabase', 'mysql', 'sqlite', 'redis',
      'mongodb', 'clickhouse', 'duckdb', 'vector database', 'pgvector', 'sql', 'nosql',
    ],
  },
  {
    slug: 'developer-tools',
    name: 'Developer Tools',
    keywords: [
      'developer tool', 'devtools', 'ide', 'vs code', 'vscode', 'cursor', 'neovim',
      'cli', 'terminal', 'debugger', 'profiler', 'linter', 'testing framework', 'vitest', 'playwright',
    ],
  },
  {
    slug: 'research-papers',
    name: 'Research Papers',
    keywords: [
      'arxiv', 'research paper', 'preprint', 'whitepaper', 'technical report', 'peer-reviewed',
      'neurips', 'icml', 'iclr', 'cvpr', 'acl ', 'ablation study', 'state-of-the-art',
    ],
  },
];

const SOURCE_CATEGORY_TO_SLUG = new Map(
  CATEGORY_RULES.map((c) => [c.name.toLowerCase(), c.slug])
);

/**
 * Classifies an article into one or more of the 28 category slugs.
 */
export function classifyArticle({ title = '', description = '', sourceCategory = '', rawCategories = [] }) {
  const haystack = ` ${title} ${description} ${rawCategories.join(' ')} `.toLowerCase();
  const matched = new Set();

  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (haystack.includes(kw)) {
        matched.add(rule.slug);
        break;
      }
    }
  }

  // Fallback or supplement with source default category
  const defaultSlug = SOURCE_CATEGORY_TO_SLUG.get((sourceCategory || '').toLowerCase());
  if (matched.size === 0 && defaultSlug) {
    matched.add(defaultSlug);
  } else if (defaultSlug && matched.size < 3) {
    // Only add source default if article is from a specialized domain feed
    const specializedDefaults = new Set([
      'research-papers',
      'cybersecurity',
      'space-technology',
      'gaming',
      'mobile-technology',
    ]);
    if (specializedDefaults.has(defaultSlug)) {
      matched.add(defaultSlug);
    }
  }

  if (matched.size === 0) {
    matched.add('programming');
  }

  return Array.from(matched).slice(0, 5);
}
