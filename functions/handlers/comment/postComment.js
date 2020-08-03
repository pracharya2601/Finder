const { db } = require('../../util/admin');

exports.commentOnPlace = (req, res) => {
  if (req.body.body.trim() === '')
    return res.status(400).json({ comment: 'must not be empty' });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    placeId: req.params.placeId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
  };

  db.doc(`/places/${req.params.placeId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'place not found' });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      db.collection('comments')
        .add(newComment)
        .then((doc) => {
          let resComment = newComment;
          resComment.commentId = doc.id;
          res.json(resComment);
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: `Something went wrong => ${err.code}` });
    });
};
