const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = `${API_URL}/api`;

async function request(path, options = {}) {
  const { headers: customHeaders, ...rest } = options;
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...rest,
    headers: { 'Content-Type': 'application/json', ...customHeaders },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

export function getMe() {
  return request('/auth/me');
}

export function getTeams() {
  return request('/teams');
}

export function createTeam(data) {
  return request('/teams', { method: 'POST', body: JSON.stringify(data) });
}

export function updateTeam(id, data) {
  return request(`/teams/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function addMember(teamId, userId, roleInTeam) {
  return request(`/teams/${teamId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId, roleInTeam }),
  });
}

export function removeMember(teamId, userId) {
  return request(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
}

export function getTeamProjects(teamId) {
  return request(`/teams/${teamId}/projects`);
}

export function createProject(teamId, data) {
  return request(`/teams/${teamId}/projects`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateProject(id, data) {
  return request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function getProject(id) {
  return request(`/projects/${id}`);
}

export function getProjectTasks(projectId) {
  return request(`/projects/${projectId}/tasks`);
}

export function createTask(projectId, data) {
  return request(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateTask(id, data) {
  return request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}

export function uploadDocument(taskId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${API_URL}/api/tasks/${taskId}/documents`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  }).then(async (res) => {
    if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
    return res.json();
  });
}

export function getProjectDocuments(projectId, taskId) {
  const params = taskId ? `?taskId=${taskId}` : '';
  return request(`/projects/${projectId}/documents${params}`);
}

export function getTeamLogs(teamId) {
  return request(`/teams/${teamId}/logs`);
}

export function createLog(teamId, data) {
  return request(`/teams/${teamId}/logs`, { method: 'POST', body: JSON.stringify(data) });
}

export function submitClosure(projectId, data) {
  return request(`/projects/${projectId}/closure`, { method: 'POST', body: JSON.stringify(data) });
}

export function getClosure(projectId) {
  return request(`/projects/${projectId}/closure`);
}

export function reopenProject(projectId) {
  return request(`/projects/${projectId}/closure/reopen`, { method: 'PATCH' });
}

export function verifyTask(taskId, result, comment) {
  return request(`/tasks/${taskId}/verify`, { method: 'POST', body: JSON.stringify({ result, comment }) });
}

export function getVerificationLogs(params) {
  const qs = new URLSearchParams(params).toString();
  return request(`/verification-logs?${qs}`);
}

export function getPDODashboard() {
  return request('/dashboard/pdo');
}

export function registerUser(name, email, password) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export function getUsers() {
  return request('/auth/users');
}

export function getTaskComments(taskId) {
  return request(`/tasks/${taskId}/comments`);
}

export function addTaskComment(taskId, content) {
  return request(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
}

export function getProjectBudgets(projectId) {
  return request(`/projects/${projectId}/budgets`);
}

export function createBudget(projectId, data) {
  return request(`/projects/${projectId}/budgets`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateBudget(id, data) {
  return request(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function getProjectBeneficiaries(projectId) {
  return request(`/projects/${projectId}/beneficiaries`);
}

export function createBeneficiary(projectId, data) {
  return request(`/projects/${projectId}/beneficiaries`, { method: 'POST', body: JSON.stringify(data) });
}

export function getAlerts() {
  return request('/alerts');
}

export function getUnreadCount() {
  return request('/alerts/unread-count');
}

export function markAlertRead(id) {
  return request(`/alerts/${id}/read`, { method: 'PATCH' });
}

export function markAllAlertsRead() {
  return request('/alerts/read-all', { method: 'PATCH' });
}

export function generateAlerts() {
  return request('/alerts/generate', { method: 'POST' });
}

export function getCalendar(from, to) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return request(`/calendar?${params.toString()}`);
}

export function getProjectReport(projectId) {
  return request(`/projects/${projectId}/report`);
}

export function getTeamLabels(teamId) {
  return request(`/teams/${teamId}/labels`);
}

export function createTeamLabel(teamId, data) {
  return request(`/teams/${teamId}/labels`, { method: 'POST', body: JSON.stringify(data) });
}

export function deleteLabel(id) {
  return request(`/labels/${id}`, { method: 'DELETE' });
}

export function getProjectTaskLabels(projectId) {
  return request(`/projects/${projectId}/task-labels`);
}

export function getTaskLabels(taskId) {
  return request(`/tasks/${taskId}/labels`);
}

export function addTaskLabel(taskId, labelId) {
  return request(`/tasks/${taskId}/labels`, { method: 'POST', body: JSON.stringify({ labelId }) });
}

export function removeTaskLabel(taskId, labelId) {
  return request(`/tasks/${taskId}/labels/${labelId}`, { method: 'DELETE' });
}

export function getProjectViews(projectId) {
  return request(`/projects/${projectId}/views`);
}

export function createProjectView(projectId, data) {
  return request(`/projects/${projectId}/views`, { method: 'POST', body: JSON.stringify(data) });
}

export function deleteView(id) {
  return request(`/views/${id}`, { method: 'DELETE' });
}

export function getComplianceForms() {
  return request('/compliance/forms');
}

export function createComplianceForm(data) {
  return request('/compliance/forms', { method: 'POST', body: JSON.stringify(data) });
}

export function getComplianceSubmissions(params) {
  const qs = new URLSearchParams(params).toString();
  return request(`/compliance/submissions?${qs}`);
}

export function createComplianceSubmission(data) {
  return request('/compliance/submissions', { method: 'POST', body: JSON.stringify(data) });
}

export function updateComplianceSubmission(id, data) {
  return request(`/compliance/submissions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function saveSchoolFormData(data) {
  return request('/compliance/form-data', { method: 'POST', body: JSON.stringify(data) });
}

export function getSchoolFormData(params) {
  const qs = new URLSearchParams(params).toString();
  return request(`/compliance/form-data?${qs}`);
}

export function getSipGoals(params) {
  const qs = new URLSearchParams(params).toString();
  return request(`/sip/goals?${qs}`);
}

export function createSipGoal(data) {
  return request('/sip/goals', { method: 'POST', body: JSON.stringify(data) });
}

export function getSipGoal(id) {
  return request(`/sip/goals/${id}`);
}

export function updateSipGoal(id, data) {
  return request(`/sip/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteSipGoal(id) {
  return request(`/sip/goals/${id}`, { method: 'DELETE' });
}

export function createSipActivity(data) {
  return request('/sip/activities', { method: 'POST', body: JSON.stringify(data) });
}

export function updateSipActivity(id, data) {
  return request(`/sip/activities/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function createSipBudgetLine(data) {
  return request('/sip/budget-lines', { method: 'POST', body: JSON.stringify(data) });
}

export function updateSipBudgetLine(id, data) {
  return request(`/sip/budget-lines/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function getPhysicalFinancial(params) {
  const qs = new URLSearchParams(params).toString();
  return request(`/sip/physical-financial?${qs}`);
}

export function savePhysicalFinancial(data) {
  return request('/sip/physical-financial', { method: 'POST', body: JSON.stringify(data) });
}

export function getSipSummary(params) {
  const qs = new URLSearchParams(params).toString();
  return request(`/sip/summary?${qs}`);
}

export function getStakeholders(params) {
  const qs = new URLSearchParams(params).toString();
  return request(`/stakeholders?${qs}`);
}

export function createStakeholder(data) {
  return request('/stakeholders', { method: 'POST', body: JSON.stringify(data) });
}

export function updateStakeholder(id, data) {
  return request(`/stakeholders/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteStakeholder(id) {
  return request(`/stakeholders/${id}`, { method: 'DELETE' });
}

export function getEngagementLogs(params) {
  const qs = new URLSearchParams(params).toString();
  return request(`/engagement-logs?${qs}`);
}

export function createEngagementLog(data) {
  return request('/engagement-logs', { method: 'POST', body: JSON.stringify(data) });
}

export function getCorrespondence(params) {
  const qs = new URLSearchParams(params).toString();
  return request(`/correspondence?${qs}`);
}

export function createCorrespondence(data) {
  return request('/correspondence', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCorrespondence(id, data) {
  return request(`/correspondence/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteCorrespondence(id) {
  return request(`/correspondence/${id}`, { method: 'DELETE' });
}
