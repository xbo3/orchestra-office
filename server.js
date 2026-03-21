const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== 프로젝트 레지스트리 =====
const PROJECTS = [
  { name: 'BiPayments', repo: 'xbo3/bipayments', domain: 'bipayments.eu', badge: 'live', railway: 'fabulous-light' },
  { name: 'DR.SLOT Frontend', repo: 'xbo3/slotsite', domain: 'slotsite-frontend-production.up.railway.app', badge: 'dev', railway: 'steadfast-warmth' },
  { name: 'JARVIS2', repo: 'xbo3/jarvis2', domain: 'jarvis2-production-7be9.up.railway.app', badge: 'live', railway: 'jarvis2' },
  { name: 'Orchestra', repo: 'xbo3/orchestra-office', domain: 'imaginative-sparkle-production.up.railway.app', badge: 'dev', railway: 'imaginative-sparkle' }
];

// GitHub API 캐시 (rate limit 절약)
const ghCache = { projects: null, projectsAt: 0, structures: {} };
const CACHE_TTL = 5 * 60 * 1000; // 5분

async function ghFetch(url) {
  const res = await fetch('https://api.github.com' + url, {
    headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'WooOrchestra' }
  });
  if (!res.ok) throw new Error('GitHub API ' + res.status);
  return res.json();
}

// GET /api/projects — 모든 프로젝트 정보 + 최근 커밋
app.get('/api/projects', async (req, res) => {
  try {
    const now = Date.now();
    if (ghCache.projects && (now - ghCache.projectsAt) < CACHE_TTL) {
      return res.json({ projects: ghCache.projects });
    }

    const projects = await Promise.all(PROJECTS.map(async (p) => {
      try {
        const [repo, commits] = await Promise.all([
          ghFetch('/repos/' + p.repo),
          ghFetch('/repos/' + p.repo + '/commits?per_page=1')
        ]);
        const lastCommit = Array.isArray(commits) && commits.length > 0 ? {
          sha: commits[0].sha.substring(0, 7),
          message: commits[0].commit.message.substring(0, 80),
          author: commits[0].commit.author.name,
          date: commits[0].commit.author.date
        } : null;
        return {
          name: p.name,
          repo: p.repo,
          railway: p.railway,
          domain: p.domain,
          badge: p.badge,
          description: repo.description || '',
          language: repo.language || 'Unknown',
          size: repo.size,
          lastCommit
        };
      } catch (e) {
        return { name: p.name, repo: p.repo, railway: p.railway, domain: p.domain, badge: p.badge, error: e.message };
      }
    }));

    ghCache.projects = projects;
    ghCache.projectsAt = now;
    res.json({ projects });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/projects/:owner/:repo/structure — 파일 트리
app.get('/api/projects/:owner/:repo/structure', async (req, res) => {
  const repoKey = req.params.owner + '/' + req.params.repo;
  try {
    const now = Date.now();
    if (ghCache.structures[repoKey] && (now - ghCache.structures[repoKey].at) < CACHE_TTL) {
      return res.json(ghCache.structures[repoKey].data);
    }

    // 기본 브랜치 조회
    const repoInfo = await ghFetch('/repos/' + repoKey);
    const defaultBranch = repoInfo.default_branch || 'main';
    const tree = await ghFetch('/repos/' + repoKey + '/git/trees/' + defaultBranch + '?recursive=true');

    if (!tree.tree) throw new Error('트리 없음');

    // .js, .ts, .jsx, .tsx, .py, .json, .css, .html 필터 + 폴더별 그룹핑
    const codeExts = ['.js','.ts','.jsx','.tsx','.py','.json','.css','.html','.md','.sql','.prisma','.yml','.yaml'];
    const folders = {};
    let totalFiles = 0;

    tree.tree.forEach(function(item) {
      if (item.type !== 'blob') return;
      const ext = item.path.lastIndexOf('.') >= 0 ? item.path.substring(item.path.lastIndexOf('.')) : '';
      if (!codeExts.includes(ext)) return;

      totalFiles++;
      const parts = item.path.split('/');
      const fileName = parts.pop();
      const folderPath = parts.length > 0 ? parts.join('/') : '(root)';

      if (!folders[folderPath]) folders[folderPath] = [];
      folders[folderPath].push({ name: fileName, path: item.path, ext: ext, size: item.size || 0 });
    });

    // 폴더 정렬
    const sortedFolders = Object.keys(folders).sort().map(function(f) {
      return { folder: f, files: folders[f].sort(function(a,b){ return a.name.localeCompare(b.name); }) };
    });

    const result = { repo: repoKey, totalFiles: totalFiles, truncated: tree.truncated || false, folders: sortedFolders };
    ghCache.structures[repoKey] = { data: result, at: now };
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== 실시간 상태 저장소 =====
const state = {
  agents: {
    ceo: { id: 'ceo', name: 'CEO 팀장', status: 'idle', task: '', color: '#6c5ce7' },
    fe:  { id: 'fe',  name: '프론트엔드', status: 'idle', task: '', color: '#14b8a6' },
    be:  { id: 'be',  name: '백엔드', status: 'idle', task: '', color: '#3b82f6' },
    pe:  { id: 'pe',  name: '프롬프트', status: 'idle', task: '', color: '#ec4899' },
    ds:  { id: 'ds',  name: '디자이너', status: 'idle', task: '', color: '#f59e0b' },
    qa:  { id: 'qa',  name: '테스터', status: 'idle', task: '', color: '#10b981' },
    dv:  { id: 'dv',  name: '배포담당', status: 'idle', task: '', color: '#64748b' }
  },
  currentProject: null,
  currentTask: null,
  logs: [],
  completedTasks: 0,
  startTime: Date.now()
};

// SSE 클라이언트 목록
const sseClients = [];

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => res.write(msg));
}

function addLog(agentId, message) {
  const agent = state.agents[agentId] || { name: 'SYS', color: '#10b981' };
  const entry = {
    time: new Date().toISOString(),
    agent: agentId,
    agentName: agent.name,
    agentColor: agent.color,
    message
  };
  state.logs.unshift(entry);
  if (state.logs.length > 100) state.logs.pop();
  broadcast('log', entry);
}

// ===== SSE 스트림 =====
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  // 초기 상태 전송
  res.write(`event: init\ndata: ${JSON.stringify(state)}\n\n`);
  sseClients.push(res);
  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx >= 0) sseClients.splice(idx, 1);
  });
});

// ===== 상태 수신 API (클로드 코드에서 호출) =====

// 에이전트 상태 업데이트
app.post('/api/agent/status', (req, res) => {
  const { agentId, status, task } = req.body;
  if (!state.agents[agentId]) return res.status(400).json({ error: 'Unknown agent' });
  state.agents[agentId].status = status || 'idle';
  state.agents[agentId].task = task || '';
  broadcast('agent', state.agents[agentId]);
  addLog(agentId, task || (status === 'idle' ? '작업 완료' : '작업 시작'));
  res.json({ ok: true });
});

// 프로젝트/태스크 시작
app.post('/api/task/start', (req, res) => {
  const { project, task, steps } = req.body;
  state.currentProject = project;
  state.currentTask = { task, steps: steps || [], currentStep: 0, startTime: Date.now() };
  broadcast('task', { type: 'start', project, task, steps });
  addLog('ceo', `태스크 시작: "${task}" (${project})`);
  res.json({ ok: true });
});

// 태스크 스텝 진행
app.post('/api/task/step', (req, res) => {
  const { stepIndex, agentId, description } = req.body;
  if (state.currentTask) {
    state.currentTask.currentStep = stepIndex;
  }
  broadcast('task', { type: 'step', stepIndex, agentId, description });
  if (agentId) addLog(agentId, description || '작업 중');
  res.json({ ok: true });
});

// 태스크 완료
app.post('/api/task/complete', (req, res) => {
  state.completedTasks++;
  const task = state.currentTask?.task || '태스크';
  state.currentProject = null;
  state.currentTask = null;
  // 모든 에이전트 idle로
  Object.values(state.agents).forEach(a => { a.status = 'idle'; a.task = ''; });
  broadcast('task', { type: 'complete', completedTasks: state.completedTasks });
  broadcast('agents', state.agents);
  addLog('ceo', `태스크 #${state.completedTasks} 완료: "${task}"`);
  res.json({ ok: true, completedTasks: state.completedTasks });
});

// 로그 추가
app.post('/api/log', (req, res) => {
  const { agentId, message } = req.body;
  addLog(agentId || 'ceo', message);
  res.json({ ok: true });
});

// 전체 상태 조회
app.get('/api/status', (req, res) => {
  res.json({
    office: 'WOO ORCHESTRA',
    agents: state.agents,
    currentProject: state.currentProject,
    currentTask: state.currentTask,
    completedTasks: state.completedTasks,
    logs: state.logs.slice(0, 30),
    uptime: Math.floor((Date.now() - state.startTime) / 1000),
    sseClients: sseClients.length
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log('[ORCHESTRA] Live on port ' + PORT));
