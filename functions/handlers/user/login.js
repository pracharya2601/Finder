const { validateLoginData } = require('../../util/validators');
const { user } = require('firebase-functions/lib/providers/auth');

const firebase = require('firebase');

exports.login = (req, res) => {
  const user = req.body;

  //validate input value
  const { valid, errors } = validateLoginData(user);
  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      console.error(err);
      //auth/wrong password
      //auth user not found
      if (err.code === 'auth/wrong-password')
        return res.status(403).json({ general: 'Wrong credentials' });
      if (err.code === 'auth/user-not-found')
        return res.status(404).json({ general: 'No user found' });
      return res.status(500).json({ error: err.code });
    });
};
