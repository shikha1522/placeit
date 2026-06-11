// authMiddleware.js
// Middleware is a function that runs BEFORE your route handler
// This one checks if the request has a valid JWT token
// We'll use this in Phase 4+ to protect routes like /dashboard

import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
  // Step 1: get the token from the request headers
  // Frontend will send: Authorization: Bearer eyJhbGci...
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, access denied' });
  }

  // Step 2: extract just the token part (remove "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // Step 3: verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // if token is fake or expired, this throws an error

    // Step 4: attach the user info to the request so next route can use it
    req.user = decoded; // { id, role }

    next(); // move on to the actual route handler
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default protect;