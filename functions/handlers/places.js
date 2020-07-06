const { db } = require('../util/admin');
const config = require('../util/config');
const admin = require('../util/admin');

exports.getAllPlaces = (req, res) => {
  db.collection('places')
    .orderBy('createdAt', 'desc')
    .get()
    .then((snapshot) => {
      let places = [];
      snapshot.forEach((doc) => {
        places.push({
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
          reportCount: doc.data().reportCount,
        });
      });
      return res.json(places);
    })
    .catch((err) => console.error(err));
};

exports.postOnePlace = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(400).json({ error: 'Method not allowed' });
  }
  const houseImg = 'rent.jpeg';

  const newPlace = {
    body: req.body.body,
    catagory: req.body.catagory,
    description: req.body.description,
    address: req.body.address,
    contactNo: req.body.contactNo,
    priceRange: req.body.priceRange,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    placeImgUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${houseImg}?alt=media`,
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    reportCount: 0,
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

//upload house and room image seperately
exports.uploadPlaceImage = (req, res) => {
  const busboy = new Busboy({
    headers: req.headers,
    limits: {
      // Cloud functions impose this restriction
      fileSize: 10 * 1024 * 1024,
    },
  });
  const fields = {};
  const files = [];
  const fileWrites = [];

  // Note: os.tmpdir() points to an in-memory file system on GCF
  // Thus, any files in it must fit in the instance's memory.
  const tmpdir = os.tmpdir();

  busboy.on('field', (key, value) => {
    fields[key] = value;
  });

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    //changed
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Wrong file submitted' });
    }
    const imageExtention = filename.split('.')[filename.split('.').length - 1];

    imageFileName = `${Math.round(
      Math.random() * 10000000000
    )}.${imageExtention}`;
    const filepath = path.join(os.tmpdir(), imageFileName);

    const writeStream = fs.createWriteStream(filepath);
    file.pipe(writeStream);

    fileWrites.push(
      new Promise((resolve, reject) => {
        file.on('end', () => writeStream.end());
        writeStream.on('finish', () => {
          const size = Buffer.byteLength(buffer);
          if (err) {
            return reject(err);
          }
          files.push({
            originalname: imageFileName,
            mimetype,
            buffer,
            size,
          });
          try {
            fs.unlinkSync(filepath);
          } catch (error) {
            return reject(error);
          }
          resolve();
        });
      })
    );
    writeStream.on('error', reject);
  });

  busboy.on('finish', () => {
    Promise.all(fileWrites);

    files.forEach((image) => {
      uploadPlaceImage(image);
    });

    // Get a reference to the storage service, which is used to create references in your storage bucket
    var storage = firebase.storage();
    // Create a storage reference from our storage service
    var storageRef = storage.ref();
    // Create a child reference
    var imagesRef = storageRef.child('imagesPlace');
    // imagesRef now points to 'images'

    function uploadPlaceImage(imageFile) {
      imagesRef
        .put(imageFile.filepath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageFile.mimetype,
            },
          },
        })
        .then(() => {
          const img = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
          return db
            .doc(`/places/${req.params.placeId}/placeImgUrl/`)
            .update(img);
        })
        .then(() => {
          return res.json({ message: 'Image uploaded successfully' });
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({ error: err.code });
        });
    }
  });

  busboy.end(req.rawBody);
};

// get single place and add views count

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

//post comment routes

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

exports.getOneComment = (req, res) => {
  let commentData = {};

  const commentDocument = db.doc(`/comments/${req.params.commentId}`);

  commentDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'comment not found' });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: 'unauthorized' });
      }
      if (doc.data().placeId !== req.params.placeId) {
        return res.status(404).json({ error: 'comment not found' });
      }
      commentData = doc.data();
      commentData.commentId = doc.id;
    })
    .then((data) => {
      return res.json(commentData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// exports.updateComment = (req, res) => {
//   const updatedComment = {
//     body: req.body.body,
//     createdAt: new Date().toISOString(),
//     placeId: req.params.placeId,
//     userHandle: req.user.handle,
//     userImage: req.user.imageUrl,
//   };

//   let commentData = {};

//   const commentDocument = db.doc(`/comments/${req.params.commentId}`);

//   commentDocument
//     .get()
//     .then((doc) => {
//       if (!doc.exists) {
//         return res.status(404).json({ error: 'comment not found' });
//       }
//       if (doc.data().userHandle !== req.user.handle) {
//         return res.status(403).json({ error: 'unauthorized' });
//       }
//       if (doc.data().placeId !== req.params.placeId) {
//         return res.status(404).json({ error: 'comment not found' });
//       }
//       commentData = doc.data();
//       commentData.commentId = doc.id;
//     })
//     .then((data) => {
//       if (
//         doc.data().placeId === req.params.placeId &&
//         doc.data().userHandle == req.user.handle
//       ) {
//         commentDocument.update({ body: req.body.body });
//       } else {
//         return res.status(404).json({ error: 'comment not found' });
//       }
//     })
//     .then((data) => {
//       return res.json(updatedComment);
//     })
//     .catch((err) => {
//       console.error(err);
//       res.status(500).json({ error: err.code });
//     });
// };

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

//unlike places

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

exports.deletePlace = (req, res) => {
  const document = db.doc(`/places/${req.params.placeId}`);

  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Place not found' });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: 'unauthorized' });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: 'Place deleted successfully' });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.deleteComment = (req, res) => {
  const document = db.doc(`/comments/${req.params.id}`);
};

//saved place
exports.savePlace = (req, res) => {
  const saveDocument = db
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
        return res.status(400).json({ error: 'Place not sfound' });
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
            res.json(placeData);
          });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
    });
};

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
            let resComment = newComment;
            return res.json(resComment);
          })
          .then(() => {
            placeData.reportCount++;
            return placeDocument.update({ reportCount: placeData.reportCount });
          });
      } else {
        return res.status(400).json({ error: 'Already reported' });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: `Something went wrong ${err.code}` });
    });
};
