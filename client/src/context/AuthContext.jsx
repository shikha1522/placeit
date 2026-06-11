import { createContext, useContext, useState } from 'react';
import axios from 'axios';

// creates a global context — any component can access this
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  // user stores logged in user info, token stores JWT
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  // localStorage keeps token even after page refresh

  // register function — calls our backend
  const register = async (formData) => {
    const res = await axios.post('http://localhost:5000/api/auth/register', formData);
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token); // save token to survive refresh
    return res.data;
  };

  // login function
  const login = async (formData) => {
    const res = await axios.post('http://localhost:5000/api/auth/login', formData);
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    return res.data;
  };

  // logout — clear everything
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook — any component just does: const { user, login } = useAuth()
export const useAuth = () => useContext(AuthContext);