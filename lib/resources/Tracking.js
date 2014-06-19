module.exports.init = function (USPS) {


    /*

    retrieve tracking information from USPS from tracking ID#

    https://www.usps.com/business/web-tools-apis/track-and-confirm.htm#_Toc378923168

    id: String
    destinationZip: 5-digit string
    mailDate: String YYYY-MM-DD

    */
    USPS.prototype.tracking = function (id, destinationZip, mailDate, cb) {

        var url = ['http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=',
            '<TrackFieldRequest USERID="' + this.userId + '">',
                '<TrackID ID="' + id + '">',
                    '<DestinationZipCode>' + destinationZip + '</DestinationZipCode>',
                    '<MailingDate>' + mailDate + '</MailingDate>',
                '</TrackID>',
            '</TrackFieldRequest>'
        ].join('');

        // is this endpoint different for international tracking orders?
        this._request(url, function (err, json) {
            if (err) return cb(err);

            var summary = json.TrackResponse.TrackInfo[0].TrackSummary[0];

            var trackingInfo;

            try {
                trackingInfo = {
                    trackingId: id,
                    summary: {
                        date: new Date(summary.EventDate[0] + ' ' + summary.EventTime[0]),
                        event: summary.Event[0],
                        city: summary.EventCity[0],
                        state: summary.EventState[0],
                        zip: summary.EventZIPCode[0],
                        country: summary.EventCountry[0]
                    },
                    detail: json.TrackResponse.TrackInfo[0].TrackDetail.map(function (item) {
                        return {
                            date: new Date(item.EventDate[0] + ' ' + item.EventTime[0]),
                            event: item.Event[0],
                            city: item.EventCity[0],
                            state: item.EventState[0],
                            zip: item.EventZIPCode[0],
                            country: item.EventCountry[0]
                        };
                    })
                };
            } catch (e) {
                trackingInfo = {
                    trackingId: id,
                    summary: {},
                    detail: []
                };
            }

            // it worked
            return cb(null, trackingInfo);
        });
    };
};