/**
 * Example 03 - Font styling
 *
 * Summary:
 *
 * Font styling for:
 *   - title
 *   - axis title
 *   - legend
 *   -
 **
 * Interactions, overlays:
 *   - dev tip: make glyphs inspectable in Dev tools
 *
 */

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
        width: 0.45 * gr,

        marker: {color: buckets.map(function(d) {
          return d.val === 'Troms' ? 'rgba(0, 0, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';
        })},

        x: buckets.map(tickText),
        y: buckets.map(function(d) {return d.count;})
      },
      {
        type: 'bar',
        name: 'Current',
        width: 0.45 * gr,

        marker: {color: buckets.map(function(d) {
          return d.val === 'Troms' ? 'rgba(0, 0, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)';
        })},

        x: buckets.map(tickText),
        y: buckets.map(function(d) {return d.count * (0.25 + 0.75 * Math.random());})
      },
      {
        type: 'scatter', // `scatter` is the default
        name: 'Historical average',
        mode: 'lines', // `lines` is the default; can use 'lines+markers' etc.

        line: {
          color: 'rgb(223, 63, 191)',
          width: 2
        },

        x: buckets.map(tickText),
        y: buckets.map(function(d) {return d.count * (0.25 + 0.75 * Math.random());})
      }

    ],

    // third argument: overall layout
    // https://plot.ly/javascript/configuration-options/
    {
      width: 800,

      title: '<b>Number of firms employing at least 20 electricians<br>by county, Norway</b>',
      titlefont: {
        family: "Times New Roman, serif",
        color: 'rgb(95, 95, 95)',
        size: 24
      },

      // legend: https://plot.ly/javascript/legend/#styling-and-coloring-the-legend
      showlegend: true, // the default

      legend: {
        x: 0.75,
        y: 0.9
      },

      xaxis: {
        title: '<b>County</b>',
        titlefont: {
          family: 'Courier New, monospace',
          size: 20,
          color: '#5f5f5f'
        }
      },
      yaxis: {
        title: 'Number of firms'
      },

      // global font
      font: {
        family: 'Arial, sans-serif',
        //size: 18,
        //color: '#7f7f7f'
      },

      annotations: [
        {
          x: '<em><b>Troms</b></em>',
          y: 5848,
          xref: 'x',
          yref: 'y',
          text: 'Currently selected',
          arrowcolor: 'rgba(0, 0, 255, 0.4)',
          arrowwidth: 1.5,
          arrowhead: 5,
          showarrow: true,
          ax: 20,
          ay: -40
        }
      ]

    },

    // fourth argument: configuration
    // https://plot.ly/javascript/configuration-options/
    {
      displayModeBar: 'hover' // or boolean
    }

  );

  // Dev / Debug only!!! Don't use in published code
  // make SVG leaf node elements easily selectable
  //Plotly.d3.selectAll('*').style('pointer-events', 'painted');
  //Plotly.d3.selectAll('svg, g').style('pointer-events', 'none');
}

function tickText(d) {return d.val === 'Troms' ? '<em><b>' + d.val + '</b></em>' : d.val;}