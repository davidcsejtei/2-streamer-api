const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../proto/video.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const videoProto = grpc.loadPackageDefinition(packageDefinition).video;

function createVideoClient(address, credentials) {
  const creds = credentials || grpc.credentials.createInsecure();
  return new videoProto.VideoProcessor(address, creds);
}

module.exports = {
  createVideoClient,
  grpc,
  protoLoader,
  videoProto
};