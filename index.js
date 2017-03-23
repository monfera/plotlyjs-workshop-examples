/**
 * Example 05 - Custom choropleth with MapBox
 *
 * Summary:
 *   - mapbox
 *   - mapbox based choropleth
 *   - callback hell w/ multiple async inputs
 *   - GeoJSON
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
      width: 1000,

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
      height: 520,
      width: 520,

      margin: {t: 0, l: 150},

      font: { family: 'Arial, sans-serif' }
    }
  );

  piechartContainer.select('svg')
    .style('overflow', 'visible');

  Plotly.d3.json('mocks/norwayMunicipalities.json', function(bluejson) {

    var countyNames = buckets.map(function(d) {return d.val;});
    var countyFeatures = bluejson.features.filter(function(d) {return countyNames.indexOf(d.properties.name) !== -1;});
    countyFeatures.forEach(function(d) {d.properties.groupOne = Math.random() < 0.5;})
    var countyFeatureCollection1 = {
      type: "FeatureCollection",
      features: countyFeatures.filter(function(d) {return d.properties.groupOne && d.properties.name !== 'Troms';})
    }
    var countyFeatureCollection2 = {
      type: "FeatureCollection",
      features: countyFeatures.filter(function(d) {return !d.properties.groupOne && d.properties.name !== 'Troms';})
    }
    var countyFeatureCollection3 = {
      type: "FeatureCollection",
      features: countyFeatures.filter(function(d) {return d.properties.groupOne && d.properties.name === 'Troms';})
    }
    var countyFeatureCollection4 = {
      type: "FeatureCollection",
      features: countyFeatures.filter(function(d) {return !d.properties.groupOne && d.properties.name === 'Troms';})
    }

    Plotly.plot(

      mapContainer.node(),

      [{
        type: 'scattermapbox',
        lat: [46],
        lon: [-74]
      }],

      {
        height: 500,
        width: 510,
        margin: {t: 0},
        mapbox: {
          center: {
            lat: 65.35,
            lon: 17.8
          },
          style: 'light',
          zoom: 3.2,
          layers: [
            {
              sourcetype: 'geojson',
              source: countyFeatureCollection1,
              type: 'fill',
              color: 'grey'
            },
            {
              sourcetype: 'geojson',
              source: countyFeatureCollection2,
              type: 'fill',
              color: 'white'
            },
            {
              sourcetype: 'geojson',
              source: countyFeatureCollection3,
              type: 'fill',
              color: 'blue'
            },
            {
              sourcetype: 'geojson',
              source: countyFeatureCollection4,
              type: 'fill',
              color: 'lightblue'
            }
          ]
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