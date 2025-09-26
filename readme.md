# Video Streaming API

This repository contains a gRPC-based video streaming API built with NestJS. The API allows users to download video files.

## Prerequisites

Create a folder called "videos" to the root folder and put a .mov video file called "grpc-jo.mov". (OR modify source code to search for annother video file)

## Dependency installation - local

From the root folder:
```
npm i
```

From the grpc-api folder:
```
npm i
```
## Run application

### Run server-1 (video owner)

From the grpc-api folder:
```
npm start
```

### Run server-2 (video download requester)

From root folder:
```
node server2.js
```
Now server2 starts to download video file in chunks provided by the server-1 api.
