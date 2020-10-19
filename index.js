'use strict';

const Pino = require('pino');
const Package = require('./package');
const Wreck = require('@hapi/wreck');
const AwesomeProduct = require('./lib');

const bootstrapLogger = Pino({ level: 'info' }).child({ package: Package.name });

let instance;

const bootstrap = async () => {

    try {
        // Before the server lister is opened, we prime it with airports data
        // where each element of the airports object provides timezone and countryCode
        // of the station.
        // ABQ: {
        //   "timezone": "America/Denver",
        //   "countryCode": "US"
        // }
        let ds_airports = await Wreck.get('https://api.westjet.com/destination-service/v1/en-CA/airports?fields=code&fields=countryCode&fields=timezone');
        ds_airports = JSON.parse(ds_airports.payload.toString());
        const airports = ds_airports.airports.reduce((acc, cur) => {

            const copy = Object.assign({}, cur);
            delete copy.code;
            acc[cur.code] = copy;
            return acc;
        }, {});
        bootstrapLogger.info({ airportsCount: Object.keys(airports).length }, 'INFO_AIRPORTS_LOADED');
        instance = new AwesomeProduct({ airports });
        await instance.start();
        bootstrapLogger.info(instance.server.info, 'INFO_INSTANCE_START');
    }
    catch (err) {

        bootstrapLogger.fatal(err, 'FATAL_INSTANCE_START');
        setTimeout(() => {

            process.exit(1);
        }, 500);
    }
};

process.on('unhandledRejection', (err) => {

    bootstrapLogger.fatal(err, 'FATAL_unhandledRejection');
    setTimeout(() => {

        process.exit(1);
    }, 500);
});

process.on('uncaughtException', (err) => {

    bootstrapLogger.fatal(err, 'FATAL_uncaughtException');
    setTimeout(() => {

        process.exit(1);
    }, 500);
});

// Docker stop sends SIGTERM
process.on('SIGTERM', async () => {

    bootstrapLogger.info('Got SIGTERM (Probably docker stop). Shutdown in 2 seconds');
    await instance.stop();

    setTimeout(() => {

        process.exit(0);
    },2000);
});

// ctrl-c sends SIGINT
process.on('SIGINT', async () => {

    bootstrapLogger.info('Got SIGINT. Shutdown in 2 seconds');
    await instance.stop();

    setTimeout(() => {

        process.exit(0);
    },2000);
});

bootstrap();
