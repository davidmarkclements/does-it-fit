const net = require('net')
const zlib = require('zlib')
const test = require('tap').test
const dif = require('../')

const body = 'Nobody exists on purpose, nobody belongs anywhere everybody\'s gonna die. Come watch TV. Mrs.Sullivan always planned to leave everything to her cats. But sometimes, plans need a helping paw. What are the kitties to do, but buckle together and work as a team. Mrs. Sullivan, I, uh please forgive me for being forward. But your eyes are so beautiful! Wait, this is an actual movie? This fall sparks will fly! Mrs Oh Sullivan Between one guy, who can\'t get a break There\'s something about you, Mrs. Sullivan. and 9 cats who break all the rules. Last Will and Testa-meow: Weekend at Dead Cat Lady\'s House 2. Well, somebody in Hollywood just lost their job.'
// setting very high content length avoids http parser error, and proves does-it-fit doesn't rely on content-length header
const headers = 'HTTP/1.1 200 OK\r\nDate: Sat, 20 Aug 2016 20:38:11 GMT\r\nConnection: close\r\nContent-Length: ' + body.length + '\r\n\r\n'
const rawTotal = headers.length + body.length

const server = net.createServer(function (socket) {
  socket.end(headers + body)
}).listen(0, function () {
  const url = 'http://localhost:' + server.address().port
  test('header length and body length - no gzip, no ssl', function (t) {
    dif(url, {gzip: false, ssl: false}, function (err, answer) {
      t.error(err)
      t.is(answer.headers, headers.length, 'correct headers length')
      t.is(answer.body, body.length, 'correct body length')
      t.is(answer.total, rawTotal, 'correct total')
      t.end()
    })
  })

  test('ssl overhead default', function (t) {
    dif(url, {gzip: false}, function (err, answer) {
      t.error(err)
      t.is(answer.total, rawTotal + answer.emulatedSslSize, 'ssl cost factored in')
      t.end()
    })
  })

  test('set ssl overhead', function (t) {
    dif(url, {gzip: false, sslCost: 80}, function (err, answer) {
      t.error(err)
      t.is(answer.total, rawTotal + 80, 'correct ssl cost factored in')
      t.is(answer.emulatedSslSize, 80, 'ssl cost reflected back')
      t.end()
    })
  })

  test('gzipping default level', function (t) {
    dif(url, function (err, answer) {
      t.error(err)
      const gzipBody = zlib.gzipSync(body)
      t.is(answer.body, gzipBody.length, 'correct gzip body length')
      t.is(answer.total, headers.length + gzipBody.length + answer.emulatedSslSize, 'correct total given gzip and ssl overhead')
      t.end()
    })
  })

  test('set gzipping level', function (t) {
    dif(url, {gzipLevel: 1}, function (err, answer) {
      t.error(err)
      const gzipBody = zlib.gzipSync(body, {level: 1})
      t.is(answer.body, gzipBody.length, 'correct gzipped body length')
      t.is(answer.total, headers.length + gzipBody.length + answer.emulatedSslSize, 'correct total given gzip level and ssl overhead')
      dif(url, {gzipLevel: 9}, function (err, answer) {
        t.error(err)
        const gzipBody = zlib.gzipSync(body, {level: 9})
        t.is(answer.body, gzipBody.length, 'correct gzipped body length')
        t.is(answer.total, headers.length + gzipBody.length + answer.emulatedSslSize, 'correct total given gzip level and ssl overhead')
        t.end()
      })
    })
  })

  test('first constraint label check', function (t) {
    const server = net.createServer(function (socket) {
      socket.end(headers + 'abc')
    }).listen(0, function () {
      dif('http://localhost:' + server.address().port, function (err, answer) {
        t.error(err)
        t.is(answer.fits, 'First TCP Segment', 'total size matches correct label')
        server.close()
        t.end()
      })
    }).unref()
  })

  test('second constraint label check', function (t) {
    const server = net.createServer(function (socket) {
      socket.end(headers + body)
    }).listen(0, function () {
      dif('http://localhost:' + server.address().port, function (err, answer) {
        t.error(err)
        t.is(answer.fits, 'First Ethernet Packet', 'total size matches correct label')
        server.close()
        t.end()
      })
    }).unref()
  })

  // two constraint should be enough - third and fourth are arduous to generate

  test('custom labels', function (t) {
    dif(url, {labels: ['a', 'b']}, function (err, answer) {
      t.error(err)
      t.is(answer.fits, 'b', 'total size matches correct custom label')
      t.end()
    })
  })

  test('custom constraints', function (t) {
    dif(url, {constraints: [1024, 2048]}, function (err, answer) {
      t.error(err)
      t.is(answer.fits, 'First TCP Segment', 'total size matches correct label according to custom constraint')
      t.end()
    })
  })

  test('error handling', function (t) {
    dif('http://not.a.thing:9999', function (err, answer) {
      t.ok(err, 'should recognize http errors')
      t.end()
    })
  })
}).unref()
