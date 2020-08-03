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
