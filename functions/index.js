const functions = require('firebase-functions');

const { db } = require('./util/admin');

//import routes
const {
  getAllPlaces,
  postOnePlace,
  getPlace,
  commentOnPlace,
  likePlace,
  unlikePlace,
  deletePlace,
} = require('./handlers/places');
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
} = require('./handlers/users');

//import firebae auth
const FBAuth = require('./util/fbAuth');

//express
const express = require('express');
const app = express();

// places routes
app.get('/places', getAllPlaces);
app.post('/place', FBAuth, postOnePlace);
app.get('/place/:placeId', getPlace);

app.delete('/place/:placeId', FBAuth, deletePlace);
app.get('/place/:placeId/like', FBAuth, likePlace);
app.get('/place/:placeId/unlike', FBAuth, unlikePlace);
app.post('/place/:placeId/comment', FBAuth, commentOnPlace);

//user routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

//https://baseurl.com/api
exports.api = functions.https.onRequest(app);

//like notification

exports.createNotificationOnLike = functions.firestore
  .document('likes/{id}')
  .onCreate((snapshot) => {
    db.doc(`/places/${snapshot.data().placeId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            placeId: doc.id,
          });
        }
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.deleteNotificationOnUnLike = functions.firestore
  .document('likes/{id}')
  .onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions.firestore
  .document('comments/{id}')
  .onCreate((snapshot) => {
    db.doc(`/places/${snapshot.data().placeId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            placeId: doc.id,
          });
        }
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });
