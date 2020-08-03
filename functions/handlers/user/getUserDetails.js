const { db } = require('../../util/admin');
exports.getUserDetails = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.params.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData.user = doc.data();
        return db
          .collection('places')
          .where('userHandle', '==', req.params.handle)
          .orderBy('createdAt', 'desc')
          .get();
      } else {
        return res.status(404).json({ error: 'user not found' });
      }
    })
    .then((data) => {
      userData.places = [];
      if (data) {
        data.forEach((doc) => {
          userData.places.push({
            placeId: doc.id,
            body: doc.data().body,
            description: doc.data().description,
            address: doc.data().address,
            contactNo: doc.data().contactNo,
            priceRange: doc.data().priceRange,
            userHandle: doc.data().userHandle,
            userImage: doc.data().userImage,
            placeImgUrl: doc.data().placeImgUrl,
            createdAt: doc.data().createdAt,
            likeCount: doc.data().likeCount,
            commentCount: doc.data().commentCount,
            viewCount: doc.data().viewCount,
          });
        });
        return res.json(userData);
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
