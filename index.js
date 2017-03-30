/**
 * Example 08 - Simple choropleth
 *
 * Summary:
 *   - simple choropleth with D3
 *   - how to add a custom D3 widget
 *   - d3.geo.projection
 *   - D3 general update pattern
 *   - topoJson
 *
 * Links:
 *   - General Update Pattern I, II, III by Mike Bostock
 *   - http://blockbuilder.org/mbostock/8ca036b3505121279daf
 */

var d3 = Plotly.d3;
var $ = flyd.stream;
var _ = require('./lift.js');

var geoContainer = d3.select('body')
  .append('div')
  .style('float', 'left');

var reset = d3.select('body')
  .attr('id', 'resetSelection')
  .append('p')
  .style('color', 'blue')
  .style('cursor', 'pointer')
  .text('Reset selection')
  .on('click', resetEventHandler);

var cartesianContainer = d3.select('body')
  .append('div')
  .style('float', 'left');

var piechartContainer = d3.select('body')
  .append('div')
  .style('float', 'left');


var palette = d3.scale.category20();

var bucketPayload$ = $();
var geojsonPayload$ = $(null);

d3.json('/mocks/payload01.json', bucketPayload$);
d3.json(['mocks/norwayCountiesOriginal.json', 'mocks/norwayMunicipalities.json'][1], geojsonPayload$)

var buckets$ = bucketPayload$.map(function(payload) {
  return payload.facets.potential_companies_per_state.buckets;
});

var gr = 0.61803398875;

var selectedCounty$ = $(null);

(function() {
  var prevBuckets;
  _(function(buckets, selectedCounty) {
    if(prevBuckets === buckets) {
      updateBarchart(cartesianContainer, buckets, selectedCounty);
      updatePiechart(piechartContainer, buckets, selectedCounty);
    } else {
      renderBarchart(cartesianContainer, buckets, selectedCounty);
      renderPiechart(piechartContainer, buckets, selectedCounty);
      prevBuckets = buckets;
    }
  })(buckets$, selectedCounty$);
})();

_(function(buckets, geojson, selectedCounty) {
  ensureGeo(geoContainer, geojson, buckets, selectedCounty);
})(buckets$, geojsonPayload$, selectedCounty$);

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

function barLayout() {

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

    font: { family: 'Arial, sans-serif' }
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

function geoFeatures(geojson, buckets, selectedCounty) {

  var countyNames = buckets.map(function(d) {return d.val;});
  var countyFeatures = geojson.features.filter(function(d) {return countyNames.indexOf(geojsonNameAccessor(d)) !== -1;});
  var counts = buckets.map(function(d) {return d.count || 0});
  var colorScale = d3.scale.linear().domain(d3.extent(counts.concat([0])));
  var palette =  d3.interpolateLab("white", "black");

  var features = countyFeatures.map(function(d) {
    var name = geojsonNameAccessor(d);
    var bucketIndex = countyNames.indexOf(name);
    d.properties.count = bucketIndex === -1 ? 0 : counts[bucketIndex];
    d.properties.color = palette(colorScale(d.properties.count))
    return d;
  });

  return features;
}

function renderBarchart(barRoot, buckets, selectedCounty) {
  Plotly.newPlot(
    barRoot.node(),
    barData(buckets, selectedCounty),
    barLayout()
  );
  barRoot.node().on('plotly_click', barClickEventHandler);
}

function updateBarchart(barRoot, buckets, selectedCounty) {
  var data = barData(buckets, selectedCounty);
  Plotly.restyle(
    barRoot.node(),
    'marker.color',
    data.slice(0, 2).map(function(d) {return d.marker.color;}),
    [0, 1]
  );
  Plotly.restyle(
    barRoot.node(),
    'x',
    data.map(function(d) {return d.x;})
  );
}

function renderPiechart(pieRoot, buckets, selectedCounty) {
  Plotly.newPlot(
    pieRoot.node(),
    pieData(buckets, selectedCounty),
    pieLayout()
  );
  pieRoot.node().on('plotly_click', pieClickEventHandler);
  piechartContainer.select('svg')
    .style('overflow', 'visible');
}

function updatePiechart(pieRoot, buckets, selectedCounty) {
  var data = pieData(buckets, selectedCounty);
  Plotly.restyle(
    pieRoot.node(),
    {labels: data.map(function(d) {return d.labels;})}
  );
  Plotly.restyle(
    pieRoot.node(),
    'marker.colors',
    data.map(function(d) {return d.marker.colors;})
  );
}

function ensureGeo(root, geojson, buckets, selectedCounty) {

  var width = 800;
  var height = 940;
  var path = d3.geo.path().projection(d3.geo.mercator()
    .center([17.8, 65.35])
    .translate([width / 2, height / 2])
    .scale(1700)
  );

  var svg = root.selectAll('svg').data([0]);
  svg.enter().append('svg')
    .attr('width', width)
    .attr('height', height);

  var geoLayer = svg.selectAll('.geoLayer').data([0]);
  geoLayer.enter().append('g')
    .classed('geoLayer', true);

  if(!geojson) {
    return;
  }

  var features = geoFeatures(geojson, buckets, selectedCounty);
  var feature = geoLayer.selectAll('.feature')
    .data(features, geojsonNameAccessor);

  feature.enter().append('path')
    .classed('feature', true)
    .classed('selected', function(d) {return geojsonNameAccessor(d) === selectedCounty;})
    .attr('d', path)
    .style('fill', function(d) {
      return d.properties.color;
    })
    .on('click', geoClickEventHandler);

  geoLayer.selectAll('.feature.selected')
    .classed('selected', false);

  feature
    .filter(function(d) {return geojsonNameAccessor(d) === selectedCounty;})
    .classed('selected', true);
}

function setSelectedCounty(county) {
  if(selectedCounty$() !== county) {
    selectedCounty$(county);
  } else {
    selectedCounty$(null);
  }
}

function barClickEventHandler(d) {
  var county = clear(d.points[0].x);
  setSelectedCounty(county);
}

function resetEventHandler(d) {
  var county = null;
  setSelectedCounty(county);
}

function pieClickEventHandler(d) {
  var county = clear(d.points[0].label);
  setSelectedCounty(county);
}

function geoClickEventHandler(d) {
  var county = geojsonNameAccessor(d);
  setSelectedCounty(county);
}

function baselineCount(d) {return d.count;}
function geojsonNameAccessor(d) {return d.properties.name || d.properties.navn;}
function dataNameAccessor(d) {return d.val;}
function tickTextMaker(selectedCounty) {
  return function(d) {
    return selectedCounty && d.val === selectedCounty ? emphasize(d.val) : d.val;
  }
}
function emphasize(text) {
  return '<em><b>' + text + '</b></em>';
}
function clear(text) {
  return text.replace(/(<([^>]+)>)/ig, '');
}