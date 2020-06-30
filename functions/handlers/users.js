const { admin, db } = require('../util/admin');

const config = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const {
  validateSignupData,
  validateLoginData,
  validateResetPasswordUser,
  reduceUserDetails,
} = require('../util/validators');
const { user } = require('firebase-functions/lib/providers/auth');

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
    fullName: req.body.fullName,
    age: req.body.age,
    contactNo: req.body.contactNo,
  };

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
          .json({ general: 'something went wrong, please tye again' });
      }
    });
};

//
exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

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
        return res.status(403).json({ general: 'Wrond credentials' });
      if (err.code === 'auth/user-not-found')
        return res.status(404).json({ general: 'No user found' });
      return res.status(500).json({ error: err.code });
    });
};
//add user details
exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: 'Detail added successfully' });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

//get other user data
exports.getUserDetails = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.params.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.user = doc.data();
        return db
          .collection('places')
          .where('userHandle', '==', req.params.handle)
          .orderBy('createdAt', 'desc')
          .get();
      } else {
        return res.status(404).json({ error: 'user not found' });
      }
    })
    .then((data) => {
      userData.places = [];
      if (data) {
        data.forEach((doc) => {
          userData.places.push({
            placeId: doc.id,
            body: doc.data().body,
            description: doc.data().description,
            address: doc.data().address,
            contactNo: doc.data().contactNo,
            priceRange: doc.data().priceRange,
            userHandle: doc.data().userHandle,
            userImage: doc.data().userImage,
            placeImgUrl: doc.data().placeImgUrl,
            createdAt: doc.data().createdAt,
            likeCount: doc.data().likeCount,
            commentCount: doc.data().commentCount,
            viewCount: doc.data().viewCount,
          });
        });
        return res.json(userData);
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

//loged user detail
exports.getAuthenticatedUser = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db
          .collection('likes')
          .where('userHandle', '==', req.user.handle)
          .get();
      }
    })
    .then((data) => {
      userData.likes = [];
      data.forEach((doc) => {
        userData.likes.push(doc.data());
      });
      return db
        .collection('notifications')
        .where('recipient', '==', req.user.handle)
        .orderBy('createdAt', 'desc')
        .get();
    })
    .then((data) => {
      userData.notifications = [];
      data.forEach((doc) => {
        userData.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          placeId: doc.data().placeId,
          type: doc.data().type,
          read: doc.data().read,
          notificationId: doc.id,
        });
      });
      return res.json(userData);
    })

    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

//upload profile image
exports.uploadImage = (req, res) => {
  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let imageToBEUploaded;

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Wrong file submitted' });
    }

    const imageExtention = filename.split('.')[filename.split('.').length - 1];

    imageFileName = `${Math.round(
      Math.random() * 10000000000
    )}.${imageExtention}`;
    const filepath = path.join(os.tmpdir(), imageFileName);

    imageToBEUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on('finish', () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBEUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBEUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: 'Image uploaded successfully' });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  });
  busboy.end(req.rawBody);
};

exports.resetPassword = (req, res) => {
  const user = {
    email: req.body.email,
  };
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

exports.markNotificationsRead = (req, res) => {
  let batch = db.batch();
  req.body.forEach((notificationId) => {
    const notification = db.doc(`/notifications/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then()(() => {
      return res.json({ message: 'notifications marked read' });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.code });
    });
};
