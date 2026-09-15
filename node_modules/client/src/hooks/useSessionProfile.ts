import { useState, useEffect } from 'react';

export interface SessionProfile {
  nickname: string;
  avatarSeed: string;
}

const ADJECTIVES = ['Happy', 'Pixel', 'Turbo', 'Blue', 'Cosmic', 'Neon', 'Sneaky', 'Brave', 'Wild', 'Epic'];
const NOUNS = ['Fox', 'Wolf', 'Cat', 'Dragon', 'Panda', 'Tiger', 'Bear', 'Falcon', 'Shark', 'Rex'];

function generateNickname() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}${noun}`;
}

function generateAvatarSeed() {
  return Math.random().toString(36).substring(2, 8);
}

export function useSessionProfile() {
  const [profile, setProfile] = useState<SessionProfile>(() => {
    const saved = localStorage.getItem('gamehub_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      nickname: generateNickname(),
      avatarSeed: generateAvatarSeed(),
    };
  });

  useEffect(() => {
    localStorage.setItem('gamehub_profile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates: Partial<SessionProfile>) => {
    setProfile(p => ({ ...p, ...updates }));
  };

  return { profile, updateProfile };
}
