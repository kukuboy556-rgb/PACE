import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as apiLogin, logout as apiLogout } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data.user);
      setTeams(data.teams);
    } catch {
      setUser(null);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    setTeams(data.teams);
    return data;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
    } finally {
      setUser(null);
      setTeams([]);
    }
  };

  const isPDO = user?.isPDO ?? false;
  const isCoordinator = teams.length > 0 && !isPDO;
  const isSchoolHead = !isPDO && !isCoordinator;

  return (
    <AuthContext.Provider value={{ user, teams, loading, login, logout, refresh, isPDO, isCoordinator, isSchoolHead }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
