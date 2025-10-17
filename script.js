const API_BASE_URL = 'https://tidal.401658.xyz'; // Replace with the actual API base URL if different

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchArtistsButton = document.getElementById('search-artists');
    const searchAlbumsButton = document.getElementById('search-albums');
    const searchSongsButton = document.getElementById('search-songs');

    const artistResultsDiv = document.querySelector('#artist-results .results-grid');
    const albumResultsDiv = document.querySelector('#album-results .results-grid');
    const songResultsDiv = document.querySelector('#song-results .results-grid');

    const resultsDisplaySection = document.getElementById('results-display');
    const detailViewSection = document.getElementById('detail-view');

    searchButton.addEventListener('click', () => performSearch('all'));
    searchArtistsButton.addEventListener('click', () => performSearch('artists'));
    searchAlbumsButton.addEventListener('click', () => performSearch('albums'));
    searchSongsButton.addEventListener('click', () => performSearch('songs'));

    async function performSearch(type) {
        const query = searchInput.value.trim();
        if (!query) return;

        resultsDisplaySection.style.display = 'block';
        detailViewSection.style.display = 'none';

        artistResultsDiv.innerHTML = '';
        albumResultsDiv.innerHTML = '';
        songResultsDiv.innerHTML = '';

        let searchParams = new URLSearchParams();
        searchParams.append('li', 25); // Limit results

        if (type === 'all' || type === 'artists') {
            searchParams.append('a', query);
            await fetchSearchResults(searchParams, 'artists');
            searchParams.delete('a');
        }
        if (type === 'all' || type === 'albums') {
            searchParams.append('al', query);
            await fetchSearchResults(searchParams, 'albums');
            searchParams.delete('al');
        }
        if (type === 'all' || type === 'songs') {
            searchParams.append('s', query);
            await fetchSearchResults(searchParams, 'songs');
            searchParams.delete('s');
        }
    }

    async function fetchSearchResults(params, category) {
        const url = `${API_BASE_URL}/search/?${params.toString()}`;
        console.log(`Fetching URL for ${category}:`, url);
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log(`Raw API response for ${category}:`, data);

            let itemsToDisplay = [];
            if (category === 'artists' && data.artists && data.artists.items) {
                itemsToDisplay = data.artists.items;
            } else if (category === 'albums' && data.albums && data.albums.items) {
                itemsToDisplay = data.albums.items;
            } else if (category === 'songs' && data.tracks && data.tracks.items) {
                itemsToDisplay = data.tracks.items;
            } else {
                console.warn(`No items found for ${category} in expected structure or unexpected data structure:`, data);
            }
            console.log(`Items to display for ${category} (before displayResults):`, itemsToDisplay);

            if (itemsToDisplay.length > 0) {
                displayResults(itemsToDisplay, category);
            } else {
                console.warn(`No items to display for ${category}.`);
            }
        } catch (error) {
            console.error(`Error fetching ${category} search results:`, error);
        }
    }

    function displayResults(items, category) {
        console.log(`displayResults called for ${category} with items:`, items);
        const targetDiv = category === 'artists' ? artistResultsDiv :
                          category === 'albums' ? albumResultsDiv :
                          songResultsDiv;

        targetDiv.innerHTML = '';
        console.log(`Displaying ${items.length} items for category: ${category} in targetDiv:`, targetDiv);

        items.forEach(item => {
            console.log(`Processing item for ${category}:`, item);
            const resultItem = document.createElement('div');
            resultItem.classList.add('result-item');
            resultItem.dataset.id = item.id;
            resultItem.dataset.type = category;

            let imageUrl = 'https://via.placeholder.com/150?text=No+Image'; // Default placeholder
            let title = item.title || item.name || 'Unknown Title';
            let subtitle = '';

            // Attempt to get image URL
            if (item.cover) {
                imageUrl = `${API_BASE_URL}/cover/?id=${item.cover}`;
            } else if (item.artist && item.artist.picture) {
                imageUrl = `${API_BASE_URL}/cover/?id=${item.artist.picture}`;
            } else if (item.album && item.album.cover) { // For songs, sometimes album cover is available
                imageUrl = `${API_BASE_URL}/cover/?id=${item.album.cover}`;
            }

            // Attempt to get subtitle
            if (item.artist && item.artist.name) {
                subtitle = item.artist.name;
            } else if (item.album && item.album.title) {
                subtitle = item.album.title;
            }

            resultItem.innerHTML = `
                <img src="${imageUrl}" alt="${title}">
                <h4>${title}</h4>
                <p>${subtitle}</p>
            `;
            resultItem.addEventListener('click', () => showDetailView(item.id, category));
            targetDiv.appendChild(resultItem);
        });
    }

    async function showDetailView(id, type) {
        resultsDisplaySection.style.display = 'none';
        detailViewSection.style.display = 'block';
        detailViewSection.innerHTML = '<button class="back-button">Back to Results</button><h2>Loading...</h2>';

        document.querySelector('#detail-view .back-button').addEventListener('click', () => {
            resultsDisplaySection.style.display = 'block';
            detailViewSection.style.display = 'none';
        });

        try {
            let data;
            let contentHtml = '';

            if (type === 'artists') {
                const response = await fetch(`${API_BASE_URL}/artist/?id=${id}`);
                data = await response.json();
                console.log('Artist detail:', data);
                contentHtml = `
                    <h2>${data.name}</h2>
                    <img src="${API_BASE_URL}/cover/?id=${data.picture}" alt="${data.name}" style="width: 200px; height: 200px; object-fit: cover; border-radius: 50%;">
                    <p>Number of albums: ${data.albums ? data.albums.length : 'N/A'}</p>
                    <p>Number of tracks: ${data.tracks ? data.tracks.length : 'N/A'}</p>
                    <!-- Add more artist details as needed -->
                `;
            } else if (type === 'albums') {
                const response = await fetch(`${API_BASE_URL}/album/?id=${id}`);
                data = await response.json();
                console.log('Album detail:', data);
                contentHtml = `
                    <h2>${data.title}</h2>
                    <img src="${API_BASE_URL}/cover/?id=${data.cover}" alt="${data.title}" style="width: 250px; height: 250px; object-fit: cover;">
                    <p>Artist: ${data.artist ? data.artist.name : 'N/A'}</p>
                    <p>Release Date: ${data.releaseDate || 'N/A'}</p>
                    <h3>Tracks:</h3>
                    <ul>
                        ${data.tracks ? data.tracks.map(track => `<li>${track.title}</li>`).join('') : 'No tracks found.'}
                    </ul>
                    <!-- Add more album details as needed -->
                `;
            } else if (type === 'songs') {
                const response = await fetch(`${API_BASE_URL}/track/?id=${id}`);
                data = await response.json();
                console.log('Song detail:', data);

                const lyricsResponse = await fetch(`${API_BASE_URL}/lyrics/?id=${id}`);
                const lyricsData = await lyricsResponse.json();
                console.log('Lyrics:', lyricsData);

                contentHtml = `
                    <h2>${data.title}</h2>
                    <p>Artist: ${data.artist ? data.artist.name : 'N/A'}</p>
                    <p>Album: ${data.album ? data.album.title : 'N/A'}</p>
                    <h3>Lyrics:</h3>
                    <p>${lyricsData.lyrics || 'No lyrics available.'}</p>
                    <!-- Add more song details as needed -->
                `;
            }

            detailViewSection.innerHTML = `<button class="back-button">Back to Results</button>${contentHtml}`;
            document.querySelector('#detail-view .back-button').addEventListener('click', () => {
                resultsDisplaySection.style.display = 'block';
                detailViewSection.style.display = 'none';
            });

        } catch (error) {
            console.error(`Error fetching detail for ${type} with ID ${id}:`, error);
            detailViewSection.innerHTML = `<button class="back-button">Back to Results</button><h2>Error loading details.</h2><p>${error.message}</p>`;
            document.querySelector('#detail-view .back-button').addEventListener('click', () => {
                resultsDisplaySection.style.display = 'block';
                detailViewSection.style.display = 'none';
            });
        }
    }
});
