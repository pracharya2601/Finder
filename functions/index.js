const functions = require('firebase-functions');

//import routes
const  { 
    getAllPlaces, 
    postOnePlace,
    getPlace,
    commentOnPlace,
    likePlace,
    unlikePlace,
    deletePlace
} = require('./handlers/places');
const { 
    signup, 
    login, 
    uploadImage, 
    addUserDetails, 
    getAuthenticatedUser 
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
app.post('/place/:placeId/comment', FBAuth, commentOnPlace)



//user routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth,  uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser)




//https://baseurl.com/api
exports.api = functions.https.onRequest(app);