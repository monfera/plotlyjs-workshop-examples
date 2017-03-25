/**
 * Example 07 - Restyle
 *
 * Summary:
 *   - restyle vs newPlot
 *
 *  Links:
 *    - https://plot.ly/javascript/plotlyjs-function-reference/#plotlyrestyle
 */

var d3 = Plotly.d3;

var cartesianContainer = d3.select('body')
  .append('div')
  .style('float', 'left');

var piechartContainer = d3.select('body')
  .append('div')
  .style('float', 'left');

var geoContainer = d3.select('body')
  .append('div')
  .style('float', 'left');

var palette = d3.scale.category20();

d3.json('/mocks/payload01.json', render.bind(null, cartesianContainer, piechartContainer));

var gr = 0.61803398875;

var selectedCounty = 'Troms';

function barData(buckets, selectedCounty) {

  var tickText = tickTextMaker(selectedCounty);

  return [
    {
      type: 'bar',
      name: 'Baseline',
      width: 0.45 * gr,

      marker: {color: buckets.map(function(d) {
        return d.val === selectedCounty ? 'rgba(0, 0, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';
      })},

      x: buckets.map(tickText),
      y: buckets.map(baselineCount)
    },
    {
      type: 'bar',
      name: 'Current',
      width: 0.45 * gr,

      marker: {color: buckets.map(function(d) {
        return d.val === selectedCounty ? 'rgba(0, 0, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)';
      })},

      x: buckets.map(tickText),
      y: buckets.map(function(d) {return d.count * 0.85;})
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
      y: buckets.map(function(d) {return d.count * 0.5;})
    }

  ];
}

function barLayout(buckets, selectedCounty) {

  var cleanSelectedCounty = clear(selectedCounty);

  return {
    height: 450,
    width: 1200,

    title: '<b>Candidate firms for traineeships in the electrician profession by county</b>',
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
        x: emphasize(cleanSelectedCounty),
        y: buckets[buckets.map(dataNameAccessor).indexOf(cleanSelectedCounty)].count,
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

  };
}

function pieData(buckets, selectedCounty) {

  return [
    {
      type: 'pie',

      hole: gr,
      direction: 'clockwise',

      textinfo: 'label',

      marker: {
        colors: buckets.map(function(d, i) {
          var rgb = d.val === selectedCounty ? d3.rgb("blue") : d3.rgb(palette(i));
          rgb.a = d.val === selectedCounty ? 0.4 : 0.3;
          return rgb;
        })
      },

      labels: buckets.map(tickTextMaker(selectedCounty)),
      values: buckets.map(baselineCount)
    }

  ];
}

function pieLayout() {

  return {
    height: 540,
    width: 680,

    margin: {t: 0, l: 150},

    font: { family: 'Arial, sans-serif' }
  };
}

function geoData() {
  return [{
    type: 'scattermapbox',
    lat: 46,
    lon: -74
  }];
}

function geoLayout(geojson, buckets, selectedCounty) {

  var countyNames = buckets.map(function(d) {return d.val;});
  var countyFeatures = geojson.features.filter(function(d) {return countyNames.indexOf(geojsonNameAccessor(d)) !== -1;});
  var counts = buckets.map(function(d) {return d.count || 0});
  var colorScale = d3.scale.linear().domain(d3.extent(counts.concat([0])));
  var palette =  d3.interpolateLab("white", "black");

  var layers = countyFeatures.map(function(d) {
    var name = geojsonNameAccessor(d);
    var bucketIndex = countyNames.indexOf(name);
    var count = bucketIndex === -1 ? 0 : counts[bucketIndex];
    return {
      sourcetype: 'geojson',
      source: d,
      type: 'fill',
      fill: {
        outlinecolor: name === selectedCounty ? 'blue' : '#444'
      },
      color: palette(colorScale(count))
    };
  });

  return {
    height: 600,
    width: 612 - 80,
    margin: {t: 0, l: 0},
    mapbox: {
      center: {
        lat: 65.35,
        lon: 17.8
      },
      style: 'light',
      zoom: 3.5,
      layers: layers
    }
  };
}


function renderBarchart(barRoot, pieRoot, buckets, selectedCounty) {
  Plotly.newPlot(
    barRoot,
    barData(buckets, selectedCounty),
    barLayout(buckets, selectedCounty)
  );
  barRoot.on('plotly_click', barClickEventHandlerMaker(barRoot, pieRoot, buckets));
}

function renderPiechart(barRoot, pieRoot, buckets, selectedCounty) {
  Plotly.newPlot(
    pieRoot,
    pieData(buckets, selectedCounty),
    pieLayout()
  );
  pieRoot.on('plotly_click', pieClickEventHandlerMaker(barRoot, pieRoot, buckets));
}

function updatePiechart(barRoot, pieRoot, buckets, selectedCounty) {
  var data = pieData(buckets, selectedCounty);
  Plotly.restyle(
    pieRoot,
    {labels: data.map(function(d) {return d.labels;})}
  );
}

function renderGeo(root, geojson, buckets, selectedCounty) {
  Plotly.newPlot(
    root,
    geoData(),
    geoLayout(geojson, buckets, selectedCounty),
    { mapboxAccessToken: 'pk.eyJ1IjoiY2hyaWRkeXAiLCJhIjoiRy1GV1FoNCJ9.yUPu7qwD_Eqf_gKNzDrrCQ' }
  );
}

function barClickEventHandlerMaker(barRoot, pieRoot, buckets) {
  return function (d) {
    var county = clear(d.points[0].x);
    renderBarchart(barRoot, pieRoot, buckets, county);
    updatePiechart(barRoot, pieRoot, buckets, county);
  }
}

function pieClickEventHandlerMaker(barRoot, pieRoot, buckets) {
  return function (d) {
    var county = clear(d.points[0].label);
    renderBarchart(barRoot, pieRoot, buckets, county);
    updatePiechart(barRoot, pieRoot, buckets, county);
  }
}

function render(cartesianContainer, piechartContainer, payload) {

  var buckets = payload.facets.potential_companies_per_state.buckets;

  renderBarchart(cartesianContainer.node(), piechartContainer.node(), buckets, selectedCounty);
  renderPiechart(cartesianContainer.node(), piechartContainer.node(), buckets, selectedCounty);

  if(false)
    Plotly.d3.json(['mocks/norwayCountiesOriginal.json', 'mocks/norwayMunicipalities.json'][1], function(geojson) {
      renderGeo(geoContainer.node(), geojson, buckets, selectedCounty);
    });

  piechartContainer.select('svg')
    .style('overflow', 'visible');

  // Dev / Debug only!!! Don't use in published code
  // make SVG leaf node elements easily selectable
  // Plotly.d3.selectAll('*').style('pointer-events', 'painted');
  // Plotly.d3.selectAll('svg, g').style('pointer-events', 'none');
}

function baselineCount(d) {return d.count;}
function geojsonNameAccessor(d) {return d.properties.name || d.properties.navn;}
function dataNameAccessor(d) {return d.val;}
function tickTextMaker(selectedCounty) {
  return function(d) {
    return d.val === selectedCounty ? emphasize(d.val) : d.val;
  }
}
function emphasize(text) {
  return '<em><b>' + text + '</b></em>';
}
function clear(text) {
  return text.replace(/(<([^>]+)>)/ig, '');
}