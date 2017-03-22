/**
 * Example 01 - A basic plot
 *
 * Summary:
 *
 * - use of having the D3 library:
 *       - fetching data
 *       - DOM manipulation
 *       - data handling e.g. d3.range
 *       - dataviz calc tools
 *
 * - basic responsivity: fill width
 *
 * - Plotly.plot arguments
 *
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
        // bar chart:
        type: 'bar',
        width: 0.61803398875,

        /*
         // line and/or scatter plot:
         type: 'scatter',
         mode: 'lines+markers',
        */

        x: buckets.map(function(d) {return d.val;}),
        y: buckets.map(function(d) {return d.count;})
      }
    ],

    // third argument: overall layout
    // https://plot.ly/javascript/configuration-options/
    {
      // width: 800,
      title: 'Number of firms employing at least 20 electricians, by county, Norway'
    },

    // fourth argument: configuration
    // https://plot.ly/javascript/configuration-options/
    {
      displayModeBar: false
    }

  );

}