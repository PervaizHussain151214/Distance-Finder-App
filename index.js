

const searchInput = document.getElementById('search');
const resultList = document.getElementById('result-list');
const mapContainer = document.getElementById('map-container');
const currentMarkers = [];
const distanceParagraph = document.getElementById('distance');

const map = L.map(mapContainer).setView([20.13847, 1.40625], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

document.getElementById('search-button').addEventListener('click', () => {
    const query = searchInput.value;
    fetch('https://nominatim.openstreetmap.org/search?format=json&polygon=1&addressdetails=1&q=' + query)
        .then(result => result.json())
        .then(parsedResult => {
            setResultList(parsedResult);
        });
});

// Function to calculate the Haversine distance between two coordinates
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Event listener for clicking on a result in the list
resultList.addEventListener('click', (event) => {
    const clickedData = JSON.parse(event.target.innerHTML);
    distanceParagraph.textContent = ""; // Clear any previous distance
    distanceParagraph.textContent = `Selected Location: ${clickedData.displayName}`;
});

// Event listener for calculating the distance between two entered locations
document.getElementById('calculate-distance').addEventListener('click', () => {
    const location1 = document.getElementById('location1').value;
    const location2 = document.getElementById('location2').value;

    // Fetch the coordinates for location1
    fetch('https://nominatim.openstreetmap.org/search?format=json&polygon=1&addressdetails=1&q=' + location1)
        .then(result => result.json())
        .then(parsedResult1 => {
            if (parsedResult1.length === 0) {
                distanceParagraph.textContent = "Location 1 not found.";
                return;
            }
            const coordinates1 = {
                lat: parseFloat(parsedResult1[0].lat),
                lon: parseFloat(parsedResult1[0].lon)
            };

            // Fetch the coordinates for location2
            fetch('https://nominatim.openstreetmap.org/search?format=json&polygon=1&addressdetails=1&q=' + location2)
                .then(result => result.json())
                .then(parsedResult2 => {
                    if (parsedResult2.length === 0) {
                        distanceParagraph.textContent = "Location 2 not found.";
                        return;
                    }
                    const coordinates2 = {
                        lat: parseFloat(parsedResult2[0].lat),
                        lon: parseFloat(parsedResult2[0].lon)
                    };

                    // Clear previous markers and route
                    for (const marker of currentMarkers) {
                        map.removeLayer(marker);
                    }
                    currentMarkers.length = 0;

                    // Add markers for both locations
                    const marker1 = L.marker([coordinates1.lat, coordinates1.lon]).addTo(map);
                    const marker2 = L.marker([coordinates2.lat, coordinates2.lon]).addTo(map);
                    currentMarkers.push(marker1);
                    currentMarkers.push(marker2);

                    // Create a polyline (route line) between the two locations
                    const latlngs = [
                        [coordinates1.lat, coordinates1.lon],
                        [coordinates2.lat, coordinates2.lon]
                    ];
                    const polyline = L.polyline(latlngs, { color: 'blue' }).addTo(map);

                    // Calculate the distance
                    const distance = haversineDistance(
                        coordinates1.lat,
                        coordinates1.lon,
                        coordinates2.lat,
                        coordinates2.lon
                    );
                    distanceParagraph.textContent = `Distance: ${distance.toFixed(2)} km`;
                });
        });
});

function setResultList(parsedResult) {
    resultList.innerHTML = "";
    for (const marker of currentMarkers) {
        map.removeLayer(marker);
    }
    map.flyTo(new L.LatLng(20.13847, 1.40625), 2);
    for (const result of parsedResult) {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'list-group-item-action');
        li.innerHTML = JSON.stringify({
            displayName: result.display_name,
            lat: result.lat,
            lon: result.lon
        }, undefined, 2);
        li.addEventListener('click', (event) => {
            for(const child of resultList.children) {
                child.classList.remove('active');
            }
            event.target.classList.add('active');
            const clickedData = JSON.parse(event.target.innerHTML);
            const position = new L.LatLng(clickedData.lat, clickedData.lon);
            map.flyTo(position, 10);
        })
        const position = new L.LatLng(result.lat, result.lon);
        currentMarkers.push(new L.marker(position).addTo(map));
        resultList.appendChild(li);
    }
}


