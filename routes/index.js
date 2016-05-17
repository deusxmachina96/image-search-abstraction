var express = require('express');
var https = require('https');
var pgp = require('pg-promise')();
var router = express.Router();


var dbOptions;
if(process.env.NODE_ENV) {
  dbOptions = process.env.DATABASE_URL;
} else {
  dbOptions = {
    host: 'localhost',
    port: 5432,
    database: 'image_search_db',
    user: 'postgres',
    password: 'postgres'
  }
}

var db = pgp(dbOptions);

var createQueryString = function(options) {
  var query_string = "?";
  query_string += "q=" + encodeURIComponent(options.queryTerm);
  query_string += "&count=" + options.count;
  query_string += "&mkt=" + options.mkt;
  if(options.offset) {
    query_string += "&offset=" + options.offset;
  }
  return query_string;
};
var logError = function(error) {
  console.log("ERROR: ", error);
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {link: "img-abstraction-layer.herokuapp.com"});
});

router.get('/:search_query', function(req, res, next){

  var searchOptions = {
    queryTerm: req.params.search_query,
    offset: req.query.offset,
    count: 10,
    mkt: 'en-us'
  };

  var httpOptions = {
    host: 'bingapis.azure-api.net',
    path: '/api/v5/images/search' + createQueryString(searchOptions),
    headers: {'Ocp-Apim-Subscription-Key' : '772467057cb64905b25a9744627d0cfc'}
  };

  var queryTime = (new Date()).toUTCString();

  var responseData = "";
  var imageInfoArray = [];

  db.none("INSERT INTO history(query_term, query_time) VALUES ($1, $2)", [searchOptions.queryTerm, queryTime])
      .then(function() {
        console.log("Inserted query " + searchOptions.queryTerm + " at " + queryTime);
      })
      .catch(function(error) {
        logError(error);
      });
  https.get(httpOptions, function(response) {

    response.on('data', function(chunk) {
      responseData += chunk.toString();
    });

    response.on('end', function () {
      JSON.parse(responseData).value.forEach(function(element) {

        imageInfoArray.push({
          url: element.contentUrl,
          pageUrl: element.hostPageDisplayUrl,
          alt: element.name
        });

      });
      res.send(imageInfoArray);
    })

  }).on('error', function(error){

    console.log('ERROR: ', error);

  });

});

router.get('/api/latest', function(req, res, next) {
  db.any("SELECT * from history ORDER BY query_time DESC LIMIT 10")
      .then(function(data) {
        res.json(data);
      })
      .catch(function(error) {
        res.json({error: "Database error"});
        logError(error);
      });
});

module.exports = router;
