/**
 * Example 05 - Custom choropleth with MapBox
 *
 * Summary:
 *   - mapbox
 *   - mapbox based choropleth
 *   - callback hell w/ multiple async inputs
 *   - GeoJSON
 *   - command line cartography by Mike Bostock
 *      - ndjson
 *      - joining carto features with data(?)
 *      - modifying properties
 *      - lowering resolution
 *      - TopoJSON payload or GeoJSON?
 *
 *  Links:
 *    - Maps: https://plot.ly/javascript/#maps
 *    - Mapbox example: https://plot.ly/javascript/choropleth-maps/#choropleth-map-of-florida-counties-colored-by-political-party
 *    - Mapbox reference: https://plot.ly/javascript/reference/#scattermapbox
 *    - Command line cartography: https://medium.com/@mbostock/command-line-cartography-part-1-897aa8f8ca2c#.eo0p0c8nm
 */

var d3 = Plotly.d3;

var cartesianContainer = d3.select('body')
  .append('div')
  //.style('float', 'left');

var piechartContainer = d3.select('body')
  .append('div')
  .style('float', 'left');

var mapContainer = d3.select('body')
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
      width: 1200,

      title: '<b>Number of firms employing electricians by county, Norway</b>',
      titlefont: {
        family: 'Times New Roman, serif',
        color: 'rgb(95, 95, 95)',
        size: 24
      },

      showlegend: true, // the default

      legend: {
        x: 0.8,
        y: 0.9
      },

      xaxis: {
        title: '<b>County</b>',
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
      height: 540,
      width: 600,

      margin: {t: 0, l: 150},

      font: { family: 'Arial, sans-serif' }
    }
  );

  piechartContainer.select('svg')
    .style('overflow', 'visible');

  Plotly.d3.json(['mocks/norwayCountiesOriginal.json', 'mocks/norwayMunicipalities.json'][1], function(geojson) {

    var countyNames = buckets.map(function(d) {return d.val;});
    var countyFeatures = geojson.features.filter(function(d) {return countyNames.indexOf(nameAccessor(d)) !== -1;});
    var counts = buckets.map(function(d) {return d.count || 0});
    var colorScale = d3.scale.linear().domain(d3.extent(counts.concat([0])));
    var palette =  d3.interpolateLab("white", "black");

    var layers = countyFeatures.map(function(d) {
      var name = nameAccessor(d);
      var bucketIndex = countyNames.indexOf(name);
      var count = bucketIndex === -1 ? 0 : counts[bucketIndex];
      return {
        sourcetype: 'geojson',
        source: d,
        type: 'fill',
        fill: {
          outlinecolor: name === 'Troms' ? 'blue' : '#444'
        },
        color: palette(colorScale(count))
      }
    })

    Plotly.plot(

      mapContainer.node(),

      [{
        type: 'scattermapbox',
        lat: [46],
        lon: [-74]
      }],

      {
        height: 600,
        width: 612,
        margin: {t: 0},
        mapbox: {
          center: {
            lat: 65.35,
            lon: 17.8
          },
          style: 'light',
          zoom: 3.5,
          layers: layers
        }
      },

      {
        mapboxAccessToken: 'pk.eyJ1IjoiY2hyaWRkeXAiLCJhIjoiRy1GV1FoNCJ9.yUPu7qwD_Eqf_gKNzDrrCQ'
      }
    );


  });

  // Dev / Debug only!!! Don't use in published code
  // make SVG leaf node elements easily selectable
  //Plotly.d3.selectAll('*').style('pointer-events', 'painted');
  //Plotly.d3.selectAll('svg, g').style('pointer-events', 'none');
}



function tickText(d) {return d.val === 'Troms' ? '<em><b>' + d.val + '</b></em>' : d.val;}
function baselineCount(d) {return d.count;}
function nameAccessor(d) {
  return d.properties.name || d.properties.navn;
}
