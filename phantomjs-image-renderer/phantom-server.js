/*
  Uses phantomjs for this PoC to offer a REST endpoint to render HTML to PNG
*/

// This file will be called by phantomjs, not node.
// Not sure about the state of support for ES6 so this uses e.g. var instead of const/let

// uses https://www.npmjs.com/package/phantomjs-prebuilt
// run: phantomjs phantom-server.js

// eslint-disable-next-line import/no-unresolved
const server = require('webserver').create();
// eslint-disable-next-line import/no-unresolved
const webpage = require('webpage');
const fs = require('fs');

const port = 8080;

const CSS = fs.read('../node_modules/@elastic/eui/dist/eui_theme_k6_light.css', 'utf8');

var queue = [];

server.listen(port, function (request, response) {
  queue.push({ response: response, html: request.post });
  consumeCapture();
});

console.log('running on port: ', port);

var NUM_PAGES = 10;
var pages = NUM_PAGES;

function consumeCapture() {
  while (queue.length && pages > 0) {
    pages--;
    capture(queue.shift());
  }
}

function capture(data) {
  data.selector = '.content';

  console.log('start', data.selector);

  var page = webpage.create();

  // https://stackoverflow.com/a/11771464/2266116
  page.content = '<html>'
    + '<head><style>' + CSS + '</style></head>'
    + '<body style="width: 800px;"><div class="content" style="padding: 20px; display: inline-block">' + data.html + '</div></body>'
    + '</html>';

  var originalRect = { left: 0, top: 0, width: 500, height: 500 };

  var rect = page.evaluate(function (data) {
    var element = document.querySelector(data.selector);
    if (element) return element.getClientRects()[0];
  }, data);
  console.log('rect', JSON.stringify(rect));

  page.clipRect = rect || originalRect;

  data.response.statusCode = 200;
  data.response.setHeader('Content-Type', 'image/png');
  data.response.setEncoding('binary');
  data.response.write(atob(page.renderBase64()));
  data.response.close();
  console.log('render done');
  page.release();
  pages++;
  consumeCapture();

}
