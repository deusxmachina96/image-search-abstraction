var express = require('express');
var https = require('https');
var router = express.Router();

var queryString = function(options) {
  var query_string = "?";
  query_string += "q=" + encodeURIComponent(options.mainQuery);
  query_string += "&count=" + options.count;
  query_string += "&mkt=" + options.mkt;
  if(options.offset) {
    query_string += "&offset=" + options.offset;
  }
  return query_string;
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({error: "Please enter a valid search string."});
});

router.get('/:search_query', function(req, res, next){

  var searchOptions = {
    mainQuery: req.params.search_query,
    offset: req.query.offset,
    count: 10,
    mkt: 'en-us'
  };

  var httpOptions = {
    host: 'bingapis.azure-api.net',
    path: '/api/v5/images/search' + queryString(searchOptions),
    headers: {'Ocp-Apim-Subscription-Key' : '772467057cb64905b25a9744627d0cfc'}
  };

  console.log(queryString(searchOptions));
  var responseData = "";
  var imageInfoArray = [];
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

module.exports = router;
