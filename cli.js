#!/usr/bin/env node
const dif = require('./')
const args = require('minimist')(process.argv.slice(2))
console.log(args)

if (args.h || args.help) {
  console.log(require('fs').readFileSync('./usage.txt') + '')
  process.exit()
}

if (args.labels) {
  try {
    args.labels = JSON.parse(args.labels)
  } catch (e) {
    console.warn('Unable to parse labels arg')
  }
}

if (args.constraints) {
  try {
    args.constraints = JSON.parse(args.constraints)
  } catch (e) {
    console.warn('Unable to parse constraints arg')
  }
}

dif(args._[0], args, function (err, answer) {
  if (err) {
    console.error(err)
    return
  }
  if (args.a) {
    console.log(answer)
    return
  }
  console.log('Size: %dB\nFits: %s', answer.total, answer.fits)
})
