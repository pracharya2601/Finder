const { db } = require('../util/admin');

exports.getAllPlaces = (req, res) => {
    db.collection('places')
    .orderBy('createdAt', 'desc')
    .get()
    .then(snapshot => {
        let places = [];
        snapshot.forEach(doc => {
            places.push({
                placeId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
        });
        return res.json(places);
    })
    .catch((err) => console.error(err));
}

exports.postOnePlace = (req, res) => {
    if(req.method !== 'POST') {
        return res.status(400).json({error: 'Method not allowed'})
    }

    db.collection('places')
    .add({
        body: req.body.body,
        userHandle: req.user.handle,
        imageUrl: [],
        createdAt: new Date().toISOString()
    })
    .then(ref => {
        res.json({message: `Added document with ID: ${ref.id}`})
    })
    .catch(err => {
        res.status(500).json({error: 'something went wrong'})
        console.error(err);
    })
}

exports.getPlace = (req, res) => {
    let placeData = {};
    db.doc(`/places/${req.params.placeId}`)
    .get()
    .then(doc => {
        if(!doc.exists) {
            return res.status(404).json({error: 'Place not found'});
        }
        placeData = doc.data();
        placeData.placeId = doc.id;

        return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('placeId', '==', req.params.placeId)
        .get();
    })
    .then(snapshot => {
        placeData.comments = [];
        snapshot.forEach(doc => {
            placeData.comments.push(doc.data())
        });
        return res.json(placeData);
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: err.code});
    });
}