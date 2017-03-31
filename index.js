var d3 = Plotly.d3;
var $ = flyd.stream;
var _ = require('./lift.js');

var countyGeoContainer = d3.select('body')
  .append('div')
  .style('width', '800px')
  .style('background-color', 'rgba(0,0,0,0.05)')
  .style('height', '920px')
  .style('float', 'left');

var muniCartesianContainer = d3.select('body')
  .append('div')
  .style('position', 'absolute')
  .style('border', '1px solid grey')
  .style('left', '2px')
  .style('width', '200px')
  .style('height', '450px');

var muniGeoContainer = d3.select('body')
  .append('div')
  .style('position', 'absolute')
  .style('left', '396px')
  .style('top', '355px')
  .style('border', '1px solid grey')
  .style('background-color', 'rgba(213,223,255,1)')
  .style('width', '400px')
  .style('height', '580px');

var reset = d3.select('body')
  .attr('id', 'resetSelection')
  .append('p')
  .style('color', 'blue')
  .style('cursor', 'pointer')
  .style('font-size', 'small')
  .text('Reset selection')
  .on('click', resetEventHandler);

var countyCartesianContainer = d3.select('body')
  .append('div')
  .style('position', 'relative')
  .style('top', '-20px')
  .style('float', 'left');

var piechartContainer = d3.select('body')
  .append('div')
  .style('float', 'left');


var palette = d3.scale.category20();

var perCountyBucketPayload$ = $();
var perMunicipalityBucketPayload$ = $();
var perCountyGeojsonPayload$ = $();
var municipalityFeaturesForCounty$ = $();
var perMunicipalityGeojsonPayload$ = $();

d3.json('/mocks/perCountyCounts.json', perCountyBucketPayload$);
d3.json('mocks/fylker.geojson', perCountyGeojsonPayload$);
d3.json('mocks/kommuner.geojson', perMunicipalityGeojsonPayload$);

var perCountyBuckets$ = perCountyBucketPayload$.map(function(payload) {
  return payload.facets.potential_companies_per_state.buckets;
});

var perMunicipalityBuckets$ = perMunicipalityBucketPayload$.map(function(payload) {
  var result = payload ? payload.facets.firms_with_trainees_per_municipality.buckets : null;
  return result;
});

var goldenRatio = 0.61803398875;

var selectedCounty$ = $('Troms');

_(function(selectedCounty) {
  if(selectedCounty) {
    d3.json('./mocks/perMunicipalityCounts/' + selectedCounty + '.json', perMunicipalityBucketPayload$);
  } else {
    perMunicipalityBucketPayload$(null);
  }
})(selectedCounty$);

(function() {
  var prevBuckets;
  _(function(buckets, selectedCounty) {
    if(prevBuckets === buckets) {
      updatePerCountyBarchart(countyCartesianContainer, buckets, selectedCounty);
      updatePiechart(piechartContainer, buckets, selectedCounty);
    } else {
      renderPerCountyBarchart(countyCartesianContainer, buckets, selectedCounty);
      renderPiechart(piechartContainer, buckets, selectedCounty);
      prevBuckets = buckets;
    }
  })(perCountyBuckets$, selectedCounty$);
})();

var perCountyFeatures$ = _(function(geojson, buckets) {
  return geojson ? geoFeatures(geojson.features, buckets) : [];
})(perCountyGeojsonPayload$, perCountyBuckets$);

var perMunicipalityFeatures$ = _(function(geojson, buckets) {
  return buckets && geojson && geojson.length > 0 ? geoFeatures(geojson, buckets) : [];
})(municipalityFeaturesForCounty$, perMunicipalityBuckets$);

_(function(perCountyFeatures, municipalityPayload, selectedCounty) {
  if(selectedCounty) {
    var countyIndex = perCountyFeatures.map(geojsonNameAccessor).indexOf(selectedCounty);
    if(countyIndex === -1) {
      municipalityFeaturesForCounty$([]);
    }
    var county = perCountyFeatures[countyIndex];
    var id = county.properties.fylkesnr;
    var features = municipalityPayload.features
      .filter(function(f) {
        return ('0' + f.properties.komm.toString()).slice(-4).slice(0, 2) === ('0' + id.toString()).slice(-2);
      });
    municipalityFeaturesForCounty$(features);
  } else {
    municipalityFeaturesForCounty$([]);
  }
})(perCountyFeatures$, perMunicipalityGeojsonPayload$, selectedCounty$);

_(function(features, selectedCounty) {
  ensureGeo(countyGeoContainer, features, selectedCounty);
})(perCountyFeatures$, selectedCounty$);

_(function(features, selectedCounty) {
  ensureGeo(muniGeoContainer, features, selectedCounty);
})(perMunicipalityFeatures$, selectedCounty$);

(function() {
  var prevBuckets;
  _(function(buckets, selectedCounty) {
    if(prevBuckets === buckets) {
      renderPerMunicipalityBarchart(muniCartesianContainer, buckets, selectedCounty);
    } else {
      renderPerMunicipalityBarchart(muniCartesianContainer, buckets, selectedCounty);
      prevBuckets = buckets;
    }
  })(perMunicipalityBuckets$, selectedCounty$);
})();


function perCountyBarData(buckets, selectedCounty) {

  var tickText = tickTextMaker(selectedCounty);

  return [
    {
      type: 'bar',
      name: 'Baseline',
      width: 0.45 * goldenRatio,

      marker: {color: buckets.map(function(d) {
        return d.val === selectedCounty ? 'rgba(0, 0, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';
      })},

      x: buckets.map(tickText),
      y: buckets.map(baselineCount)
    },
    {
      type: 'bar',
      name: 'Current',
      width: 0.45 * goldenRatio,

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

function perCountyBarLayout() {

  return {
    height: 400,
    width: 800,

    //margin: {t: 40},

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

function perMunicipalityBarData(inputBuckets) {

  var buckets = inputBuckets.slice().sort(function(a, b) {return a.count - b.count;});
  var tickText = function(d) {
    var text = d.val;
    return text.charAt(0) + text.slice(1).toLowerCase();
  };

  return [
    {
      type: 'bar',
      width: goldenRatio,
      orientation: 'h',

      x: buckets.map(baselineCount),
      y: buckets.map(tickText)
    }
  ];
}

function perMunicipalityBarLayout(selectedCounty) {

  return {
    height: 450,
    width: 200,

    margin: {t: 40, r: 10, b: 40, l: 100},

    title: '<b>' + selectedCounty + '</b>',
    titlefont: {
      family: 'Times New Roman, serif',
      size: 16
    },

    showlegend: false,

    xaxis: {
      domain: [0, 1]
    },

    font: { family: 'Arial, sans-serif' }
  };
}

function pieData(buckets, selectedCounty) {

  return [
    {
      type: 'pie',

      hole: goldenRatio,
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
    height: 490,
    width: 680,

    margin: {t: 20, l: 150, b: 0},

    font: { family: 'Arial, sans-serif' }
  };
}

function geoFeatures(geojson, buckets) {

  var names = buckets.map(function(d) {return d.val.toUpperCase();});
  var features = geojson.filter(function(d) {return names.indexOf(geojsonNameAccessor(d).toUpperCase()) !== -1;});
  var counts = buckets.map(function(d) {return d.count || 0});
  var colorScale = d3.scale.linear().domain(d3.extent(counts.concat([0])));
  var palette =  d3.interpolateLab("white", "black");

  var result = features.map(function(d) {
    var name = geojsonNameAccessor(d);
    var bucketIndex = names.indexOf(name.toUpperCase());
    d.properties.count = bucketIndex === -1 ? 0 : counts[bucketIndex];
    d.properties.color = palette(colorScale(d.properties.count));
    return d;
  });

  return result;
}

function renderPerCountyBarchart(barRoot, buckets, selectedCounty) {
  Plotly.newPlot(
    barRoot.node(),
    perCountyBarData(buckets, selectedCounty),
    perCountyBarLayout()
  );
  barRoot.node().on('plotly_click', barClickEventHandler);
}

function updatePerCountyBarchart(barRoot, buckets, selectedCounty) {
  var data = perCountyBarData(buckets, selectedCounty);
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

function renderPerMunicipalityBarchart(barRoot, buckets, selectedCounty) {
  if(buckets === null || selectedCounty === null) {
    Plotly.purge(barRoot.node());
  } else {
    Plotly.newPlot(
      barRoot.node(),
      perMunicipalityBarData(buckets),
      perMunicipalityBarLayout(selectedCounty),
      {displayModeBar: false}
    );
  }
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

function ensureGeo(root, features, selectedCounty) {

  var width = parseInt(root.style('width'));
  var height = parseInt(root.style('height'));

  var featureCollection = {
    type: 'FeatureCollection',
    features: features
  };

  var valid = features.length > 0;
  var bbox = d3.geo.bounds(featureCollection);

  var boxWidth = bbox[1][0] - bbox[0][0];
  var boxHeight = bbox[1][1] - bbox[0][1];
  var centerX = (bbox[0][0] + bbox[1][0]) / 2;
  var centerY = (bbox[0][1] + bbox[1][1]) / 2;
  var scale = 48 * 0.8 / Math.max(boxWidth / width, boxHeight / height);

  if(valid) {
    var path = d3.geo.path()
      .projection(d3.geo.mercator()
          .center([centerX, centerY])
          .translate([width / 2, height / 2])
          .scale(scale)
      );
  }
  var svg = root.selectAll('svg').data([0]);
  svg.enter().append('svg')
    .attr('width', width)
    .attr('height', height);

  var geoLayer = svg.selectAll('.geoLayer').data([0]);
  geoLayer.enter().append('g')
    .classed('geoLayer', true);

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

  feature.exit()
    .transition()
    .style('opacity', 0)
    .remove();

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