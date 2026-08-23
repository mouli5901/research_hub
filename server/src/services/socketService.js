import { Server } from 'socket.io';

// Map of artifactId -> Map of socketId -> { socketId, user, status, lastSeenCommitId }
const roomUsers = new Map();

export function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    let currentArtifactId = null;

    socket.on('join_room', ({ artifactId, user, status = 'viewing', lastSeenCommitId }) => {
      if (!artifactId) return;

      // Leave previous room if any
      if (currentArtifactId && currentArtifactId !== artifactId) {
        socket.leave(`artifact:${currentArtifactId}`);
        removeUserFromRoom(currentArtifactId, socket.id, io);
      }

      currentArtifactId = artifactId;
      socket.join(`artifact:${artifactId}`);

      if (!roomUsers.has(artifactId)) {
        roomUsers.set(artifactId, new Map());
      }

      const usersMap = roomUsers.get(artifactId);
      usersMap.set(socket.id, {
        socketId: socket.id,
        user: user || { id: socket.id, name: 'Researcher', role: 'Collaborator' },
        status,
        lastSeenCommitId
      });

      broadcastPresence(artifactId, io);
    });

    socket.on('update_status', ({ artifactId, status, lastSeenCommitId }) => {
      const artId = artifactId || currentArtifactId;
      if (!artId || !roomUsers.has(artId)) return;

      const usersMap = roomUsers.get(artId);
      if (usersMap.has(socket.id)) {
        const entry = usersMap.get(socket.id);
        if (status) entry.status = status;
        if (lastSeenCommitId) entry.lastSeenCommitId = lastSeenCommitId;
        usersMap.set(socket.id, entry);
      }

      broadcastPresence(artId, io);
    });

    socket.on('leave_room', ({ artifactId }) => {
      const artId = artifactId || currentArtifactId;
      if (artId) {
        socket.leave(`artifact:${artId}`);
        removeUserFromRoom(artId, socket.id, io);
        currentArtifactId = null;
      }
    });

    socket.on('disconnect', () => {
      if (currentArtifactId) {
        removeUserFromRoom(currentArtifactId, socket.id, io);
      }
    });
  });

  return io;
}

function removeUserFromRoom(artifactId, socketId, io) {
  if (roomUsers.has(artifactId)) {
    const usersMap = roomUsers.get(artifactId);
    usersMap.delete(socketId);
    if (usersMap.size === 0) {
      roomUsers.delete(artifactId);
    } else {
      broadcastPresence(artifactId, io);
    }
  }
}

function broadcastPresence(artifactId, io) {
  if (roomUsers.has(artifactId)) {
    const usersList = Array.from(roomUsers.get(artifactId).values());
    io.to(`artifact:${artifactId}`).emit('presence_update', {
      artifactId,
      activeUsers: usersList
    });
  }
}

export function notifyNewCommit(io, artifactId, commitData) {
  if (io) {
    io.to(`artifact:${artifactId}`).emit('new_commit_available', commitData);
  }
}
