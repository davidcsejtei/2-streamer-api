const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')

// Load the proto file
const PROTO_PATH = './grpc-api/proto/video.proto'
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
})

const videoProto = grpc.loadPackageDefinition(packageDefinition).video

// Create client
const client = new videoProto.VideoProcessor(
  'localhost:5003',
  grpc.credentials.createInsecure()
)

async function debugDownload(videoId) {
  console.log(`Starting download for video: ${videoId}`)

  const request = { videoId }
  const call = client.DownloadVideo(request)

  const chunks = []
  let chunkCount = 0

  return new Promise((resolve, reject) => {
    call.on('data', (chunk) => {
      chunkCount++
      console.log(`Chunk #${chunkCount}: index=${chunk.chunkIndex}, size=${chunk.data.length}`)

      // Log first few bytes of first 3 chunks
      if (chunkCount <= 3) {
        const preview = Array.from(chunk.data.subarray(0, 16))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ')
        console.log(`  Data preview: ${preview}`)
      }

      chunks.push({
        index: chunk.chunkIndex,
        data: chunk.data
      })
    })

    call.on('end', () => {
      console.log(`Download complete! Total chunks received: ${chunks.length}`)

      // Check if we have chunk 0
      const hasChunk0 = chunks.some(c => c.index === 0)
      console.log(`Has chunk 0: ${hasChunk0}`)

      // Show index range
      const indices = chunks.map(c => c.index).sort((a, b) => a - b)
      console.log(`Index range: ${indices[0]} to ${indices[indices.length - 1]}`)

      resolve(chunks)
    })

    call.on('error', (error) => {
      console.error('Download error:', error)
      reject(error)
    })
  })
}

// Test the download
async function main() {
  try {
    await debugDownload('test-video-01')
  } catch (error) {
    console.error('Test failed:', error)
  }

  process.exit(0)
}

main()