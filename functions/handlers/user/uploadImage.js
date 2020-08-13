const { admin, db } = require('../../util/admin');

//upload profile image
exports.uploadImage = (req, res) => {
  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let imageToBEUploaded;

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    if (
      mimetype !== 'image/jpeg' &&
      mimetype !== 'image/png' &&
      mimetype !== 'image/HEIC'
    ) {
      return res.status(400).json({ error: 'Wrong file submitted' });
    }

    const imageExtention = filename.split('.')[filename.split('.').length - 1];

    imageFileName = `${Math.round(
      Math.random() * 10000000000
    )}.${imageExtention}`;
    const filepath = path.join(os.tmpdir(), imageFileName);

    imageToBEUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on('finish', () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBEUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBEUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: 'Image uploaded successfully' });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  });
  busboy.end(req.rawBody);
};
