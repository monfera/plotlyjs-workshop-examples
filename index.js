/**
 * Example 04 - Multiple plots
 *
 * Summary:
 *
 * - Pie in subplot (1st commit)
 * - Pie in separate plot
 * - Control overflow (for the benefit of pie texts)
 * - Generating a color palette; color manipulation
 * - Pie chart in general
 *
 */

var d3 = Plotly.d3;

var cartesianContainer = d3.select('body')
  .append('div')
  .style('float', 'left');

var piechartContainer = d3.select('body')
  .append('div')
  .style('float', 'left');

var palette = d3.scale.category20();

d3.json('/mocks/payload01.json', render.bind(null, cartesianContainer, piechartContainer));

var gr = 0.61803398875;

function render(cartesianContainer, piechartContainer, payload) {

  var buckets = payload.facets.potential_companies_per_state.buckets;

  Plotly.plot(

    cartesianContainer.node(),

    [
      {
        type: 'bar',
        name: 'Baseline',
        width: 0.45 * gr,

        marker: {color: buckets.map(function(d) {
          return d.val === 'Troms' ? 'rgba(0, 0, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';
        })},

        x: buckets.map(tickText),
        y: buckets.map(baselineCount)
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

    {
      height: 450,
      width: 768,

      margin: {r: 0},

      title: '<b>Number of firms employing at least 20 electricians<br>by county, Norway</b>',
      titlefont: {
        family: 'Times New Roman, serif',
        color: 'rgb(95, 95, 95)',
        size: 24
      },

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
        },
        domain: [0, 1]
      },
      yaxis: { title: 'Number of firms' },

      font: { family: 'Arial, sans-serif' },

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

    }
  );

  Plotly.plot(

    piechartContainer.node(),

    [
       {
        type: 'pie',
        name: 'Baseline',

        hole: gr,
        direction: 'clockwise',

        textinfo: 'label',

        marker: {
          colors: buckets.map(function(d, i) {
            var rgb = d3.rgb(palette(i));
            rgb.a = 0.3;
            return rgb;
          })
        },

        labels: buckets.map(tickText),
        values: buckets.map(baselineCount)
      }

    ],

    {
      height: 450,
      width: 520,

      margin: {l: 20, t: 130},

      font: { family: 'Arial, sans-serif' }
    }
  );

  piechartContainer.select('svg')
    .style('overflow', 'visible');

  // Dev / Debug only!!! Don't use in published code
  // make SVG leaf node elements easily selectable
  //Plotly.d3.selectAll('*').style('pointer-events', 'painted');
  //Plotly.d3.selectAll('svg, g').style('pointer-events', 'none');
}

function tickText(d) {return d.val === 'Troms' ? '<em><b>' + d.val + '</b></em>' : d.val;}
function baselineCount(d) {return d.count;}