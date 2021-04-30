Object.defineProperty(exports, "__esModule", { value: true });
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { firestore } = require('firebase-admin');
admin.initializeApp();

exports.callAddAlliance = functions.https.onCall(async (data, context) => {
    const data_alliance = data.alliance;
    const data_promotion = data.promotion;
    const data_category = data.category;
    const data_collection_path = data.collectionPath;
    const data_subcollection_path = data.subcollectionPath;
    await pushAlliance(data_promotion, data_category, data_alliance, data_collection_path, data_subcollection_path);
    return;
});
exports.callAddEstablishment = functions.https.onCall(async (data, context) => {
    const data_establishment = data.establishment;
    const data_category_id = data.category_id;
    const data_collection_path = data.collectionPath;
    console.log(`the params are -> ${JSON.stringify(data_establishment)}-> ${data_category_id}-> ${data_collection_path}`);
    await addEstablishment(data_establishment, data_category_id, data_collection_path);
    return;
});
exports.callAddPromotion = functions.https.onCall(async (data, context) => {
    const data_promotion = data.promotion;
    const data_category = data.category;
    const data_establishment_id = data.establishment_id;
    const data_collection_path = data.collectionPath;
    const data_subcollection_path = data.subCollectionPath;
    data_promotion.date = new Date();
    console.log(`the params are -> ${JSON.stringify(data_promotion)}-> ${data_category} -> ${data_establishment_id}->${data_collection_path}->${data_subcollection_path}`);
    const data_establishment = await admin.firestore().collection(data_collection_path).doc(data_category).collection('establishments').doc(data_establishment_id).get()
        .then(async (doc) => {
        if (!doc.exists) {
            console.log("no such document");
        }
        else {
            console.log("DOcument data:", doc.data());
            await addPromotion(data_promotion, data_category, data_establishment_id, doc.data(), data_collection_path, data_subcollection_path);
        }
        return;
    }).catch(() => {
        console.log("an error ocurred");
    });
    console.log(`the query params are -> ${JSON.stringify(data_establishment)}`);
    return;
});
async function pushAlliance(promo, category, alliance, collectionPath, subcollectionPath) {
    await admin.firestore().collection(collectionPath).doc(category).set({ category_id: category });
    const allianceRef = admin.firestore().collection('alliance').doc(category).collection('establishments');
    const establishmentRef = allianceRef.add(alliance);
    const establishmentId = (await establishmentRef).id;
    await allianceRef.doc(establishmentId).update({ establishment_id: establishmentId, category_id: category });
    await addPromotion(promo, category, establishmentId, alliance, collectionPath, subcollectionPath);
    console.log(`${alliance},the establishment id is -> ${establishmentId}`);
}
async function addEstablishment(alliance, category_id, collectionPath) {
    const allianceRef = admin.firestore().collection(collectionPath).doc(category_id).collection('establishments');
    const establishmentRef = allianceRef.add(alliance);
    const establishmentId = (await establishmentRef).id;
    await allianceRef.doc(establishmentId).update({ establishment_id: establishmentId, category_id: category_id });
}
async function addPromotion(promo, category, stablishment, establishment, collectionPath, subcollectionPath) {
    const refFire = admin.firestore().collection(collectionPath).doc(category).collection('establishments').doc(stablishment).collection(subcollectionPath);
    const newRefFire = refFire.add(promo);
    console.log(`the promo created is ${promo}`);
    await (await newRefFire).update({ promotion_id: (await newRefFire).id, establishment_id: stablishment, establishment: establishment.establishment, category_id: category,
        description_establishment: establishment.description, direction_establishment: establishment.direction, phone_number: establishment.phone_number, establishment_image: establishment.establishment_image
    });
}

exports.onNewRoomReservationCredicomer = functions.firestore.document('/rooms_credicomer/{roomId}/{roomSubCollection}/{dateId}')
    .onCreate((snapshot, context) => {
    const roomCollection = "rooms_credicomer";
    const roomId = context.params.roomId;
    const roomSubCollection = context.params.roomSubCollection;
    const dateId = context.params.dateId;
    console.log(`New Room reservation firestore  roomCollection-> ${roomCollection}  roomSubCollection -> ${roomSubCollection}
                dateId -> ${dateId}
    `);
    return snapshot.ref.update({ roomId: roomId, roomDetailId: dateId });
});

exports.onUpdateRating = functions.firestore.document("/{allianceId}/{categoryId}/establishments/{establishmentId}/{promotionsId}/{promotionId}")
    .onUpdate((change, context) => {
    const allianceId = context.params.allianceId;
    const categoryId = context.params.categoryId;
    const establishmentId = context.params.establishmentId;
    const promotionsId = context.params.promotionsId;
    const promotionId = context.params.promotionId;
    const before = change.before.data();
    const after = change.after.data();
    console.log(`the path is ${allianceId} ${categoryId}-> ${establishmentId}->${promotionsId} ->${promotionId}`);
    const beforeRating = before === null || before === void 0 ? void 0 : before.rating;
    const afterRating = after === null || after === void 0 ? void 0 : after.rating;
    console.log(`the map before is ${JSON.stringify(beforeRating)}`);
    console.log(`the map after is ${JSON.stringify(afterRating)}`);
    console.log(`the map VALUE is ${afterRating.five}`);
    console.log(`the map VALUE is ${afterRating["five"]}`);
    if (JSON.stringify(beforeRating) === JSON.stringify(afterRating)) {
        return null;
    }
    let rating_avg = 0;
    let rating_count = 0;
    rating_avg = afterRating["five"] * 5 + afterRating["four"] * 4 + afterRating["three"] * 3 + afterRating["two"] * 2 + afterRating["one"];
    console.log(`the rating avg sum is ->${rating_avg}`);
    rating_count = afterRating["five"] + afterRating["four"] + afterRating["three"] + afterRating["two"] + afterRating["one"];
    rating_avg = rating_avg / rating_count;
    return change.after.ref.update({ rating_avg: parseFloat(rating_avg.toFixed(1)) });
});
exports.onNewCategoryFireStore = functions.firestore.document('/alliance/{categoryId}')
    .onCreate((snapshot, context) => {
    const categoryId = context.params.categoryId;
    console.log(`New category firestore ${categoryId}`);
    return snapshot.ref.update({ category: categoryId });
});

exports.onNewPromotion = functions.firestore.document('/{allianceId}/{categoryId}/establishments/{stablishmentId}/{promotionsId}/{promoId}')
    .onCreate((snapshot, context) => {
    var _a, _b;
    const allianceId = context.params.allianceId;
    const promotionsId = context.params.promotionsId;
    const promotionId = context.params.promoId;
    const title = (_a = snapshot.data()) === null || _a === void 0 ? void 0 : _a.promotion_name;
    const body = (_b = snapshot.data()) === null || _b === void 0 ? void 0 : _b.description;
    let topic;
    console.log(`the params are: ${allianceId} -> ${promotionsId}`);
    const payload = {
        notification: {
            title: title,
            body: body
        },
        data: {
            idPromo: promotionId,
            module: "alliance"
        }
    };
    if (allianceId.includes("unicomer")) {
        topic = "alliance_unicomer";
    }
    else {
        topic = "alliance";
    }
    return admin.messaging().sendToTopic(topic, payload).then(function (response) {
        console.log('Notification from alliance sent successfully:', response);
        return;
    }).catch(function (error) {
        console.log('Notification sent failed:', error);
        return;
    });
});

exports.onNewRecognition = functions.firestore.document('/users/{user}/recognitions/{recognition}')
.onCreate((snapshot, context)=>{
    const myToken = snapshot.data().token
    const payload = {
        notification:{
            title:"Nuevo reconocimiento",
            body:"Has recibido un nuevo reconocimiento, ve a tu perfil para poder verlo"
        },
        data:{
            id:"id",
            module:"alliance"
        }
    }
    return admin.messaging().sendToDevice(myToken, payload).then(function(response){
        return;
    }).catch(function(error){
        return;
    });
});

exports.onBirthDayNotification = functions.pubsub.schedule('every 5 minutes').onRun((context)=>{
    admin.firestore().collection('users').get().then(query =>{
        query.forEach(element=>{
            var user = element.data()
            console.log(user)
        
        })
        return;
    }).catch(funError =>{
        console.log('there was an error')
        return;
    })

})

exports.onNewRecordFireStore = functions.firestore.document('/e-Tracker/{documentId}/record/{recordId}')
    .onCreate((snapshot, context) => {
    const recordId = context.params.recordId;
    console.log(`New category firestore ${recordId}`);
    return snapshot.ref.update({ recordId: recordId });
});
exports.onNewTravel = functions.firestore.document('/e-Tracker/{documentId}')
    .onCreate((snapshot, context) => {
    const documentId = context.params.documentId;
    console.log(`New category firestore ${documentId}`);
    return snapshot.ref.update({ travelId: documentId });
});

exports.onNewReservationFireStore = functions.firestore.document('/rooms/{roomId}/reservations/{reservationId}')
    .onCreate((snapshot, context) => {
    const reservationId = context.params.reservationId;
    console.log(`New category firestore ${reservationId}`);
    return snapshot.ref.update({ id: reservationId });
});

exports.onNewReservationFireStore = functions.firestore.document('/reservations/{dateId}/rounds/{reservationId}')
    .onCreate((snapshot, context) => {
    const reservationId = context.params.reservationId;
    console.log(`New category firestore ${reservationId}`);
    return snapshot.ref.update({ id: reservationId });
});

exports.onNewMessage = functions.firestore.document('/recognitions/{recognitionId}')
    .onCreate((snapshot, context) => {
    const messageId = context.params.recognitionId;
    return snapshot.ref.update({ id: messageId });
}); 