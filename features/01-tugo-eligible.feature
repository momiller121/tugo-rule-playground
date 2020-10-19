Feature: Indicate if a booking is eligible for TuGo Insurance coverage.

    As a developer consuming the Tugo Eligibility service
    I want to know if a particular booking (or proposed booking) is eligible for TuGo Insurance
    So that I can indicate this fact to the Guest

    Background: The API is in a normal operating state
        Given the API is ready and operational

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
        When I request a TuGo eligibility response
        Then the eligibility result is '<eligibilityResult>'
        And the ineligibility reason is '<ineligibilityReason>'

        Examples:
            | origin | destination | bookingDate | tripDate | eligibilityResult | ineligibilityReason |
            | YYC    | YVR         | 20201020    | 20201120 | false             | DOMESTIC_ROUTE      |

    Scenario Outline: Booking and Trip date boundaries affect eligibility

        TuGo coverage is only applicable for bookings made after September 20, 2020
        for travel until August 31, 2021. Booking or travel dates outside of these
        parameters make the booking ineligible for TuGo insurance.

        TODO: There are several detail questions around this.
        - Is a booking made on Sept 20 eligible or ineligible?
        - Regarding the end date of August 31, 2021, is that relative to the start or the end of the trip?
        - Once the first question is clarified, how does this date boundary work - is it inclusive or exclusive of
        the delared end date?

        Given the origin is 'YYC'
        And the destination is 'LAX'
        And the booking date is '<bookingDate>'
        And the trip date is '<tripDate>'
        When I request a TuGo eligibility response
        Then the eligibility result is '<eligibilityResult>'
        And the ineligibility reason is '<ineligibilityReason>'

        Examples:
            | bookingDate | tripDate | eligibilityResult | ineligibilityReason         |
            | 20201020    | 20201120 | true              | null                        |
            | 20200820    | 20201120 | false             | BOOKING_PRECEDES_START_DATE |
            | 20201020    | 20211120 | false             | TRIP_EXCEEDS_END_DATE       |
            # TODO - deliberately test the booking boundary date.
            # What should happen if the booking is on the boundary date?
            # Is there a reason to consider timezone in this?
            | 20200920    | 20201120 | true              | null                        |
            # TODO - deliberately test the end boundary date.
            # What should happen if the trip is on the boundary date?
            # Is this end date relative to trip start, end?
            # Is there a reason to consider timezone in this?
            | 20201020    | 20210831 | false             | TRIP_EXCEEDS_END_DATE       |

    Scenario Outline: Booking date is not explicitly provided

        As a convenience feature to the consumer, it is possible to leave out the `bookingDate`.
        If the `bookingDate` is missing, it is determined to be `now`.

        Given the system date is '<systemDate>'
        And the origin is '<origin>'
        And the destination is '<destination>'
        And the booking date is '<bookingDate>'
        And the trip date is '<tripDate>'
        When I request a TuGo eligibility response
        Then the eligibility result is '<eligibilityResult>'
        And the ineligibility reason is '<ineligibilityReason>'

        Examples:
            | systemDate               | origin | destination | bookingDate | tripDate | eligibilityResult | ineligibilityReason   |
            # TODO: Is timezone relevant in this?
            | 2020-10-20T00:00:00.000Z | YYC    | LAX         | null        | 20201120 | true              | null                  |
            | 2021-10-20T00:00:00.000Z | YYC    | LAX         | null        | 20211120 | false             | TRIP_EXCEEDS_END_DATE |