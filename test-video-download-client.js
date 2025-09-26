const { createVideoClient } = require('video-protos')
const fs = require('fs')
const path = require('path')

// Create client
const client = createVideoClient('localhost:5003')

async function downloadVideo(videoId) {
  console.log(`Starting download for video: ${videoId}`)

  const request = { videoId }
  const call = client.DownloadVideo(request)

  const chunks = []
  let totalSize = 0

  return new Promise((resolve, reject) => {
    call.on('data', (chunk) => {
      console.log(
        `Received chunk ${chunk.chunkIndex}, size: ${chunk.data.length} bytes`
      )
      chunks.push({
        index: chunk.chunkIndex,
        data: chunk.data
      })
      totalSize += chunk.data.length
    })

    call.on('end', () => {
      console.log(
        `Download complete! Total chunks: ${chunks.length}, Total size: ${totalSize} bytes`
      )

      // Sort chunks by index to ensure correct order
      chunks.sort((a, b) => a.index - b.index)

      // Combine all chunks into single buffer
      const videoData = Buffer.concat(chunks.map((chunk) => chunk.data))

      // Save to root folder
      const outputPath = path.join(__dirname, `downloaded_${videoId}.mov`)
      fs.writeFileSync(outputPath, videoData)

      console.log(`Video saved to: ${outputPath}`)
      resolve(outputPath)
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
    console.log('Testing video download from server...')

    // Test with a video ID (assuming there's a processed video or fallback to original)
    const videoId = '01'
    await downloadVideo(videoId)

    console.log('Download test completed successfully!')
  } catch (error) {
    console.error('Test failed:', error)
  }

  // Close the client
  setTimeout(() => {
    process.exit(0)
  }, 1000)
}

main()
