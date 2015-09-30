/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var common = require('./common.js');

var assert = require('assert');
var hapi = require('./fixtures/hapi8');

var server;

describe('test-trace-hapi', function() {
  afterEach(function() {
    common.cleanTraces();
    server.stop();
  });

  it('should accurately measure get time, get', function(done) {
    server = new hapi.Server();
    server.connection({ port: common.serverPort });
    server.route({
      method: 'GET',
      path: '/',
      handler: function(req, reply) {
        setTimeout(function() {
          reply(common.serverRes);
        }, common.serverWait);
      }
    });
    server.start(function() {
      common.doRequest('GET', done, hapiPredicate);
    });
  });

  it('should accurately measure get time, post', function(done) {
    server = new hapi.Server();
    server.connection({ port: common.serverPort });
    server.route({
      method: 'POST',
      path: '/',
      handler: function(req, reply) {
        setTimeout(function() {
          reply(common.serverRes);
        }, common.serverWait);
      }
    });
    server.start(function() {
      common.doRequest('POST', done, hapiPredicate);
    });
  });

  it('should accurately measure get time, custom handlers', function(done) {
    server = new hapi.Server();
    server.connection({ port: common.serverPort });
    server.handler('custom', function(route, options) {
      return function(requeset, reply) {
        setTimeout(function() {
          reply(options.val);
        }, common.serverWait);
      };
    });
    server.route({
      method: 'GET',
      path: '/',
      handler: { custom: { val: common.serverRes } }
    });
    server.start(function() {
      common.doRequest('GET', done, hapiPredicate);
    });
  });

  it('should accurately measure get time, custom plugin', function(done) {
    var plugin = function(server, options, next) {
      server.route({
        method: 'GET',
        path: '/',
        handler: function(req, reply) {
          setTimeout(function() {
            reply(common.serverRes);
          }, common.serverWait);
        }
      });
      return next();
    };
    plugin.attributes = {
      name: 'plugin',
      version: '1.0.0'
    };
    server = new hapi.Server();
    server.connection({ port: common.serverPort });
    server.register({
      register: plugin,
      options : {}
    }, function(err) {
      assert(!err);
      server.start(function() {
        common.doRequest('GET', done, hapiPredicate);
      });
    });
  });

  it('should accurately measure get time, after + get', function(done) {
    var afterSuccess = false;
    server = new hapi.Server();
    server.connection({ port: common.serverPort });
    server.after(function(server, next) {
      afterSuccess = true;
      next();
    });
    server.route({
      method: 'GET',
      path: '/',
      handler: function(req, reply) {
        setTimeout(function() {
          reply(common.serverRes);
        }, common.serverWait);
      }
    });
    server.start(function() {
      assert(afterSuccess);
      common.doRequest('GET', done, hapiPredicate);
    });
  });

  it('should accurately measure get time, extension + get', function(done) {
    var extensionSuccess = false;
    server = new hapi.Server();
    server.connection({ port: common.serverPort });
    server.ext('onRequest', function(request, reply) {
      setTimeout(function() {
        extensionSuccess = true;
        return reply.continue();
      }, common.serverWait / 2);
    });
    server.route({
      method: 'GET',
      path: '/',
      handler: function(req, reply) {
        setTimeout(function() {
          reply(common.serverRes);
        }, common.serverWait / 2);
      }
    });
    server.start(function() {
      var cb = function() {
        assert(extensionSuccess);
        done();
      };
      common.doRequest('GET', cb, hapiPredicate);
    });
  });
});

function hapiPredicate(span) {
  return span.name === '/';
}
