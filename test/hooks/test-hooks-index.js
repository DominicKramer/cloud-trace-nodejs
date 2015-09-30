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

var assert = require('assert');
var Module = require('module');
var semver = require('semver');
var findModuleVersion = require('../../lib/hooks/index.js').findModuleVersion;

describe('findModuleVersion', function() {
  it('should correctly find package.json for userspace packages', function() {
    var pjson = require('../../package.json');
    assert(semver.satisfies(findModuleVersion('glob', module, Module._load),
        pjson.devDependencies.glob));
  });

  it('should not break for core packages', function() {
    assert(!findModuleVersion('http', module, Module._load));
  });

  it('should work with namespaces', function() {
    assert.equal(findModuleVersion(
        '@google/cloud-diagnostics-common', module, Module._load), '0.2.0');
  });
});
