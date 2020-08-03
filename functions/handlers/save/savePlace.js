const { db } = require('../../util/admin');
//saved place
exports.savePlace = (req, res) => {
  const saveDocument = db
    .collection('saved')
    .where('userHandle', '==', req.user.handle)
    .where('placeId', '==', req.params.placeId)
    .limit(1);

  const placeDocument = db.doc(`/places/${req.params.placeId}`);
  const userDocument = db.doc(`users/${req.user.handle}`);

  let placeData = {};

  placeDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        placeData = doc.data();
        placeData.placeId = doc.id;
        return saveDocument.get();
      } else {
        return res.status(404).json({ error: 'Place not found' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection('saved')
          .add({
            placeId: req.params.placeId,
            userHandle: req.user.handle,
          })
          .then(() => {
            placeData.saveByOtherCount++;
            return placeDocument.update({
              saveByOtherCount: placeData.saveByOtherCount,
            });
          })
          .then(() => {
            return res.json(placeData);
          });
      } else {
        return res.status(400).json({ error: 'Place already saved' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
