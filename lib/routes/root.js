'use strict';

const Path = require('path');
const Package = require('../../package');

const helloRoute = {
    name: `${Package.name}_route_root`,
    version: Package.version,
    register: async function (server, options) {

        await server.route({
            method: 'GET',
            path: '/',
            options: {
                handler: require(Path.join(__dirname, '..', 'handlers', Path.basename(__filename)))
            }
        });
    }
};

module.exports = helloRoute;
