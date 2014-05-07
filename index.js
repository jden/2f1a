var http = require('http')
var fs = require('fs')
var concat = require('concat-stream')
var EE = require('events').EventEmitter
var crypto = require('crypto')
var twilio = require('twilio')(process.env.TWILIO_ACCT, process.env.TWILIO_TOKEN)

var authnTimeoutLength = parseInt(process.env.AUTHN_TIMEOUT)

var confirmPattern = /^\/confirm\/[a-f0-9]{40}$/
http.createServer(function (req, res) {
  if (req.url === '/') {
    return index(req, res)
  } else if (req.url === '/login' && req.method === 'POST') {
    return login(req, res)
  } else if (confirmPattern.test(req.url)) {
    return confirm(req, res)
  } else {
    res.statusCode = 400
    res.end()
  }
})
.listen(process.env.PORT, function (e) {
  if (e) {
    console.error('failed to start', e)
  } else {
    console.log('listening on ' + process.env.BASE_URL + ':' + process.env.PORT)
  }
})

function index(req, res) {
  res.setHeader('content-type','text/html')
    fs.createReadStream('./index.html')
      .pipe(res)
}

var bus = new EE

function login(req, res) {
  req.pipe(concat(function (rbody) {

    var body = JSON.parse(rbody)
    console.log(body)

    if (!body || !body.username || !body.phone) {
      res.statusCode = 400
      res.end()
      return
    }

    var phone = parsePhone(body.phone)
    if (!phone) {
      res.statusCode = 400
      res.end('invalid phone')
      return
    }

    var timeout = setTimeout(function () {
      res.statusCode = 419 // wikipedia says it's authentication timeout so it must be true
                           // [citation required]
      res.end(JSON.stringify({disposition: 'timeout'}))
      cleanup()
    }, authnTimeoutLength)

    function cleanup() {
      if (timeout) {
        clearTimeout(timeout)
      }
      // end listening for authn event

    }

    makeRandomToken(function (err, token) {
      if (err) {
        res.statusCode = 500
        console.log(err)
        return res.end('error')
      }

      console.log('authing ' + token)
      console.log('http://localhost:7001/confirm/'+token)

      sendSMS(phone, 'To continue logging on to the service, visit ' + process.env.BASE_URL + '/confirm/'+token + '. If you did not try logging on, reply NO')

      bus.on('auth:'+token, function () {
        cleanup()
        res.setHeader('content-type','application/json')
        res.end(JSON.stringify({disposition: 'ok'}))
      })
    })


  }))
  .on('error', function (e) {
    res.statusCode = 500
    res.end('error')
    console.error(e)
  })
}

function confirm(req, res) {
  var token = req.url.substr('/confirm/'.length)
  bus.emit('auth:'+token)
  res.end('confirmed')
}

var phonePattern = /^[0-9]{10}$/
function parsePhone(phone) {
  if (phonePattern.test(phone)) {
    return phone
  }
  return false
}

function makeRandomToken(cb) {
  crypto.randomBytes(1024, function (err, bytes) {
    if (err) { return cb(err) }
    var hash = crypto.createHash('sha1')
    hash.update(bytes)
    cb(null, hash.digest('hex'))
  })
}

function sendSMS(phone, message) {
  twilio.messages.create({
    body: message,
    to: '+1'+phone,
    from: process.env.TWILIO_FROM
  })
}