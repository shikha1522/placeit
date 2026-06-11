// App.jsx — root component that sets up all routes for the app
// BrowserRouter gives us URL-based navigation
// Routes + Route map each URL path to a page component

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* redirect root "/" to "/login" by default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* /login → Login page */}
        <Route path="/login" element={<Login />} />

        {/* /register → Register page */}
        <Route path="/register" element={<Register />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;