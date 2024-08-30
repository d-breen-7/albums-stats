
// Define the number of rows per page
const rowsPerPage = 20;

// Variables to hold the current page number and pagination data
let currentPage = 1;
let totalPages = 1;

// Define the column names displayed
const headerMapping = {
  "album_name": "Album Name",
  "album_release": "Released",
  "artist_name": "Artist",
  "album_url": "Link",
};

// Define the searchable columns here
const searchableColumns = [
  "album_name",
  "artist_name"
];

// Function to sort data by artist_name
function sortDataByArtistName(data) {
  return data.sort((a, b) => {
    const artistA = a.artist_name.toLowerCase();
    const artistB = b.artist_name.toLowerCase();
    if (artistA < artistB) return -1;
    if (artistA > artistB) return 1;
    return 0;
  });
}

// Function to format the release_date
function formatDate(dateString) {
  if (!dateString) return ''; // Return empty string if no date provided

  // Ensure dateString is a string
  const dateStr = String(dateString);

  // Split the date string by hyphen
  const parts = dateStr.split('-');

  // Determine the date format based on the number of parts
  if (parts.length === 1) {
    // Only year is present
    return parts[0];
  } else {
    // Year and month are present (ignore day if provided)
    const yearMonthDate = new Date(parts[0], parts[1] - 1); // Month is 0-indexed
    return yearMonthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }
}

d3.json(
  "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/all-albums"
).then(function(response) {
  
  let data = response.data;

  // Create the table headers
  const columns = Object.keys(data[0]);
  const columnClasses = {
    'artist_name': 'column-artist',
    'album_name': 'column-album',
    'release_date': 'column-release-date',
    'album_url': 'column-album-url',
    'album_cover': 'column-album-cover'
  };
  
  const headers = columns.map(column => headerMapping[column] || column); // Use the mapping or default to the original name
  
  d3.select("#tableHeader")
  d3.select("#tableHeader")
  .selectAll("th")
  .data(headers)
  .enter()
  .append("th")
  .text(d => d)
  .attr("class", d => columnClasses[d] || '');

  // Calculate the total number of pages
  totalPages = Math.ceil(data.length / rowsPerPage);

  // Function to update the table body with a specific page of data
  function updateTableBody(page, dataSubset) {
    // Calculate the slice of data to display
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = dataSubset.slice(start, end);

    // Clear the table body
    d3.select("#tableBody").selectAll("tr").remove();

    // Populate the table body with page data
    const rows = d3.select("#tableBody")
      .selectAll("tr")
      .data(pageData)
      .enter()
      .append("tr");

    rows.selectAll("td")
      .data(row => columns.map(column => ({ value: row[column], column: column })))
      .enter()
      .append("td")
      .html(d => {
        if (d.column === 'album_url' && d.value) {
          // Get the corresponding album URL
          return `<a href="${d.value}" target="_blank"><i class="fas fa-headphones headphones-icon"></i></a>`;
        } else if (d.column === 'album_release') {
          // Format the release_date column
          return formatDate(d.value);
        } else if (d.column != 'album_url') {
          // Return the text as is
          return d.value;
        }
      })
      .attr("class", d => columnClasses[d.column] || '')
      .attr("class", d => {
        // Apply the center-cell class to the album_cover_url column
        return d.column === 'album_url' ? 'center-cell' : '';
      })

    // Update the page information
    d3.select("#pageInfo").text(`Page ${page} of ${totalPages}`);
  }

  // Initially display all data
  updateTableBody(currentPage, data);

  // Add event listeners for the pagination buttons
  d3.select("#prevButton").on("click", function() {
    if (currentPage > 1) {
      currentPage--;
      updateTableBody(currentPage, data);
    }
  });

  d3.select("#nextButton").on("click", function() {
    if (currentPage < totalPages) {
      currentPage++;
      updateTableBody(currentPage, data);
    }
  });

  // Implement the search functionality
  d3.select("#searchInput").on("input", function() {
    const searchTerm = this.value.toLowerCase();
    const filteredData = data.filter(row => {
      // Only search within the searchable columns
      return searchableColumns.some(column => {
        return (row[column].toString().toLowerCase().indexOf(searchTerm) > -1);
      });
    });

    // Sort the filtered data by artist_name
    const sortedFilteredData = sortDataByArtistName(filteredData);

    // Reset to the first page and update total pages
    currentPage = 1;
    totalPages = Math.ceil(sortedFilteredData.length / rowsPerPage);

    // Update the table with the sorted and filtered data starting from the first page
    updateTableBody(currentPage, sortedFilteredData);
  
  });
}).catch(error => {
  // console.error('Error loading the CSV file:', error);
});
