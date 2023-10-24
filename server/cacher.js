const { MongoClient } = require("mongodb");
const axios = require("axios");
let CLIENT;
let MONGODB_HOST, MONGODB_PORT, MONGODB_DATABASE;

const DEFAULT_DATABASES = [
  "personer",
  "partier",
  "valgdistrikt",
  "komiteer",
  "delegasjoner",
  "metadata",
];

const reformatDate = (date) => {
  if (date == null) return null;
  if (typeof date === "string") {
    date = new Date(parseInt(date.substring(6)) + 7200000);
  }
  return date.getTime();
};

const cacheMetadata = async () => {
  let metadata = { cache_date: Date.now() };

  let sesjoner = await axios.get(
    "https://data.stortinget.no/eksport/sesjoner?format=json"
  );

  metadata.sesjoner = sesjoner.data.sesjoner_liste.map((obj) => {
    return {
      fra: reformatDate(obj.fra),
      til: reformatDate(obj.til),
      id: obj.id,
    };
  });
  metadata.innevaerende_sesjon = {
    fra: reformatDate(sesjoner.data.innevaerende_sesjon.fra),
    til: reformatDate(sesjoner.data.innevaerende_sesjon.til),
    id: sesjoner.data.innevaerende_sesjon.id,
  };

  let stortingsperioder = await axios.get(
    "https://data.stortinget.no/eksport/stortingsperioder?format=json"
  );

  metadata.stortingsperioder =
    stortingsperioder.data.stortingsperioder_liste.map((obj) => {
      return {
        fra: reformatDate(obj.fra),
        til: reformatDate(obj.til),
        id: obj.id,
      };
    });
  metadata.innevaerende_stortingsperiode = {
    fra: reformatDate(stortingsperioder.data.innevaerende_stortingsperiode.fra),
    til: reformatDate(stortingsperioder.data.innevaerende_stortingsperiode.til),
    id: stortingsperioder.data.innevaerende_stortingsperiode.id,
  };

  let db = CLIENT.db(MONGODB_DATABASE);
  db.collection("metadata")
    .drop()
    .then((res) => {
      if (res) {
        db.collection("metadata")
          .insertOne(metadata)
          .then((res) => {
            console.log("[Cache] Metadata cached");
          });
      }
    });
};

const cacheDagensRepresentanter = () => {
  axios
    .get("https://data.stortinget.no/eksport/dagensrepresentanter?format=json")
    .then((response) => {
      response.data.dagensrepresentanter_liste.forEach((el) => {
        cachePerson(el.id);
      });
    });
};

const cachePartier = async () => {
  let metadata = await CLIENT.db(MONGODB_DATABASE)
    .collection("metadata")
    .findOne();

  let partier = [];

  for (let sp of metadata.stortingsperioder) {
    let response = await axios.get(
      `https://data.stortinget.no/eksport/partier?stortingsperiodeid=${sp.id}&format=json`
    );

    for (let parti of response.data.partier_liste) {
      let eksisterendePartiIndeks = partier.findIndex((p) => p._id == parti.id);
      if (eksisterendePartiIndeks != -1) {
        partier[eksisterendePartiIndeks].representerte_stortingsperioder.push(
          sp.id
        );
      } else {
        partier.push({
          cache_date: Date.now(),
          _id: parti.id,
          navn: parti.navn,
          representerte_stortingsperioder: [sp.id],
        });
      }
    }
  }

  let collection = CLIENT.db(MONGODB_DATABASE).collection("partier");
  await collection.drop();
  await collection.insertMany(partier);
  console.log(`[Cacher] ${partier.length} Parties Cached`);
};

const cachePerson = (personId) => {
  if (personId == null || personId == undefined) {
    console.log("PersonID required");
    return;
  }
  axios
    .get(
      "https://data.stortinget.no/eksport/person?format=json&personid=" +
        personId
    )
    .then((personResponse) => {
      axios
        .get(
          "https://data.stortinget.no/eksport/kodetbiografi?format=json&personid=" +
            personId
        )
        .then((biographyResponse) => {
          let person = {
            cache_date: Date.now(),
            _id: personResponse.data.id,
            fornavn: personResponse.data.fornavn,
            parti_id: null,
            etternavn: personResponse.data.etternavn,
            kjoenn: personResponse.data.kjoenn,
            foedselsdato: reformatDate(personResponse.data.foedselsdato),
            doedsdato: reformatDate(personResponse.data.doedsdato),
            ansiennitet_aar:
              biographyResponse.data.personalia_kodet.ansiennitet_aar,
            ansiennitet_dager:
              biographyResponse.data.personalia_kodet.ansiennitet_dager,
            foede_fylke: biographyResponse.data.personalia_kodet.foede_fylke,
            foede_kommune:
              biographyResponse.data.personalia_kodet.foede_kommune,
            foreldre: {
              far: biographyResponse.data.personalia_kodet
                .person_biografi_foreldre_far_kodet,
              mor: biographyResponse.data.personalia_kodet
                .person_biografi_foreldre_mor_kodet,
            },
            stortingsperioder:
              biographyResponse.data.stortingsperiode_kodet_liste.map((obj) => {
                return {
                  fra_dato: reformatDate(obj.fra_dato),
                  til_dato: reformatDate(obj.til_dato),
                  parti_id: obj.parti_id,
                  fylke: obj.fylke,
                  verv: obj.verv,
                  stortingsperiode_id: obj.stortingsperiode_id,
                  representantnummer: obj.representantnummer,
                };
              }),
            permisjon: biographyResponse.data.permisjon_kodet_liste.map(
              (obj) => {
                return {
                  fra_dato: reformatDate(obj.fra_dato),
                  til_dato: reformatDate(obj.til_dato),
                  fravaer_grunn: obj.fravaer_grunn,
                  type: obj.type,
                  vara_fornavn: obj.vara_fornavn,
                  vara_etternavn: obj.vara_etternavn,
                };
              }
            ),
            litteratur: biographyResponse.data.litteratur_kodet_liste,
            verv_regjering: biographyResponse.data.stortingsverv_kodet_liste
              .filter((obj) => obj.komite_type == "REGJ")
              .map((obj) => {
                obj.fra_dato = reformatDate(obj.fra_dato);
                obj.til_dato = reformatDate(obj.til_dato);
                delete obj.stortingsperiode_id;
                return obj;
              }),
            verv_fagkomite: biographyResponse.data.stortingsverv_kodet_liste
              .filter((obj) => obj.komite_type == "FAG")
              .map((obj) => {
                obj.fra_dato = reformatDate(obj.fra_dato);
                obj.til_dato = reformatDate(obj.til_dato);
                return obj;
              }),
            verv_komite: biographyResponse.data.stortingsverv_kodet_liste
              .filter((obj) => obj.komite_type == "KOMI")
              .map((obj) => {
                obj.fra_dato = reformatDate(obj.fra_dato);
                obj.til_dato = reformatDate(obj.til_dato);
                return obj;
              }),
            verv_saerskilt_komite:
              biographyResponse.data.stortingsverv_kodet_liste
                .filter((obj) => obj.komite_type == "SKS")
                .map((obj) => {
                  obj.fra_dato = reformatDate(obj.fra_dato);
                  obj.til_dato = reformatDate(obj.til_dato);
                  return obj;
                }),
            verv_parti: biographyResponse.data.stortingsverv_kodet_liste
              .filter((obj) => obj.komite_type == "PART")
              .map((obj) => {
                obj.fra_dato = reformatDate(obj.fra_dato);
                obj.til_dato = reformatDate(obj.til_dato);
                return obj;
              }),
            verv_eoes: biographyResponse.data.stortingsverv_kodet_liste
              .filter((obj) => obj.komite_type == "EØS")
              .map((obj) => {
                obj.fra_dato = reformatDate(obj.fra_dato);
                obj.til_dato = reformatDate(obj.til_dato);
                return obj;
              }),
            verv_delegasjon: biographyResponse.data.stortingsverv_kodet_liste
              .filter((obj) => obj.komite_type == "DELE")
              .map((obj) => {
                obj.fra_dato = reformatDate(obj.fra_dato);
                obj.til_dato = reformatDate(obj.til_dato);
                return obj;
              }),
            verv_andre: biographyResponse.data.verv_kodet_liste,
            utdanning: biographyResponse.data.utdanning_yrke_kodet_liste
              .filter((obj) => obj.type == "10")
              .map((obj) => {
                delete obj.type;
                return obj;
              }),
            yrkeserfaring: biographyResponse.data.utdanning_yrke_kodet_liste
              .filter((obj) => obj.type == "20")
              .map((obj) => {
                delete obj.type;
                return obj;
              }),
            utmerkelser: biographyResponse.data.utdanning_yrke_kodet_liste
              .filter((obj) => obj.type == "40")
              .map((obj) => {
                delete obj.type;
                return obj;
              }),
          };

          let db = CLIENT.db(MONGODB_DATABASE);
          db.collection("metadata")
            .findOne()
            .then((metadata) => {
              stortingsperiode = person.stortingsperioder.find(
                (s) =>
                  s.stortingsperiode_id ===
                  metadata.innevaerende_stortingsperiode.id
              );
              if (stortingsperiode) {
                person.parti_id = stortingsperiode.parti_id;
              }
              db.collection("personer")
                .updateOne(
                  { _id: person._id },
                  { $set: person },
                  { upsert: true }
                )
                .then((res) => {
                  console.log(
                    `[Cache] Successfully cached person ${person._id} (${
                      person.fornavn + " " + person.etternavn
                    })`
                  );
                });
            });
        });
    })
    .catch((error) => {
      if (error.response.status === 500) {
        console.log(`cachePerson: Ugyldig personId '${personId}'`);
      } else {
        console.log(`cachePerson: Error`);
      }
    });
};

const CACHES = [
  {
    name: "person",
    trigger: cachePerson,
  },
  {
    name: "dagensrep",
    trigger: cacheDagensRepresentanter,
  },
  {
    name: "metadata",
    trigger: cacheMetadata,
  },
  { name: "partier", trigger: cachePartier },
];

const connectToMongoDB = (host, port, database) => {
  MONGODB_HOST = host;
  MONGODB_PORT = port;
  MONGODB_DATABASE = database;

  mongodb_url = `mongodb://${host}:${port}/`;
  return new Promise((myResolve, myReject) => {
    console.log(`[MongoDB] Connecting to MongoDB (${mongodb_url})...`);
    CLIENT = new MongoClient(mongodb_url);
    CLIENT.connect()
      .then((connection) => {
        CLIENT = connection;
        console.log("[MongoDB] MongoDB Connected.");
        initMongoDB(connection);
        myResolve(connection);
      })
      .catch((err) => {
        myReject(err);
      });
  });
};

const initMongoDB = () => {
  let database = CLIENT.db(MONGODB_DATABASE);

  DEFAULT_DATABASES.forEach((db_name) => {
    database.createCollection(db_name).catch((err) => {
      console.log(err);
    });
  });
};

const initCache = (input) => {};

module.exports = {
  connectToMongoDB,
  CACHES,
  CLIENT,
};
