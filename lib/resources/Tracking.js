module.exports.init = function (USPS) {


    /*

    retrieve tracking information from USPS from tracking ID#

    https://www.usps.com/business/web-tools-apis/track-and-confirm.htm#_Toc378923168

    id: String
    destinationZip: 5-digit string
    mailDate: String YYYY-MM-DD

    */
    USPS.prototype.tracking = function (id, cb) {

        if (typeof id !== 'string') throw new Error('must provide a tracking id as first argument. you provided: ' + id);
        if (typeof cb !== 'function') throw new Error('a callback must be provided as second argument');

        var url = ['http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=',
            '<TrackFieldRequest USERID="' + this.userId + '">',
                '<TrackID ID="' + id + '">',
                '</TrackID>',
            '</TrackFieldRequest>'
        ].join('');

        // is this endpoint different for international tracking orders?
        this._request(url, function (err, json) {
            if (err) return cb(err);

            var trackingInfo;

            try {

                var summary = json.TrackResponse.TrackInfo[0].TrackSummary[0];
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
                    detail: []
                };

                if (!!json.TrackResponse.TrackInfo[0].TrackDetail) {
                    trackingInfo.detail = json.TrackResponse.TrackInfo[0].TrackDetail.map(function (item) {
                        return {
                            date: new Date(item.EventDate[0] + ' ' + item.EventTime[0]),
                            event: item.Event[0],
                            city: item.EventCity[0],
                            state: item.EventState[0],
                            zip: item.EventZIPCode[0],
                            country: item.EventCountry[0]
                        };
                    });
                }

            } catch (e) {
                console.log(e);
                console.log(JSON.stringify(json, null, 2));
                return cb('Tracking: no record of that item');
            }

            // it worked
            return cb(null, trackingInfo);
        });
    };
};