const { db } = require('../../util/admin');

exports.reportOnPlace = (req, res) => {
  if (req.body.body.trim() === '')
    return res.status(400).json({ report: 'must not be empty' });

  const reportDocument = db
    .collection('reports')
    .where('userHandle', '==', req.user.handle)
    .where('placeId', '==', req.params.placeId)
    .limit(1);

  const newReport = {
    body: req.body.body,
    type: req.body.type,
    createdAt: new Date().toISOString(),
    placeId: req.params.placeId,
    userHandle: req.user.handle,
  };
  placeData = {};

  db.doc(`/places/${req.params.placeId}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        placeData = doc.data();
        placeData.placeId = doc.id;
        return reportDocument.get();
      } else {
        return res.status(400).json({ error: 'not found' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection('reports')
          .add(newReport)
          .then((doc) => {
            let resReport = newReport;
            return res.json(resReport);
          })
          .then(() => {
            placeData.reportCount++;
            return placeDocument.update({ reportCount: placeData.reportCount });
          })
          .then(() => {
            res.json(placeData);
          });
      } else {
        return res.status(400).json({ error: 'Already reported' });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: `Something went wrong ${err.code}` });
    });
};
