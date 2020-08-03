const { db } = require('../../util/admin');
//like place
exports.likePlace = (req, res) => {
  const likeDocument = db
    .collection('likes')
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
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Place not found' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection('likes')
          .add({
            placeId: req.params.placeId,
            userHandle: req.user.handle,
          })
          .then(() => {
            placeData.likeCount++;
            return placeDocument.update({ likeCount: placeData.likeCount });
          })
          .then(() => {
            return res.json(placeData);
          });
      } else {
        return res.status(400).json({ error: 'Place already liked' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
