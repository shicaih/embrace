# Embrace:
Embrace is an interactive, collaborative and transformative learning experience realized by a series of static pages, a game engine and a server.

This repo contains two main folders:
Client and Server
Client is a series of static pages for the phone and bigscreen, and a page for the interactive game. 
Server is for handling data from phones and send them to phones.
Both Client and Server are developed with Node.js.

To start the whole experience, you need to start the client and the server app.
1st step: In the Client directory, first use npm install to install all the dependencies.
          Then type node app.js to start the client app.
2nd step: In the Server directory, first use npm install to install all the dependencies.
          Then type node server.js to start the server app.
          
After the server starts running, all necessary interactions can be done via the front-end on the bigscreen. So no extra maintainace is needed except the server crash.
No data is stored on the server disk so it's safe to reboot the server once any session is done.

The client will read the server address in the file scripts/config.js, and the server address should be changed if you want to deploy on another server.

