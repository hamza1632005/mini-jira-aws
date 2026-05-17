// TODO: Sara (M2) will replace this with real Cognito JWT verification
const auth = (req, res, next) => {
  req.user = {
    sub: 'test-user-id',
    'custom:role': 'manager',
    'custom:teamId': 'team-1',
  };
  next();
};

module.exports = auth;
