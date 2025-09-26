# Video Protos

Shared video processing protobuf definitions and client utilities for the streamer API.

## Installation

```bash
npm install video-protos
```

## Usage

### JavaScript

```javascript
const { createVideoClient, grpc, PROTO_PATH } = require('video-protos');

// Create client
const client = createVideoClient('localhost:5003');

// Use the client
const call = client.ProcessVideoSimple((error, result) => {
  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('Upload completed:', result);
  }
});
```

### TypeScript

```typescript
import { createVideoClient, VideoChunk, ProcessingResult } from 'video-protos';

// Create client
const client = createVideoClient('localhost:5003');

// Use with proper types
const result: ProcessingResult = await processVideo();
```

## Types

- `VideoChunk`: Represents a chunk of video data
- `ProcessingStatus`: Status updates during processing
- `ProcessingResult`: Final result of video processing
- `DownloadRequest`: Request for downloading a video

## Proto File

The package includes the `video.proto` file with service definitions for:

- `ProcessVideo`: Stream processing with status updates
- `ProcessVideoSimple`: Simple processing with final result
- `DownloadVideo`: Stream video chunks for download