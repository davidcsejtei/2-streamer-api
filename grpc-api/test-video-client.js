const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const packageDefinition = protoLoader.loadSync(
  path.join(__dirname, 'proto/video.proto'),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  }
);

const videoProto = grpc.loadPackageDefinition(packageDefinition).video;

const client = new videoProto.VideoProcessor(
  'localhost:5003',
  grpc.credentials.createInsecure()
);

console.log('Testing video processing endpoints...\n');

// Test ProcessVideoSimple (client streaming)
function testProcessVideoSimple() {
  console.log('Testing ProcessVideoSimple...');

  const call = client.processVideoSimple((error, result) => {
    if (!error) {
      console.log('ProcessVideoSimple result:', result);
    } else {
      console.error('ProcessVideoSimple error:', error);
    }
  });

  // Send video chunks
  const videoId = 'test-video-123';

  call.write({
    videoId: videoId,
    chunkIndex: 0,
    data: Buffer.from('Fake video chunk 1 data')
  });

  call.write({
    videoId: videoId,
    chunkIndex: 1,
    data: Buffer.from('Fake video chunk 2 data')
  });

  call.write({
    videoId: videoId,
    chunkIndex: 2,
    data: Buffer.from('Fake video chunk 3 data')
  });

  call.end();
}

// Test ProcessVideo (bidirectional streaming)
function testProcessVideo() {
  console.log('\nTesting ProcessVideo (bidirectional streaming)...');

  const call = client.processVideo();

  call.on('data', (status) => {
    console.log('Received status:', status);
  });

  call.on('end', () => {
    console.log('Stream ended');
  });

  call.on('error', (error) => {
    console.error('Stream error:', error);
  });

  // Send video chunks
  const videoId = 'test-video-456';

  call.write({
    videoId: videoId,
    chunkIndex: 0,
    data: Buffer.from('Streaming video chunk 1 data')
  });

  setTimeout(() => {
    call.write({
      videoId: videoId,
      chunkIndex: 1,
      data: Buffer.from('Streaming video chunk 2 data')
    });
  }, 500);

  setTimeout(() => {
    call.write({
      videoId: videoId,
      chunkIndex: 2,
      data: Buffer.from('Streaming video chunk 3 data')
    });
    call.end();
  }, 1000);
}

// Run tests
testProcessVideoSimple();

setTimeout(() => {
  testProcessVideo();
}, 2000);