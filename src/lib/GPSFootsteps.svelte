<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { writable } from 'svelte/store';

    // Reactive Svelte store to hold location data
    const locationStore = writable(null);
    let errorMessage = '';

    // Load initial data from localStorage if available
    if (typeof window !== 'undefined') {
        const storedLocation = localStorage.getItem('lastKnownLocation');
        if (storedLocation) {
            locationStore.set(JSON.parse(storedLocation));
        }
    }

    // Function to handle a successful location retrieval
    function savePosition(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const timestamp = new Date().toISOString();

        const locationData = { latitude, longitude, timestamp };
        locationStore.set(locationData);

        // Save to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('lastKnownLocation', JSON.stringify(locationData));
        }

        errorMessage = ''; // Clear any previous error messages
    }

    // Function to handle geolocation errors
    function showError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                errorMessage = "The request to get user location timed out.";
                break;
            default:
                errorMessage = "An unknown error occurred.";
                break;
        }
        console.error(errorMessage);
        locationStore.set(null); // Clear location data on error
    }

    let intervalId;

    onMount(() => {
        if ("geolocation" in navigator) {
            console.log("Starting location tracking every 30 seconds...");
            // Get location immediately
            navigator.geolocation.getCurrentPosition(savePosition, showError);
            // Then, repeat every 30 seconds (30000 milliseconds)
            intervalId = setInterval(() => {
                navigator.geolocation.getCurrentPosition(savePosition, showError);
            }, 30000);
        } else {
            errorMessage = "Geolocation is not supported by this browser.";
        }
    });

    onDestroy(() => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    });

    // Function to handle the download
    function downloadGPSData() {
        const locationData = $locationStore;

        if (!locationData) {
            alert("No GPS data found to download.");
            return;
        }

        // Define the CSV content with headers
        const csvHeaders = "Latitude,Longitude,Timestamp\n";
        const csvRow = `${locationData.latitude},${locationData.longitude},${locationData.timestamp}\n`;
        const csvContent = csvHeaders + csvRow;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");

        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", "gps_location.csv");

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
</script>

<main>
    <h1>GPS Location Tracker</h1>
    <p>Your last known location is:</p>
    {#if errorMessage}
        <div class="error-message">
            {errorMessage}
        </div>
    {:else if $locationStore}
        <div>
            Latitude: {$locationStore.latitude}<br>
            Longitude: {$locationStore.longitude}<br>
            Timestamp: {$locationStore.timestamp}
        </div>
    {:else}
        <div>Waiting for location...</div>
    {/if}
    <br>
    <button on:click={downloadGPSData}>Download GPS Data</button>
</main>

<style>
    main {
        font-family: sans-serif;
        text-align: center;
        padding: 2rem;
    }
    .error-message {
        color: red;
    }
</style>
