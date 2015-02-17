# edRareTravel
Elite Dangerous rare route generator.

Uses the data from http://www.elitetradingtool.co.uk to generate more complexes trade routes. Basically it asks for a starting point, an ending point, the maximum distance to the station, and the hold size and tries to find a route with the following conditions:

1 The next to last step is at least 130ly from the ending point.
2 The hold is full at the next to last step (in this version, assuming 6 rares per stop bought).
3 Each next stop is closer to the ending point than the previous one, except when it would violate rule number 1

Since this is for me and I don't give a shit about appearance, this will be ugly as hell. Also at this point it needs some kind of proxy that allows for injecting headers (Allow-Origin: *). I'm using Fiddler myself, but anything that allows injecting headers would work. That, or convert this into a FirefoxOS privileged app and use systemXHR ;).

A very simple Fiddler Script that does this is included on FiddlerScript. It only adds a new rule and then does
        if (m_AllowOrigin) {
            // Besides doing this, let's enable OPTIONs... just because
            oSession.oResponse.headers.Add("Access-Control-Allow-Origin", "*");
            oSession.oResponse.headers.Add("Access-Control-Allow-Methods", "PUT, GET, OPTIONS, DELETE");

            if (oSession.oRequest.headers.Exists("Access-Control-Request-Headers")) {
                oSession.oResponse.headers.Add("Access-Control-Allow-Headers", oSession.oRequest["Access-Control-Request-Headers"]);
            }
            if (oSession.oRequest.headers.HTTPMethod == "OPTIONS") {
                oSession.oResponse.headers.HTTPResponseCode = 200;
                oSession.oResponse.headers.HTTPResponseStatus = "200 OK"
            }
        }

Note that this is completely and utterly insecure for normal web browsing! So use with care.
