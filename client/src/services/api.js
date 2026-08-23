const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export async function fetchArtifacts() {
  const response = await fetch(`${API_BASE_URL}/api/artifacts`);
  if (!response.ok) {
    throw new Error(`Failed to fetch artifacts: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchArtifactDetails(artifactId) {
  const response = await fetch(`${API_BASE_URL}/api/artifacts/${artifactId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch artifact details: ${response.statusText}`);
  }
  return response.json();
}

export async function createArtifact(data) {
  const response = await fetch(`${API_BASE_URL}/api/artifacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create artifact: ${response.statusText}`);
  }
  return response.json();
}

export async function ingestArtifactAPI(data) {
  let options = {};
  if (data instanceof FormData) {
    options = {
      method: 'POST',
      body: data
    };
  } else {
    options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  }

  const response = await fetch(`${API_BASE_URL}/api/artifacts/ingest`, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to ingest artifact: ${response.statusText}`);
  }
  return response.json();
}

export async function searchArtifactsAPI(query, type = 'all') {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (type) params.append('type', type);

  const response = await fetch(`${API_BASE_URL}/api/artifacts/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to search artifacts: ${response.statusText}`);
  }
  return response.json();
}

export async function askAIAPI(question) {
  const response = await fetch(`${API_BASE_URL}/api/artifacts/ask-ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to process Q&A: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchCommits(artifactId, branch = '') {
  const url = branch 
    ? `${API_BASE_URL}/api/artifacts/${artifactId}/commits?branch=${encodeURIComponent(branch)}`
    : `${API_BASE_URL}/api/artifacts/${artifactId}/commits`;
    
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch commits: ${response.statusText}`);
  }
  return response.json();
}

export async function createCommit(artifactId, data) {
  const response = await fetch(`${API_BASE_URL}/api/artifacts/${artifactId}/commits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (response.status === 409) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.message || 'STALE_VERSION_CONFLICT');
    err.status = 409;
    err.code = 'STALE_VERSION_CONFLICT';
    err.details = errorData;
    throw err;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create commit: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchChangesSince(artifactId, { lastSeenCommit, branch } = {}) {
  const params = new URLSearchParams();
  if (lastSeenCommit) params.append('lastSeenCommit', lastSeenCommit);
  if (branch) params.append('branch', branch);

  const response = await fetch(`${API_BASE_URL}/api/artifacts/${artifactId}/changes-since?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch changes since: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchBranches(artifactId) {
  const response = await fetch(`${API_BASE_URL}/api/artifacts/${artifactId}/branches`);
  if (!response.ok) {
    throw new Error(`Failed to fetch branches: ${response.statusText}`);
  }
  return response.json();
}

export async function createBranch(artifactId, data) {
  const response = await fetch(`${API_BASE_URL}/api/artifacts/${artifactId}/branches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create branch: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDiff(artifactId, { baseCommit, compareCommit, baseBranch, compareBranch } = {}) {
  const queryParams = new URLSearchParams();
  if (baseCommit) queryParams.append('baseCommit', baseCommit);
  if (compareCommit) queryParams.append('compareCommit', compareCommit);
  if (baseBranch) queryParams.append('baseBranch', baseBranch);
  if (compareBranch) queryParams.append('compareBranch', compareBranch);

  const url = `${API_BASE_URL}/api/artifacts/${artifactId}/diff?${queryParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch semantic diff: ${response.statusText}`);
  }
  return response.json();
}

export async function mergeBranches(artifactId, data) {
  const response = await fetch(`${API_BASE_URL}/api/artifacts/${artifactId}/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to merge branches: ${response.statusText}`);
  }
  return response.json();
}
