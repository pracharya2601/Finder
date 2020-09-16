const { db } = require('../../util/admin');
const firebase = require('firebase');
const config = require('../../util/config');

const { validateSignupData } = require('../../util/validators');

exports.signup = (req, res) => {
  const userData = req.body;
  const newUser = { ...userData, savedCount: 0 };

  //validate entered email and password
  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return res.status(400).json(errors);

  const noImg = 'noimage.jpg';

  //validate username(handle)
  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res
          .status(400)
          .json({ handle: 'this username is not available' });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredintials = {
        handle: newUser.handle,
        email: newUser.email,
        fullName: newUser.fullName,
        age: newUser.age,
        contactNo: newUser.contactNo,
        savedCount: newUser.savedCount,
        language: '',
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        userId,
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredintials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        return res.status(400).json({ email: 'Email already in use' });
      } else {
        return res
          .status(500)
          .json({ general: 'something went wrong, please try again' });
      }
    });
};
