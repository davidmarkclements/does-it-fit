# does-it-fit

Determine whether an HTTP endpoint's TCP response fits within minimum constraints

## Example

```js
const dif = require('does-it-fit')

dif('http://google.com', function (err, answer) {
  if (err) { 
    console.error('oh noes!', err)
    return
  }
  console.log(answer)
})
```

## API

### `require('does-it-fit') => (url, opts, cb(err, result))`

#### `opts`

##### `constraints`
Array of bytes - index of each matches labels
Default: `[536, 1024, 14336, 66560]`

##### `labels` 
Array of labels matching byte windows, 
Default: `['First TCP Segment', 'First Ethernet Packet', 'First TCP Roundtrip', 'First TCP Frame']`

##### `ssl`
Add SSL overhead (default: true)

##### `gzip` 
GZIP the body (default: true)

##### `sslCost`
Estimated amount of bytes for SSL overhead (default: 40)

##### `gzipLevel`
Compression level: 1-9. Defaults to Node's default gzip level


#### `result`

##### `total` 
Total estimated bytes sent along TCP connection for endpoint

##### `fits`
Relevant TCP constraint (First TCP Segment, First Ethernet Packet, First TCP Roundtrip, First 
TCP Frame or No target TCP constraints)

##### `headers` 
Size of headers

##### `body`
Size of body (after gzipping, if enabled)

##### `emulatedSslSize`
Estimated size of SSL overhead (as set by `sslCost`)

##### `emulateGzip` 
Whether GZIP was emulated (disabled with `noGzip`)

##### `gzipLevel`
The compression level applied, only added if `emulateGzip` is `true`

## CLI

```sh
npm install -g does-it-fit
```

```sh
does-it-fit http://google.com
```

```
-h              Help/Usage

-a              Show all values (instead of just total size and what it fits)

--constraints   Array of bytes (as quoted JSON) - index of each matches labels
                Default: [536, 1024, 14336, 66560]

--labels        Array of labels (as quoted JSON) matching byte windows, Default:
                [ 'First TCP Segment', 'First Ethernet Packet', 
                  'First TCP Roundtrip', 'First TCP Frame' ]

--no-ssl        Don't add SSL overhead

--no-gzip       Don't GZIP the body

--ssl-cost      Estimated amount of bytes for SSL overhead (default: 40)

--gzip-level    Compression level: 1-9. Defaults to Node's default gzip level
```

## Test

```sh
npm test
```

## Acknowledgements

* [Yoshua Wuyts](https://github.com/yoshuawuyts)
* Sponsored by [nearForm](http://nearform.com)

## License

MIT