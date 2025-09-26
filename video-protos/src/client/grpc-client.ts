import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

const PROTO_PATH = path.join(__dirname, '../proto/video.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const videoProto = grpc.loadPackageDefinition(packageDefinition).video as any;

export interface VideoProcessorClient {
  ProcessVideo: any;
  ProcessVideoSimple: any;
  DownloadVideo: any;
}

export function createVideoClient(address: string, credentials?: grpc.ChannelCredentials): VideoProcessorClient {
  const creds = credentials || grpc.credentials.createInsecure();
  return new videoProto.VideoProcessor(address, creds);
}

export { grpc, protoLoader, videoProto };