Feature: Indicate if a booking is eligible for TuGo Insurance coverage.

    As a developer consuming the Tugo Eligibility service
    I want to know if a particular booking (or proposed booking) is eligible for TuGo Insurance
    So that I can indicate this fact to the Guest

    Background: The API is in a normal operating state
        Given the API is ready and operational

    @complete
    Scenario Outline: Domestic routes are not eligible, regarless of dates.

        TuGo coverage is only applicable for travel outside of Canada.
        Therefore, any booking indicating that both the origin and destination
        countries are Canada is ineligible.

        Further, to keep things as simple as possible, the rule is simply that
        if the origin and destination country codes are the same, it's ineligible.

        Given the origin is '<origin>'
        And the destination is '<destination>'
        And the booking date is '<bookingDate>'
        And the trip date is '<tripDate>'
        And the operatingCarrier is '<operatingCarrier>'
        When I request a TuGo eligibility response
        Then the eligibility result is '<eligibilityResult>'
        And the ineligibility reason is '<ineligibilityReason>'

        Examples:
            | origin | destination | bookingDate | tripDate | operatingCarrier | eligibilityResult | ineligibilityReason |
            | YYC    | YVR         | 20201020    | 20201120 | ["WS", "DL"]     | false             | DOMESTIC_ROUTE      |

    @complete
    Scenario Outline: Booking and Trip date boundaries affect eligibility

        TuGo coverage is only applicable for bookings made after September 18, 2020
        for travel until August 31, 2021. Booking or travel dates outside of these
        parameters make the booking ineligible for TuGo insurance.

        TODO: There are several detail questions around this.
        - Is a booking made on Sept 18 eligible or ineligible?
        - Regarding the end date of August 31, 2021, is that relative to the start or the end of the trip?
        - Once the first question is clarified, how does this date boundary work - is it inclusive or exclusive of
        the delared end date?

        Given the origin is 'YYC'
        And the destination is 'LAX'
        And the booking date is '<bookingDate>'
        And the trip date is '<tripDate>'
        And the operatingCarrier is '<operatingCarrier>'
        When I request a TuGo eligibility response
        Then the eligibility result is '<eligibilityResult>'
        And the ineligibility reason is '<ineligibilityReason>'

        Examples:
            | bookingDate | tripDate | operatingCarrier | eligibilityResult | ineligibilityReason         |
            | 20201020    | 20201120 | ["WS", "DL"]     | true              | null                        |
            | 20200820    | 20201120 | ["WS", "DL"]     | false             | BOOKING_PRECEDES_START_DATE |
            | 20201020    | 20211120 | ["WS", "DL"]     | false             | TRIP_EXCEEDS_END_DATE       |
            # TODO - deliberately test the booking boundary date.
            # What should happen if the booking is on the boundary date?
            # Is there a reason to consider timezone in this?
            | 20200918    | 20201120 | ["WS", "DL"]     | true              | null                        |
            # TODO - deliberately test the end boundary date.
            # What should happen if the trip is on the boundary date?
            # Is this end date relative to trip start, end?
            # Is there a reason to consider timezone in this?
            | 20201020    | 20210831 | ["WS", "DL"]     | false             | TRIP_EXCEEDS_END_DATE       |

    @complete
    Scenario Outline: Booking date is not explicitly provided

        As a convenience feature to the consumer, it is possible to leave out the `bookingDate`.
        If the `bookingDate` is missing, it is determined to be `now`.

        Given the system date is '<systemDate>'
        And the origin is '<origin>'
        And the destination is '<destination>'
        And the booking date is '<bookingDate>'
        And the trip date is '<tripDate>'
        And the operatingCarrier is '<operatingCarrier>'
        When I request a TuGo eligibility response
        Then the eligibility result is '<eligibilityResult>'
        And the ineligibility reason is '<ineligibilityReason>'

        Examples:
            | systemDate               | origin | destination | bookingDate | tripDate | operatingCarrier | eligibilityResult | ineligibilityReason   |
            # TODO: Is timezone relevant in this?
            | 2020-10-20T00:00:00.000Z | YYC    | LAX         | null        | 20201120 | ["WS", "DL"]     | true              | null                  |
            | 2021-10-20T00:00:00.000Z | YYC    | LAX         | null        | 20211120 | ["WS", "DL"]     | false             | TRIP_EXCEEDS_END_DATE |

    @complete
    Scenario Outline: WestJet is required to be an operating carrier on at least one of the trip flights.

        Given the origin is 'YYC'
        And the destination is 'LAX'
        And the booking date is '20201010'
        And the trip date is '20201120'
        And the operatingCarrier is '<operatingCarrier>'
        When I request a TuGo eligibility response
        Then the eligibility result is '<eligibilityResult>'
        And the ineligibility reason is '<ineligibilityReason>'

        Examples:
            | operatingCarrier | eligibilityResult | ineligibilityReason           |
            | ["WS", "DL"]     | true              | null                          |
            | ["WS"]           | true              | null                          |
            | ["AF", "DL"]     | false             | UNSUPPORTED_OPERATING_CARRIER |

    #TODO - Confirm if this is true
    @WIP
    Scenario: South American destinations are explicitly excluded

    #TODO - This was a thought - in case these URI's are dynamic at all over time, maybe we serve them?
    @WIP
    Scenario: The Insurance Certificate and the Public Info Page links are included in the response payload

    #TODO - not sure how to behave in this case.
    @WIP
    Scenario: Unknown airports are provided with valid dates.

        Should we succeed or fail of we are pass an airport not in our list of 247?