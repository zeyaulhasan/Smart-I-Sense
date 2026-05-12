import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('smart_i_sense_profile');
    if (savedProfile) {
      try {
        return JSON.parse(savedProfile);
      } catch (e) {
        console.error("Failed to parse profile from local storage", e);
      }
    }
    return {
      name: 'Urban Supervisor',
      role: 'Primary Administrator',
      email: 'admin@smart-i-sense.com',
      phone: '+1 (555) 019-8472',
      facility: 'Cyber Tower #04 (Sector 7)',
      joined: 'October 24, 2023',
      status: 'Active / Cleared'
    };
  });

  useEffect(() => {
    localStorage.setItem('smart_i_sense_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  return (
    <UserContext.Provider value={{ userProfile, setUserProfile }}>
      {children}
    </UserContext.Provider>
  );
}
