'use strict';

const Path = require('path');
const Joi = require('joi');
const Package = require('../../package');

const internals = {
    schema: {
        date: Joi.string().regex(/^\d{4}(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[0-1])$/, 'YYYYMMDD date pattern'),
        airportCode: Joi.string().regex(/^[A-Z]{3}$/, 'IATA Airport Code pattern (3 uppercase letters)'),
    }
};

const helloRoute = {
    name: `${Package.name}_route_tugo`,
    version: Package.version,
    register: async function (server, options) {

        await server.route({
            method: 'GET',
            path: '/tugoEligible',
            options: {
                description: 'Determine TuGo Insurance eligibility for a trip',
                notes: '... TODO',
                tags: ['api'],
                validate: {
                    query: Joi.object({
                        origin: internals.schema.airportCode.required().description('Origin Airport Code eg. `YYC`'),
                        destination: internals.schema.airportCode.required().description('Destination Airport Code eg. `PSP`'),
                        bookingDate: internals.schema.date.optional().description('Date of the booking (`YYYYMMDD`). When not provided, \'now\' in the origin timezone is used.'),
                        tripDate: internals.schema.date.required().description('Trip start date (`YYYYMMDD`)')
                    })
                },
                response: {
                    sample: 100, // enforce on all responses
                    schema: Joi.object({
                        isTuGoEligible: Joi.boolean().required(),
                        reason: Joi.string().allow('DOMESTIC_ROUTE', 'BOOKING_PRECEDES_START_DATE', 'TRIP_EXCEEDS_END_DATE'),
                        limitDays: Joi.object({
                            oneway: Joi.number().integer(),
                            return: Joi.number().integer()
                        })
                    })
                },
                handler: require(Path.join(__dirname, '..', 'handlers', Path.basename(__filename)))
            }
        });
    }
};

module.exports = helloRoute;
