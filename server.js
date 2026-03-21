const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
