# edRareTravel
Elite Dangerous rare route generator.

Uses the data from http://www.elitetradingtool.co.uk to generate more complexes trade routes. Basically it asks for a starting point, an ending point, the maximum distance to the station, and the hold size and tries to find a route with the following conditions:

1 The next to last step is at least 130ly from the ending point.
2 The hold is full at the next to last step (in this version, assuming 6 rares per stop bought).
3 Each next stop is closer to the ending point than the previous one, except when it would violate rule number 1
