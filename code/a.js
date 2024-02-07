function calculateGreatCirclePathPoints(lat1, lon1, lat2, lon2, numPoints)
{
  const points = [];

  // Convert latitude and longitude from degrees to radians
  lat1 = lat1 * (Math.PI / 180);
  lon1 = lon1 * (Math.PI / 180);
  lat2 = lat2 * (Math.PI / 180);
  lon2 = lon2 * (Math.PI / 180);

  // Calculate the angular distance between the two points
  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon2 - lon1) / 2), 2)
    )
  );

  // Calculate the step size for interpolation
  const step = d / numPoints;

  // Interpolate points along the great circle path
  for (let i = 0; i <= numPoints; i++)
  {
    const fraction = i / numPoints;
    const a = Math.sin((1 - fraction) * d) / Math.sin(d);
    const b = Math.sin(fraction * d) / Math.sin(d);

    const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);

    // Convert back to latitude and longitude in degrees
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);
    const lon = Math.atan2(y, x) * (180 / Math.PI);

    points.push({ lat, lon });
  }

  return points;
}

function pointsToWKT(points, iTruncateLength = 10)
{
  if (!Array.isArray(points) || points.length === 0)
  {
    return null;
  }

  const wktPoints = points.map(point => `${point.lon.toFixed(iTruncateLength)} ${point.lat.toFixed(iTruncateLength)}`);
  const wktString = `LINESTRING(${wktPoints.join(', ')})`;

  return wktString;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusKm * c;
  return distance;
}

var szOut = "";
var szOutSuffix = "";
var iOutTotal = 0;

function processRouteString(route)
{
  szOut =  "<table><tr><td>From</td><td>To</td><td>Distance</td></tr>\n";
  szOutSuffix = "<ul>\n";
  iOutTotal = 0;

  // Split the route string on commas
  const routeSegments = route.split(',');

  // Process each segment using the processRoute function
  routeSegments.forEach(segment => {
    processRoute(segment.trim()); // Trim to remove leading/trailing spaces
  });

  szOut += "<tr><td><b>Total:</b></td><td>&nbsp;</td><td>" + iOutTotal.toFixed(2) + " km</td></tr>\n";
  szOut += "</table>\n";
  szOutSuffix += "</ul>\n";
  console.log(szOut);
  console.log(szOutSuffix);
}

function getAirportByKey(key)
{
  try
  {
    return _airports[_airports_key[key.toUpperCase()]];
  }
  catch(ex)
  {
    return null;
  }
}

function processRoute(segment)
{
  var locations = segment.split('-');
  if( locations.length > 2 )
  {
    szOut += "<tr><td colspan=3>" + (locations.length - 1) + " segment path</td></tr>\n";
  }
  var iPathLength = 0;
  for(var i = 0; i < locations.length; ++i)
  {
    locations[i] = locations[i].trim();
    if(locations[i].length == 3 || locations[i].length == 4)
    {
      var airport = getAirportByKey(locations[i]);
      var oldAirport = getAirportByKey(locations[i - 1]);

      if( i != 0 )
      {
        if(airport == null )
        {
          szOut += "<tr><td colspan=3>Invalid airport: " + airport + "</td></tr>\n";
          break;
        }
        else if(oldAirport == null )
        {
          szOut += "<tr><td colspan=3>Invalid airport: " + oldAirport + "</td></tr>\n";
          break;
        }

        szOut += "<tr><td>" + locations[i - 1] + "</td><td>" + locations[i] + "</td><td>";
        var dist = calculateDistance(airport.lat, airport.lon, oldAirport.lat, oldAirport.lon);
        iOutTotal += dist;
        iPathLength += dist;
        szOut += dist.toFixed(2);
        szOut += " km </td></tr>";
      }
      szOutSuffix += "<li>" + airport.name + "</li>\n";
    }
  }

  if( locations.length > 2 )
  {
    szOut += "<tr><td colspan=2>&nbsp;</td><td>" + iPathLength.toFixed(2) + " km</td></tr>\n";
  }
}

function test1()
{
  // Example usage for LA to NY with 100 points
  const la = { lat: 34.0522, lon: -118.2437 }; // Los Angeles
  const ny = { lat: 40.7128, lon: -74.006 };   // New York
  const numPoints = 100;

  const greatCirclePathPoints = calculateGreatCirclePathPoints(la.lat, la.lon, ny.lat, ny.lon, numPoints);
  console.log(greatCirclePathPoints);

  // Example usage with the previously calculated greatCirclePathPoints
  const wkt = pointsToWKT(greatCirclePathPoints, 2);
  console.log(wkt);

  console.log( calculateDistance(la.lat, la.lon, ny.lat, ny.lon) );
}
