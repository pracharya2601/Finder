const { validateResetPasswordUser } = require('../../util/validators');
const firebase = require('firebase');

exports.resetPassword = (req, res) => {
  const user = req.body;
  //validate input value
  const { valid, errors } = validateResetPasswordUser(user);
  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .sendPasswordResetEmail(user.email)
    .then(() => {
      return res.json({
        message: 'Email was sent please check your email to reset password',
      });
    })
    .catch((err) => {
      console.error(err);
      //auth user not found
      if (err.code === 'auth/user-not-found')
        return res.status(404).json({ general: 'No user found' });
      return res.status(500).json({ error: err.code });
    });
};
