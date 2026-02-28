@echo off
cd server
SET MONGODB_URI=mongodb+srv://sanskritig1705:123SANrubi@cluster0.dva8nl1.mongodb.net/cep-survey?retryWrites=true&w=majority
echo Starting server with MongoDB Atlas...
node index.js
pause
