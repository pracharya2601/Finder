const { db } = require('../../util/admin');

exports.getPlace = (req, res) => {
  let placeData = {};
  const placeDocument = db.doc(`/places/${req.params.placeId}`);

  placeDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Place not found' });
      }
      placeData = doc.data();
      placeData.placeId = doc.id;

      return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('placeId', '==', req.params.placeId)
        .get();
    })
    .then((data) => {
      placeData.comments = [];
      data.forEach((doc) => {
        placeData.comments.push(doc.data());
      });
      return res.json(placeData);
    })
    .then(() => {
      const newViewCount = placeData.viewCount + 1;
      return placeDocument.update({ viewCount: newViewCount });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
