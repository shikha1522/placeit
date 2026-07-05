// AuthContext.jsx — global auth state for entire app

import { createContext, useContext, useState, useEffect } from 'react'; // added useEffect
import axios from 'axios';

// creates a global context — any component can access this
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  // user stores logged in user info, token stores JWT
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  // localStorage keeps token even after page refresh

  // ── Restore user on page refresh ──────────────────────────
  // when app loads, if token exists fetch fresh user data from backend
  useEffect(() => {
    const restoreUser = async () => {
      const savedToken = localStorage.getItem('token'); // get saved token
      if (!savedToken) return;                          // no token = not logged in

      try {
        // fetch profile using saved token to restore user state
        const res = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${savedToken}` }, // send token
        });
        setUser(res.data.user);                         // restore user in state
        setToken(savedToken);                           // restore token in state
      } catch (err) {
        // token expired or invalid — clear everything
        console.error('Token restore failed:', err);
        localStorage.removeItem('token');               // remove bad token
        setToken(null);                                 // clear token state
        setUser(null);                                  // clear user state
      }
    };

    restoreUser();                                      // call on mount
  }, []);                                               // run once on app load

  // ── Register ───────────────────────────────────────────────
  const register = async (formData) => {
    const res = await axios.post('http://localhost:5000/api/auth/register', formData);
    setUser(res.data.user);                             // save user in state
    setToken(res.data.token);                           // save token in state
    localStorage.setItem('token', res.data.token);     // save token to survive refresh
    return res.data;
  };

  // ── Login ──────────────────────────────────────────────────
  const login = async (formData) => {
    const res = await axios.post('http://localhost:5000/api/auth/login', formData);
    setUser(res.data.user);                             // save user in state
    setToken(res.data.token);                           // save token in state
    localStorage.setItem('token', res.data.token);     // persist token
    return res.data;
  };

  // ── Logout ─────────────────────────────────────────────────
  const logout = () => {
    setUser(null);                                      // clear user
    setToken(null);                                     // clear token
    localStorage.removeItem('token');                   // remove from storage
  };

  return (
    // added setUser to value — profile page needs it to update global user
    <AuthContext.Provider value={{ user, setUser, token, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook — any component just does: const { user, login } = useAuth()
export const useAuth = () => useContext(AuthContext);