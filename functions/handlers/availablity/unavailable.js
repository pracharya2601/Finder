const { db } = require('../../util/admin');
//mark unavailable
exports.unavailable = (req, res) => {
  const placeDocument = db.doc(`/places/${req.params.placeId}`);
  let placeData = {};
  placeDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        placeData = doc.data();
        placeData.placeId = doc.id;
        if (req.user.handle === doc.data().userHandle) {
          placeData.available = false;
          return placeDocument.update({ available: placeData.available });
        } else {
          res.status(404).json({ error: err.code });
        }
      } else {
        return res.status(404).json({ error: 'Place not found' });
      }
    })
    .then(() => {
      return res.json(placeData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
