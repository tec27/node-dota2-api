/*jshint asi:true laxcomma: true*/
var request = require('request')
  , BigInteger = require('bigdecimal').BigInteger

module.exports = function createApiWrapper(apiKey) {
  return new Api(apiKey)
}

function Api(key) {
  this.key = key
}

Api.baseUrl = 'https://api.steampowered.com/'
Api.getUrl = function(interfaceName, method, version) {
  return Api.baseUrl + interfaceName + '/' + method + '/v' + version + '/'
}

function camelToUnderscore(str) {
  return str.replace(/([A-Z])/g, '_$1')
}

Api.prototype.resolveVanityUrl = function(vanityName, cb) {
  var opts =  { uri: Api.getUrl('ISteamUser', 'ResolveVanityURL', 1) + '?key=' +
                      this.key + '&vanityurl=' + encodeURIComponent(vanityName)
              , json: true
              }
  return request.get(opts, function(err, res, body) {
    if(err) return cb(err)
    else return cb(null, body.response)
  })
}

// account id is the low 32-bits of the steamId, used for some Dota2 queries
// necessary to use BigDecimal here, since although it is only 64 bits, the JS Float implementation
// tends to be inaccurate at this magnitude
Api.prototype.steamIdToAccountId = function(steamId) {
  var bits = new BigInteger('FFFFFFFF', 16)
    , idInt = new BigInteger(steamId, 10)

  return idInt.and(bits).toString(10)
}

Api.prototype.getMatchHistory = function(filters, cb) {
  var formattedFilters = []

  if(typeof cb == 'undefined') {
    cb = filters
    filters = {}
  }

  for(var filter in filters) {
    var key
    if(filter.indexOf('_') > -1)
      key = filter
    else
      key = camelToUnderscore(filter)

    formattedFilters.push(key + '=' + encodeURIComponent(filters[filter]))
  }

  var extraQuery = !formattedFilters.length ? '' : ('&' + formattedFilters.join('&'))
    , opts =  { uri: Api.getUrl('IDOTA2Match_570', 'GetMatchHistory', 1) + '?key=' +
                      this.key + extraQuery
              , json: true
              }

  return request.get(opts, function(err, res, body) {
    if(err) return cb(err)
    else return cb(null, body.result)
  })
}

