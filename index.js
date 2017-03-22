/**
 * Example 02 - Multiple traces and textual overlays
 *
 * Summary:
 *
 * Plot types:
 *   - cartesian plots
 *        - line / scatter chart
 *        - bar chart
 *   - more to come later!
 *
 *
 * Interactions, overlays:
 *   - legend
 *        - click - on/off
 *        - double-click - on, and others to become off
 *        - reset
 *   - axis titles
 *   - annotations
 *
 * Fire up the dev server
 *   budo --live --open --host localhost index.js
 *
 * Links:
 *    https://plot.ly/javascript/getting-started/
 *
 */

var Plotly = require('plotly.js');
var d3 = Plotly.d3; // no need to bundle d3 separately; d3 is useful for glue

var container = d3.select('body')
  .append('div')
  .attr('id', 'myGraph');

d3.json('/mocks/payload01.json', render.bind(null, container)); // or CORS-enabled address

var gr = 0.61803398875;

function render(container, payload) {

  var buckets = payload.facets.potential_companies_per_state.buckets;


  // https://plot.ly/javascript/plotlyjs-function-reference/
  Plotly.plot(

    // first argument: DIV container object or DIV id string
    container.node(), // 'myGraph',

    // second argument: array of trace objects
    // https://plot.ly/javascript/reference/
    [
      {
        type: 'bar',
        name: 'Baseline',
        width: 2 * gr / 5,

        x: buckets.map(function(d) {return d.val;}),
        y: buckets.map(function(d) {return d.count;})
      },
      {
        type: 'bar',
        name: 'Current',
        width: 2 * gr / 5,

        x: buckets.map(function(d) {return d.val;}),
        y: buckets.map(function(d) {return d.count * (0.25 + 0.75 * Math.random());})
      },
      {
        type: 'scatter', // `scatter` is the default
        name: 'Historical average',
        mode: 'lines+markers', // `lines` is the default

        x: buckets.map(function(d) {return d.val;}),
        y: buckets.map(function(d) {return d.count * Math.random();})
      }

    ],

    // third argument: overall layout
    // https://plot.ly/javascript/configuration-options/
    {
      width: 800,
      title: 'Number of firms employing at least 20 electricians, by county, Norway',

      // legend: https://plot.ly/javascript/legend/#styling-and-coloring-the-legend
      showlegend: true, // the default
      legend: {
        x: 0.75,
        y: 0.9
      },
      xaxis: {
        title: 'County'
      },
      yaxis: {
        title: 'Number of firms'
      }
    },

    // fourth argument: configuration
    // https://plot.ly/javascript/configuration-options/
    {
      displayModeBar: true // always on
    }

  );

}