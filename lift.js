module.exports = function _(fun) {
  // lift function: turns a regular function into an equivalent function that takes its arguments
  // from streams and outputs a stream. If a new value appears on one of the input streams, it
  // recalculates and emits its output.
  function streamify(fun) {
    return function(/* stream1, stream2, .. , streamN  */) {
      var i
      const streams = Array.prototype.slice.call(arguments)
      const values = []
      const setterIndex = streams.length
      var resultSignal = flyd.combine(function (/*arguments*/) {
        var setter = arguments[setterIndex]
        for (i = 0; i < streams.length; i++) values[i] = streams[i]()
        var valueCandidate = fun.apply(undefined, values)
        setter(valueCandidate)
      }, streams)
      return resultSignal
    }
  }
  var streamified = streamify(fun)
  return streamified;
}
