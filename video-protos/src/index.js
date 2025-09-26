const { createVideoClient, grpc, protoLoader, videoProto } = require('./client/grpc-client');
const path = require('path');

module.exports = {
  createVideoClient,
  grpc,
  protoLoader,
  videoProto,
  PROTO_PATH: path.join(__dirname, 'proto/video.proto')
};