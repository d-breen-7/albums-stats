
[Album Tracker:](https://d-breen-7.github.io/albums-stats/)

Webpage to display some stats about the albums I listen to. I track all the music I listen to on Spotify and then figure out when I listen to a complete album. 

All this is done using various AWS Lambda functions which track, analyse and process the data based on schudaled jobs and triggers. I also have some functions to manage my Spotify library and aggregate the data.

This aggregated data is accessed using an API built using FastAPI. Data visualisations are built using D3.js.
