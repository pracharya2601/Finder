const { db } = require('../../util/admin');

exports.postUpdatePlace = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(400).json({ error: 'Method not allowed' });
  }

  const placeData = req.body;

  db.collection('places')
    .doc(placeData.placeId)
    .set(newPlace)
    .then((doc) => {
      let resPlace = newPlace;
      resPlace.placeId = doc.id;
      res.json(resPlace);
    })
    .catch((err) => {
      res.status(500).json({ error: 'something went wrong' });
      console.error(err);
    });
};
