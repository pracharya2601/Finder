const functions = require('firebase-functions');

//import routes
const  { 
    getAllPlaces, 
    postOnePlace,
    getPlace,
    commentOnPlace
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


//todo route
// delete place
// like place
app.post('/place/:placeId/comment', FBAuth, commentOnPlace)



//user routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth,  uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser)




//https://baseurl.com/api
exports.api = functions.https.onRequest(app);