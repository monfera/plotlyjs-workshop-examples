/**
 * Example 00 - Setting up the dev environment
 *
 * Summary:
 *
 * - test server setup
 * - accessing the plotly.js library
 *
 * One time global install for the dev server:
 *   npm install -g budo
 *
 * Add plotly
 *   either as a static, on-premise hosted script or from CDN:
 *       https://cdn.plot.ly/plotly-latest.min.js
 *       https://cdn.plot.ly/plotly-1.23.0.min.js
 *   or: npm install -S plotly.js
 *   or global: npm install -g plotly.js
 *
 * Initialize package and repo
 *   npm init -y
 *   git init; git add *
 *
 * Then fire up the dev server
 *   budo --live --open --host localhost index.js
 *
 * Links:
 *    https://plot.ly/javascript/getting-started/
 *
 */

var Plotly = require('plotly.js');

Plotly.plot('myGraph', [{y: [5, 2, 6, 7, 1, 9, 4, 3]}], {title: 'Example 00'});