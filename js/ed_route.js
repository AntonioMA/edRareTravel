"use strict";

var RouteGenerator=(function () {

  var _startSystemField,
      _endSystemField,
      _maxStationDistanceField,
      _holdSizeField,
      _itemsPerStopField;

  var RARE_URL = "http://www.elitetradingtool.co.uk/api/EliteTradingTool/RareTrades";

  function setup() {
    _startSystemField = document.getElementById("startSystem");
    _endSystemField = document.getElementById("endSystem");
    _maxStationDistanceField = document.getElementById("maxStationDistance");
    _holdSizeField = document.getElementById("holdSize");
    _itemsPerStopField = document.getElementById("itemsByStop");
  }

  function getRequestParam(param) {
    return {
      CurrentLocation: param
    };
  }

/*
   {
        "Id": 58,
        "RareTrade": "Uzumoku Low-G Wings",
        "Location": "Uzumoku (Sverdrup Ring)",
        "Allegiance": "Independent",
        "Price": 8496,
        "Distance": 58.11,
        "DistanceFromJumpIn": 505322
    },
*/

  var _route = [];


  function printRoute(systemInfo) {
    function addRow(aTable, aType, aData) {
      var tr = Utils.createElementAt(aTable, "tr");
      aData.forEach(text => Utils.createElementAt(tr, aType, undefined, text));
    }


    console.log("Route: " + JSON.stringify(_route));
    var resultOn = document.getElementById("result");
    resultOn.innerHTML = '';
    var resultTable = Utils.createElementAt(resultOn, "table", {border: 1});
    addRow(resultTable, "th", ["Location", "Allegiance", "Price", "Distance", "Station Distance", "Distance to End", "Remaining Size", "Total Jumped Distance"]);
    var totalJumpedDistance = 0;
    _route.forEach(s => {
      totalJumpedDistance += s.Distance;
      addRow(resultTable, "td", [s.Location, s.Allegiance, s.Price, s.Distance, s.DistanceFromJumpIn, s.DistanceToEnd, s.holdSize, totalJumpedDistance.toFixed(2)]);
    });
  }

  var isSameSystem = (systemName, systemInfo) => systemInfo.Location === systemName;
  var isInTable = (table, element) => table.find(isSameSystem.bind(undefined, element.Location));

  function addSystemToRoute(endSystemTable, systemInfo, holdSize) {
    var candidateIndex = endSystemTable.findIndex(isSameSystem.bind(undefined, systemInfo.Location));
    if (candidateIndex !== -1) {
      systemInfo.DistanceToEnd = endSystemTable[candidateIndex].Distance;
      endSystemTable.splice(candidateIndex,1);
    } else {
      // Assuming this is the end system...
      systemInfo.DistanceToEnd = 0;
      systemInfo.Distance = _route[_route.length - 1].DistanceToEnd;
    }
    systemInfo.holdSize = holdSize;

    _route.push(systemInfo);
  }

  // Location is stored as "system (station name)"
  function getSystemFromLocation(location) {
    var firstParens = location.indexOf("(");
    return location.substring(0, firstParens - 1);
  }

  // Returns a promise that will be fulfilled with the table holding the rare systems
  // sorted by distance from initialSystem
  function getRaresTable(initialSystem) {
    return Utils.sendXHR("POST", RARE_URL, getRequestParam(initialSystem));
  }


  // Chooses the next system to jump too, taking into account the following rules:
  // 1 The system to jump to is at least 130ly from the ending point. Note that endSystemTable has been purged from
  //   systems that do not satisfy this condition. We're also removing the systems we've visited from endSystemTable!
  // 2 Each next stop is closer to the ending point than the previous one, except when it would violate rule number 1
  // 3 And obviously try to not go back to a previously visited place!
  function chooseNextSystem(endSystemTable, currentSystemTable) {
    var positionOnEndTable = -1,
        currentSystem = currentSystemTable[0].Location;
    // First, find the currentSystem (which will be at currentSystemTable[0]) on endSystemTable

    positionOnEndTable = endSystemTable.findIndex(isSameSystem.bind(undefined, currentSystem));

    // And now find the *nearest* system to currentSystem that's not on the route already and that reduces the distance to endSystem (not under 130) or
    // if that's not possible, doesn't increment it much. The easiest way is go down the table in currentSystemTable checking that
    // a) it's not on the list
    // b) it's over 130ly from the end system. Already taken care of.
    // c) It's closer than the previous jump!
    // d) The station is closer than _maxDistance. Already taken care of.

    // First go towards the endSystem from the currentSystem, do a list of candidates and sort them by distance to
    var nearerSystems = (positionOnEndTable >= 1 && endSystemTable.slice(0, positionOnEndTable)) || [],
        nearerCandidates = currentSystemTable.filter(isInTable.bind(undefined, nearerSystems)),
        fartherSystems = endSystemTable.slice(positionOnEndTable + 1) || [],
        fartherCandidates = currentSystemTable.filter(isInTable.bind(undefined, fartherSystems)),
        candidate;

    // So we have two lists of candidates, both sorted by distance to the current system. And we also have to lists of systems, the ones farther and closer to
    // the destination system, sored by distance to the destination system. What we want to minimize is a function of the distance to the destination system and
    // the distance to the current size, since what we want to find is a good maximum travel (not the optimal one since I don't think we can get that without some 
    // kind of backtracking. So we'll just choose the best local solution and hope for the best...
    // Let's place an elephant on the north side of Africa first...
    var nonExistantSystem = {Location: "Non existant System", Distance: 1000000000};
    if (fartherCandidates.length === 0) {
      fartherCandidates.push(nonExistantSystem);
    }
    if (nearerCandidates.length === 0) {
      nearerCandidates.push(nonExistantSystem);
    }

    // Do we have nearerCandidates?
    if (nearerCandidates[0].Distance <= fartherCandidates[0].Distance) {
      // This is a clear win, we're doing the smallest possible jump and getting closer
      candidate = nearerCandidates[0];
    } else {
      // This is not so clear though. Let's assume it's true and roll with it
      candidate = fartherCandidates[0];

      if (nearerCandidates[0].Location === nonExistantSystem.Location) {
        candidate = fartherCandidates[0];
      } else {
        var nearerSystem = nearerSystems.find(isSameSystem.bind(undefined, nearerCandidates[0].Location)) || nonExistantSystem;
        var fartherSystem = fartherSystems.find(isSameSystem.bind(undefined, fartherCandidates[0].Location)) || nonExistantSystem;

        // I'm going farther away, but how much? Let's check the distance I'm losing getting away compared with the distance I'm actually traveling
        var increasedTraveledDistance = nearerCandidates[0].Distance - fartherCandidates[0].Distance;
        var increasedDistanceFromEnd = fartherSystem.Distance - nearerSystem.Distance;
        candidate = (increasedTraveledDistance > increasedDistanceFromEnd) ? nearerCandidates[0] : fartherCandidates[0];
      }
    }

    if (candidate.Location === nonExistantSystem.Location) {
      // There's no solution, we're done here
      return undefined;
    }

    return candidate;

  }

  function addNextJump(endSystemTable, currentSystem, endSystem, holdSize, itemsPerStop, distanceFromPrevious) {
    // If the hold is full, jump to the end system directly, print the calculated route and end.
    if (holdSize <= 0) {
      addSystemToRoute(endSystemTable, {Location: endSystem, Distance: 0.0}, holdSize);
      printRoute();
      return;
    }
    getRaresTable(currentSystem).then(currentSystemTable => {

      // Add the current system to the route and alter the end table accordingly.
      // I have a small problem here... at this point for the starting station the distance is correct (that is, 0) but for the rest I need the distance from
      // the *previous* station.
      currentSystemTable[0].Distance = distanceFromPrevious;
      holdSize -= itemsPerStop;
      addSystemToRoute(endSystemTable, currentSystemTable[0], holdSize);

      var nextSystem = chooseNextSystem(endSystemTable, currentSystemTable);
      if (nextSystem) {
        // TO-DO: Note that at this point we assume 8 slots filled per stop.
        addNextJump(endSystemTable, getSystemFromLocation(nextSystem.Location), endSystem, holdSize, itemsPerStop,
                   nextSystem.Distance);
      } else { // We ran out of systems!
        addSystemToRoute(endSystemTable, {Location: endSystem, Distance: 0.0});
        printRoute();
      }
    });
  }

  function genRoute(startSystem, endSystem, maxStationDistance, holdSize, itemsPerStop) {
    // I don't like this even a tiny little bit
    _route = [];
    getRaresTable(endSystem).then(endSystemTable => {
      // Let's remove the part of the table we don't really want first.
      endSystemTable = endSystemTable.slice(endSystemTable.findIndex(element => element.Distance >= 130)).
                         filter(element => element.DistanceFromJumpIn <= maxStationDistance);
      // endSystemTable has a list of valid candidates only now (systems farther away than 130Ly and with stations closer than maxStationDistance
      addNextJump(endSystemTable, startSystem, endSystem, holdSize, itemsPerStop, 0);
    });
  }

  function generateRoute() {
    genRoute(_startSystemField.value,
             _endSystemField.value,
             parseInt(_maxStationDistanceField.value),
             parseInt(_holdSizeField.value),
             parseInt(_itemsPerStopField.value));
  }

  return {
    setup: setup,
    generateRoute: generateRoute
  };
})();
