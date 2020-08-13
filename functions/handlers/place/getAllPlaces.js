const { db } = require('../../util/admin');

exports.getAllPlaces = (req, res) => {
  db.collection('places')
    .orderBy('createdAt', 'desc')
    .get()
    .then((snapshot) => {
      let places = [];
      snapshot.forEach((doc) => {
        let data = doc.data();
        places.push({ ...data, placeId: doc.id });
      });
      return res.json(places);
    })
    .catch((err) => console.error(err));
};

exports.getRentalPlaces = (req, res) => {
  db.collection('places')
    .where('catagory', '==', 'rental')
    .orderBy('createdAt', 'desc')
    .get()
    .then((snapshot) => {
      let filteredPlaces = [];
      snapshot.forEach((doc) => {
        let data = doc.data();
        filteredPlaces.push({ ...data, placeId: doc.id });
      });
      return res.json(filteredPlaces);
    });
};
exports.getSalePlaces = (req, res) => {
  db.collection('places')
    .where('catagory', '==', 'sale')
    .orderBy('createdAt', 'desc')
    .get()
    .then((snapshot) => {
      let filteredPlaces = [];
      snapshot.forEach((doc) => {
        let data = doc.data();
        filteredPlaces.push({ ...data, placeId: doc.id });
      });
      return res.json(filteredPlaces);
    });
};
exports.getOtherPlaces = (req, res) => {
  db.collection('places')
    .where('catagory', '==', 'other')
    .orderBy('createdAt', 'desc')
    .get()
    .then((snapshot) => {
      let filteredPlaces = [];
      snapshot.forEach((doc) => {
        let data = doc.data();
        filteredPlaces.push({ ...data, placeId: doc.id });
      });
      return res.json(filteredPlaces);
    });
};
