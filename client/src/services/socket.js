import { io } from 'socket.io-client';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD) {
    return ''; // empty string connects socket.io to current window host origin
  }
  return 'http://127.0.0.1:5000';
};

const API_BASE_URL = getApiBaseUrl();

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: true,
      withCredentials: true
    });
  }
  return socket;
}

export function joinArtifactRoom(artifactId, user, status = 'viewing', lastSeenCommitId = '') {
  const s = getSocket();
  if (s && artifactId) {
    s.emit('join_room', { artifactId, user, status, lastSeenCommitId });
  }
}

export function updatePresenceStatus(artifactId, status, lastSeenCommitId = '') {
  const s = getSocket();
  if (s && artifactId) {
    s.emit('update_status', { artifactId, status, lastSeenCommitId });
  }
}

export function leaveArtifactRoom(artifactId) {
  const s = getSocket();
  if (s && artifactId) {
    s.emit('leave_room', { artifactId });
  }
}

export function subscribeToPresence(callback) {
  const s = getSocket();
  if (!s) return () => {};

  const handler = (data) => {
    if (callback) callback(data);
  };

  s.on('presence_update', handler);
  return () => {
    s.off('presence_update', handler);
  };
}

export function subscribeToNewCommits(callback) {
  const s = getSocket();
  if (!s) return () => {};

  const handler = (data) => {
    if (callback) callback(data);
  };

  s.on('new_commit_available', handler);
  return () => {
    s.off('new_commit_available', handler);
  };
}
