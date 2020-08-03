const { db } = require('../../util/admin');
exports.unSavePlace = (req, res) => {
  const savedDocument = db
    .collection('saved')
    .where('userHandle', '==', req.user.handle)
    .where('placeId', '==', req.params.placeId)
    .limit(1);

  const placeDocument = db.doc(`/places/${req.params.placeId}`);
  let placeData = {};

  placeDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        placeData = doc.data();
        placeData.placeId = doc.id;
        return savedDocument.get();
      } else {
        return res.status(400).json({ error: 'Place not found' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: 'place not saved by you' });
      } else {
        return db
          .doc(`/saved/${data.docs[0].id}`)
          .delete()
          .then(() => {
            placeData.saveByOtherCount--;
            return placeDocument.update({
              saveByOtherCount: placeData.saveByOtherCount,
            });
          })
          .then(() => {
            res.json(placeData);
          });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
    });
};
