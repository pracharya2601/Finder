const { db } = require('../../util/admin');

exports.updatePlace = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(400).json({ error: 'Method not allowed' });
  }
  const placeData = req.body;

  db.doc(`/places/${req.params.placeId}`)
    .update(placeData)
    .then(() => {
      res.json(placeData);
    })
    .catch((err) => {
      res.status(500).json({ error: 'something went wrong' });
      console.error(err);
    });
};
