/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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

var assert = require('assert');

describe('generic-pool', function() {
  var agent;
  var genericPool;
  before(function() {
    agent = require('../..').start();
    genericPool = require('./fixtures/generic-pool-3');
  });

  it ('preserves context', function() {
    var childSpanName = 'custom-child-span';
    var rootSpanName = 'custom-root-span';

    var factory = {
      create: function() {
        return new Promise(function(resolve, reject) {
          resolve(function() {
            agent.runInSpan(childSpanName, function() {
            });
          });
        });
      },

      destroy: function(fn) {
        return new Promise(function(resolve) {
          resolve();
        });
      }
    };

    var opts = {
      max: 1,
      min: 1
    };

    var pool = genericPool.createPool(factory, opts);

    var promise;
    agent.runInRootSpan(rootSpanName, {}, function() {
      promise = pool.acquire().then(function(fn) {
        fn();
      }).then(function() {
        var trace = agent.private_().traceWriter.buffer_[0];
        assert.strictEqual(JSON.parse(trace).spans.length, 2);
      });
    });

    return promise;
  });
});
