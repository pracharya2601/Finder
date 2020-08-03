const { db } = require('../../util/admin');
exports.unlikePlace = (req, res) => {
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
        return res.status(400).json({ error: 'Place not liked by you.' });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            placeData.likeCount--;
            return placeDocument.update({ likeCount: placeData.likeCount });
          })
          .then(() => {
            res.json(placeData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
