const axios = require("axios");

const cacher = require("./cacher");
let MONGO = null;
let DEFAULT_DB = null;

const passClient = (client) => {
  MONGO = client;
  DEFAULT_DB = cacher.MONGODB_DATABASE;
};

const handleRepresentativeList = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.query.period != undefined && req.query.period != "current") {
    let document_representatives = await MONGO.db(DEFAULT_DB)
      .collection("personer")
      .find({
        stortingsperioder: {
          $elemMatch: { stortingsperiode_id: req.query.period },
        },
      })
      .toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
        db.close();
      });

    document_representatives = document_representatives.map((rep) => {
      let period_info = rep.stortingsperioder.find(
        (el) => el.stortingsperiode_id == req.query.period
      );
      return {
        _id: rep._id,
        cache_date: rep.cache_date,
        fornavn: rep.fornavn,
        etternavn: rep.etternavn,
        avatarURL:
          "https://data.stortinget.no/eksport/personbilde?personid=" +
          rep._id +
          "&storrelse=middels&erstatningsbilde=true",
        parti: { id: period_info.parti_id },
        valgdistrikt: { navn: period_info.fylke },
      };
    });

    res.json({
      dagens_storting: false,
      representatives: document_representatives,
    });

    return;
  }

  axios
    .get("https://data.stortinget.no/eksport/dagensrepresentanter?format=json")
    .then((response) => {
      let list = [];

      for (el of response.data.dagensrepresentanter_liste) {
      }

      response.data.dagensrepresentanter_liste.forEach((el) => {
        komiteer_liste = el.komiteer_liste;
        if (komiteer_liste != null)
          komiteer_liste = komiteer_liste.map((x) => {
            return { id: x.id, navn: x.navn };
          });

        fast_vara = null;
        if (el.fast_vara != null)
          fast_vara = {
            id: el.fast_vara.id,
            fornavn: el.fast_vara.fornavn,
            etternavn: el.fast_vara.etternavn,
          };

        list.push({
          _id: el.id,
          fornavn: el.fornavn,
          etternavn: el.etternavn,
          //epost: el.epost,
          //kjoenn: el.kjoenn == 1 ? "Kvinne" : "Mann",
          //foedselsdato: el.foedselsdato,
          parti: {
            id: el.parti.id,
            navn: el.parti.navn,
          },
          valgdistrikt: {
            id: el.fylke.id,
            navn: el.fylke.navn,
          },
          //komiteer: komiteer_liste,
          //vara_representant: el.vara_representant,
          //fast_vara: fast_vara,
          avatarURL:
            "https://data.stortinget.no/eksport/personbilde?personid=" +
            el.id +
            "&storrelse=middels&erstatningsbilde=true",
        });
      });

      res.json({ dagens_storting: true, representatives: list });
    });
};

const handlePersonInfo = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.query.personId == undefined) {
    res.status(400);
    res.json({ message: "Parameter 'personId' is required" });
    return;
  }

  let document = await MONGO.db(DEFAULT_DB).collection("personer").findOne({
    _id: req.query.personId,
  });

  if (document == null) {
    res.status(400);
    res.json({ errorCode: 101, message: "Ugyldig personId" });
    return;
  }

  document.avatarURL =
    "https://data.stortinget.no/eksport/personbilde?personid=" +
    document._id +
    "&storrelse=middels&erstatningsbilde=true";
  res.json(document);
};

const handleMetadata = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  let document = await MONGO.db(DEFAULT_DB).collection("metadata").findOne();
  res.json(document);
};

module.exports = {
  handleRepresentativeList,
  handlePersonInfo,
  handleMetadata,
  passClient,
};
