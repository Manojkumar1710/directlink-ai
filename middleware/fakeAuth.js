/**
 * TEMPORARY auth middleware.
 *
 * Member 3 (Backend/Auth) will eventually own real OTP-based session
 * verification. Until that lands, this middleware fakes req.user so you
 * can build and test protected routes right now.
 *
 * How to fake a logged-in user while testing:
 *   curl -H "x-user-id: farmer-1" -H "x-user-role: farmer" ...
 *
 * If no headers are sent, it defaults to a farmer user so routes still work.
 *
 * >>> REPLACE THIS FILE'S CONTENTS <<< once Member 3 delivers real auth.
 * Nothing else in the app should need to change — every route already
 * expects req.user = { id, role }.
 */

function fakeAuth(req, res, next) {
  const id = req.header('x-user-id') || 'farmer-1';
  const role = req.header('x-user-role') || 'farmer'; // 'farmer' | 'buyer'

  req.user = { id, role };
  next();
}

module.exports = fakeAuth;
