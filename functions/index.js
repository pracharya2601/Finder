const functions = require('firebase-functions');

const { db } = require('./util/admin');

//import routes
const {
  getAllPlaces,
  postOnePlace,
  uploadPlaceImage,
  getPlace,
  commentOnPlace,
  getOneComment,
  // updateComment,
  likePlace,
  unlikePlace,
  deletePlace,
  unSavePlace,
  savePlace,
} = require('./handlers/places');
const {
  signup,
  login,
  resetPassword,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
} = require('./handlers/users');

//import firebae auth
const FBAuth = require('./util/fbAuth');

//express
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

// places routes
app.get('/places', getAllPlaces);
app.post('/place', FBAuth, postOnePlace);
app.post('/place/:placeId/image', FBAuth, uploadPlaceImage);
app.get('/place/:placeId', getPlace);

app.delete('/place/:placeId', FBAuth, deletePlace);
app.get('/place/:placeId/like', FBAuth, likePlace);
app.get('/place/:placeId/unlike', FBAuth, unlikePlace);
app.post('/place/:placeId/comment', FBAuth, commentOnPlace);
app.get('/place/:placeId/comment/:commentId', FBAuth, getOneComment);
// app.post('/place/:placeId/comment/:commentId', FBAuth, updateComment);
app.get('/place/:placeId/save', FBAuth, savePlace);
app.get('/place/:placeId/unsave', FBAuth, unSavePlace);

//user routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/resetpassword', resetPassword);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

//https://baseurl.com/api
exports.api = functions.https.onRequest(app);

//like notification

exports.createNotificationOnLike = functions.firestore
  .document('likes/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/places/${snapshot.data().placeId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
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
      .catch((err) => {
        console.error(err);
      });
  });

exports.deleteNotificationOnUnLike = functions.firestore
  .document('likes/{id}')
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions.firestore
  .document('comments/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/places/${snapshot.data().placeId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
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
      .catch((err) => {
        console.error(err);
        return;
      });
  });
