const { getAuth } = require('@clerk/nextjs/server');
const fs = require('fs');
const path = require('path');

async function verifySession(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return null;

    const usersPath = path.join(process.cwd(), 'data', 'db', 'users.json');
    if (!fs.existsSync(usersPath)) return null;

    const fileData = fs.readFileSync(usersPath, 'utf8');
    if (!fileData) return null;
    
    const users = JSON.parse(fileData);
    const user = users.find(u => u.clerkId === userId);
    
    return user || null;
  } catch (err) {
    console.error("Clerk auth error in verifySession:", err);
    return null;
  }
}

// Stub old functions to prevent crashes if other files still import them temporarily
function hashPassword() { return ''; }
function comparePassword() { return false; }
function generateToken() { return ''; }
function verifyToken() { return null; }

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  verifySession
};
