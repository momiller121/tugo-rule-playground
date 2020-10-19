'use strict';

const Path = require('path');
const { setWorldConstructor } = require('cucumber');
const AwesomeProduct = require('../../lib');

class CustomWorld {

    constructor() {

        this.api = new AwesomeProduct({ airports: require(Path.join(__dirname, '..', '..', 'test', 'fixtures', 'airports.json')) });
    }

    async readyApiForTesting() {

        await this.api.init();
    }

    isApiReady() {

        return (this.api.server) ? true : false;
    }
}

setWorldConstructor(CustomWorld);
