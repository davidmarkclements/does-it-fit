const http = require('http')
const zlib = require('zlib')
const size = require('size-stream')
const split = require('split2')
const findIndex = require('array-find-index')
const constraints = [536, 1024, 14336, 66560]
const defaultLabels = [
  'First TCP Segment', 'First Ethernet Packet', 'First TCP Roundtrip', 'First TCP Frame'
]

module.exports = function (url, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = null
  }
  opts = opts || {}
  const frames = opts.constraints || constraints
  const labels = opts.labels || defaultLabels
  const emulateSsl = opts.ssl !== false
  const emulateGzip = opts.gzip !== false
  const ssl = opts.sslCost || (emulateSsl ? 40 : 0)
  const level = opts.gzipLevel || -1

  var headerSize

  http.get(url, function (res) {
    const count = size()

    count.once('size', function (bodySize) {
      const total = bodySize + headerSize + ssl
      const index = findIndex(frames, function (bytes) {
        return total <= bytes
      })
      const fits = labels[index]
      const result = {
        total: total,
        fits: fits || 'No target TCP constraints',
        headers: headerSize,
        body: bodySize,
        emulatedSslSize: ssl,
        emulateGzip: emulateGzip
      }
      if (emulateGzip) {
        result.gzipLevel = level === -1 ? 'default' : level
      }
      cb(null, result)
    })

    if (emulateGzip) {
      res.pipe(zlib.createGzip({level: level})).pipe(count)
    } else {
      res.pipe(count)
    }
  }).on('socket', function (socket) {
    socket.pipe(split('\r\n\r\n')).once('data', function (headers) {
      headerSize = Buffer.byteLength(headers) + 4
    })
  }).on('error', cb)
}
