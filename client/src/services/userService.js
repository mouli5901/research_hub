const USER_STORAGE_KEY = 'research_hub_user_profile';

const DEFAULT_AVATARS = [
  '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'
];

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // Ignore storage parse error
  }

  // Create default unique user for this browser session
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const randomColor = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
  const newUser = {
    id: 'u_' + Math.random().toString(36).substring(2, 9),
    name: `Researcher #${randomSuffix}`,
    role: 'Collaborator',
    avatarBg: randomColor
  };

  saveCurrentUser(newUser);
  return newUser;
}

export function saveCurrentUser(user) {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    // Ignore storage write error
  }
}
