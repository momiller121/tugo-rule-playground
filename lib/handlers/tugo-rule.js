'use strict';

const { parse, compareAsc } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');
const Hoek = require('@hapi/hoek');

const internals = {};
internals.reasons = {
    DOMESTIC_ROUTE: 'DOMESTIC_ROUTE',
    BOOKING_PRECEDES_START_DATE: 'BOOKING_PRECEDES_START_DATE',
    TRIP_EXCEEDS_END_DATE: 'TRIP_EXCEEDS_END_DATE',
    UNSUPPORTED_OPERATING_CARRIER: 'UNSUPPORTED_OPERATING_CARRIER'
};
internals.defaultTimezone = 'America/Edmonton';
internals.minBookingDate = new Date('2020-09-18T00:00:00.000Z'); // Sept 18, 2020
internals.maxTripDate = new Date('2021-08-31T00:00:00.000Z'); // Aug 31, 2021
internals.allowedOperatingCarriers = ['WS']; // only WestJet
internals.isTuGoEligible = (request) => {

    const airports = request.server.app.airports;
    let { origin, destination, bookingDate, tripDate, operatingCarrier } = request.query;

    // Cast the YYYYMMDD string params to Date objects in the origin timezone
    // In the case that we can't find the airport, we'll default to internals.defaultTimezone
    if (!bookingDate) {
        bookingDate = utcToZonedTime(new Date(), Hoek.reach(airports[origin], 'timezone') || internals.defaultTimezone);
    }
    else {
        bookingDate = utcToZonedTime(parse(bookingDate, 'yyyyMMdd', new Date()), Hoek.reach(airports[origin], 'timezone') || internals.defaultTimezone);
    }

    tripDate = utcToZonedTime(parse(tripDate, 'yyyyMMdd', new Date()), Hoek.reach(airports[origin], 'timezone') || internals.defaultTimezone);

    // Determine the countries of the O, D. If we can't determine the value
    // (because, perhaps, we don't have that airport) then it is undefined.
    const originCountry = Hoek.reach(airports[origin], 'countryCode');
    const destinationCountry = Hoek.reach(airports[destination], 'countryCode');

    // If we know this is a domestic booking, we can exit false immediately
    if (originCountry && originCountry === destinationCountry) {
        return { isTuGoEligible: false, reason: internals.reasons.DOMESTIC_ROUTE };
    }

    // Evaluate booking date:
    // The date that the booking was or is being made may affect eligibility.
    // Only bookings made after Sept 20, 2020 are eligible.
    if (compareAsc(bookingDate, internals.minBookingDate) < 1) {
        return { isTuGoEligible: false, reason: internals.reasons.BOOKING_PRECEDES_START_DATE };
    }

    // Evaluate trip date:
    // Only trips [TODO: clarify - start before or end before] before Aug 31 2021 are eligible.
    if (compareAsc(internals.maxTripDate, tripDate) < 1) {
        return { isTuGoEligible: false, reason: internals.reasons.TRIP_EXCEEDS_END_DATE };
    }

    // Enforce operating carrier. WestJet must operate one of the flight legs for TuGo eligibility.
    // Determine if the operating carriers on the request overlap with the allowed operating carrier(s):
    const unsupportedCarrier = operatingCarrier.filter((c) => internals.allowedOperatingCarriers.includes(c)).length === 0;
    if (unsupportedCarrier) { // no supported operating carrier
        return { isTuGoEligible: false, reason: internals.reasons.UNSUPPORTED_OPERATING_CARRIER };
    }

    return {
        isTuGoEligible: true,
        limitDays: {
            oneway: 7,
            return: 21
        }
    };
};

module.exports = (request, h) => {

    return internals.isTuGoEligible(request);
};
