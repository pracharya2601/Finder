const functions = require('firebase-functions');

const { db } = require('./util/admin');
var admin = require('firebase-admin');

const config = require('./util/config');

const firebase = require('firebase');
firebase.initializeApp(config);

//import routes
//places
const {
  getAllPlaces,
  getRentalPlaces,
  getSalePlaces,
  getOtherPlaces,
} = require('./handlers/place/getAllPlaces');
const { postOnePlace } = require('./handlers/place/postPlace');
const { updatePlace } = require('./handlers/place/updatePlace');
const { getPlace } = require('./handlers/place/getPlace');
const { deletePlace } = require('./handlers/place/deletePlace');

//markabailable and unavailable
const { available } = require('./handlers/availablity/available');
const { unavailable } = require('./handlers/availablity/unavailable');

//comments
const { commentOnPlace } = require('./handlers/comment/postComment');

//like
const { likePlace } = require('./handlers/like/likePlace');
const { unlikePlace } = require('./handlers/like/unlikePlace');

//save
const { savePlace } = require('./handlers/save/savePlace');
const { unSavePlace } = require('./handlers/save/unSavePlace');

//report
const { reportOnPlace } = require('./handlers/report/reportOnPlace');

//user detail from here
//user create account login
const { signup } = require('./handlers/user/signup');
const { login } = require('./handlers/user/login');
const { resetPassword } = require('./handlers/user/resetPassword');

//user detail added
const { uploadImage } = require('./handlers/user/uploadImage');
const { addUserDetails } = require('./handlers/user/addUserDetails');

//user data
const {
  getAuthenticatedUser,
} = require('./handlers/user/getAuthenticatedUser');
const { getUserDetails } = require('./handlers/user/getUserDetails');

//notification
const {
  markNotificationsRead,
} = require('./handlers/user/markNotificationsRead');

//mail
const { sendMessage } = require('./handlers/user/sendMessage');

//import firebase auth
const FBAuth = require('./util/fbAuth');

//express
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
app.use(cors());

// places routes
app.get('/places', getAllPlaces);
app.get('/rentalPlaces', getRentalPlaces);
app.get('/salePlaces', getSalePlaces);
app.get('/otherPlaces', getOtherPlaces);
app.post('/place', FBAuth, postOnePlace);
app.get('/place/:placeId', getPlace);
app.post('/place/:placeId/update', FBAuth, updatePlace);

app.delete('/place/:placeId', FBAuth, deletePlace);
app.get('/place/:placeId/like', FBAuth, likePlace);
app.get('/place/:placeId/unlike', FBAuth, unlikePlace);
app.get('/place/:placeId/available', FBAuth, available);
app.get('/place/:placeId/unavailable', FBAuth, unavailable);
app.post('/place/:placeId/comment', FBAuth, commentOnPlace);
// app.get('/place/:placeId/comment/:commentId', FBAuth, getOneComment);
// app.post('/place/:placeId/comment/:commentId', FBAuth, updateComment);
app.get('/place/:placeId/save', FBAuth, savePlace);
app.get('/place/:placeId/unsave', FBAuth, unSavePlace);
app.post('/place/:placeId/report', FBAuth, reportOnPlace);

app.post('/mail', FBAuth, sendMessage);

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
