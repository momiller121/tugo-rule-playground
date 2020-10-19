'use strict';

const MockDate = require('mockdate');
const { Given, Before, When, Then } = require('cucumber');
const { expect } = require('@hapi/code');

const getTugoSearchParams = (params) => {

    const setupUrl = new URL('https://example.org/');

    Object.keys(params).forEach((key) => {

        setupUrl.searchParams.set(key, params[key]);
    });
    return setupUrl.search;
};

Before(function () {

    MockDate.reset();
    this.tugoParams = {};
});

Given('the system date is {string}', (utcDateString) => {

    MockDate.set(new Date(utcDateString));
});

Given('the API is ready and operational', async function () {

    await this.readyApiForTesting();
    expect(this.isApiReady()).to.be.true();
});

Given('the origin is {string}', function (origin) {

    this.tugoParams.origin = origin;
});

Given('the destination is {string}', function (destination) {

    this.tugoParams.destination = destination;
});

Given('the booking date is {string}', function (bookingDate) {

    if (bookingDate !== 'null') {
        this.tugoParams.bookingDate = bookingDate;
    }
});

Given('the trip date is {string}', function (tripDate) {

    this.tugoParams.tripDate = tripDate;
});

When('I request a TuGo eligibility response', async function () {

    const tugoQueryString = getTugoSearchParams(this.tugoParams);
    const result = await this.api.server.inject(`/tugoEligible${tugoQueryString}`);
    this.lastResult = result;
    expect(this.lastResult).to.exist();
});

Then('the eligibility result is {string}', function (eligibilityResult) {

    const booleanEligibilityResult = (eligibilityResult === 'true') ? true : false;
    expect(this.lastResult.statusCode).to.equal(200);
    expect(JSON.parse(this.lastResult.payload).isTuGoEligible).to.equal(booleanEligibilityResult);
});

Then('the ineligibility reason is {string}', function (ineligibilityReason) {

    if (ineligibilityReason === 'null') {
        ineligibilityReason = undefined;
    }
    expect(this.lastResult.statusCode).to.equal(200);
    expect(JSON.parse(this.lastResult.payload).reason).to.equal(ineligibilityReason);
});
