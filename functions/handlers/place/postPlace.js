const { db } = require('../../util/admin');
exports.postOnePlace = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(400).json({ error: 'Method not allowed' });
  }

  const placeData = req.body;

  const newPlace = {
    ...placeData,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    reportCount: 0,
    saveByOtherCount: 0,
  };

  db.collection('places')
    .add(newPlace)
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
