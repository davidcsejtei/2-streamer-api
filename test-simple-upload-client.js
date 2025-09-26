const { createVideoClient } = require('video-protos')
const fs = require('fs')

// Create client
const client = createVideoClient('localhost:5003')

// Create a small test video file (just dummy data)
function createTestVideoFile() {
  const testData = Buffer.alloc(1024 * 100, 'A') // 100KB of 'A' characters
  const testPath = './test-small-video.mov'
  fs.writeFileSync(testPath, testData)
  return testPath
}

async function uploadSmallVideo(videoPath, videoId) {
  console.log(`Starting upload of video: ${videoPath} with ID: ${videoId}`)

  // Read video file
  const videoData = fs.readFileSync(videoPath)
  const chunkSize = 10 * 1024 // 10KB chunks for easier testing
  const totalChunks = Math.ceil(videoData.length / chunkSize)

  console.log(`Video size: ${videoData.length} bytes`)
  console.log(`Will send ${totalChunks} chunks of ${chunkSize} bytes each`)

  return new Promise((resolve, reject) => {
    const call = client.ProcessVideoSimple((error, result) => {
      if (error) {
        console.error('Upload failed:', error)
        reject(error)
      } else {
        console.log('Upload completed successfully!')
        console.log('Result:', result)
        resolve(result)
      }
    })

    // Send video chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, videoData.length)
      const chunkData = videoData.subarray(start, end)

      const chunk = {
        videoId: videoId,
        chunkIndex: i,
        data: chunkData
      }

      console.log(`Sending chunk ${i + 1}/${totalChunks} (${chunkData.length} bytes)`)
      call.write(chunk)
    }

    console.log(`Sent all ${totalChunks} chunks, ending stream...`)
    call.end()
  })
}

// Test the upload
async function main() {
  try {
    console.log('Creating test video file...')
    const testVideoPath = createTestVideoFile()

    console.log('Testing video upload to server...')
    const videoId = `test-small-${Date.now()}`

    console.log(`Uploading ${testVideoPath} with ID: ${videoId}`)

    const result = await uploadSmallVideo(testVideoPath, videoId)

    console.log('Upload test completed successfully!')
    console.log('Final result:', JSON.stringify(result, null, 2))

    // Verify the uploaded file exists
    const expectedPath = `./videos/uploaded_videos/${videoId}.mov`
    if (fs.existsSync(expectedPath)) {
      const uploadedSize = fs.statSync(expectedPath).size
      const originalSize = fs.statSync(testVideoPath).size
      console.log(`✅ Uploaded file verified at: ${expectedPath}`)
      console.log(`📊 Original size: ${originalSize} bytes`)
      console.log(`📊 Uploaded size: ${uploadedSize} bytes`)
      console.log(`${originalSize === uploadedSize ? '✅' : '❌'} Size match: ${originalSize === uploadedSize}`)
    } else {
      console.log(`❌ Uploaded file not found at: ${expectedPath}`)
    }

    // Clean up test file
    fs.unlinkSync(testVideoPath)
    console.log('Test file cleaned up')

  } catch (error) {
    console.error('Upload test failed:', error)
  }

  // Close the client
  setTimeout(() => {
    process.exit(0)
  }, 1000)
}

main()