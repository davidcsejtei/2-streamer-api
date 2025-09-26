const { createVideoClient } = require('video-protos')
const fs = require('fs')
const path = require('path')

// Create client
const client = createVideoClient('localhost:5003')

async function uploadVideo(videoPath, videoId) {
  console.log(`Starting upload of video: ${videoPath} with ID: ${videoId}`)

  // Check if video file exists
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`)
  }

  // Read video file
  const videoData = fs.readFileSync(videoPath)
  const chunkSize = 64 * 1024 // 64KB chunks
  const totalChunks = Math.ceil(videoData.length / chunkSize)

  console.log(`Video size: ${videoData.length} bytes`)
  console.log(`Will send ${totalChunks} chunks of ${chunkSize} bytes each`)

  return new Promise((resolve, reject) => {
    // Using ProcessVideoSimple for cleaner response
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
    let sentChunks = 0
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
      sentChunks++

      // Add a small delay to prevent overwhelming the server
      if (i < totalChunks - 1) {
        // Use setImmediate for non-blocking operation
        setImmediate(() => {})
      }
    }

    console.log(`Sent all ${sentChunks} chunks, ending stream...`)
    call.end()
  })
}

// Test the upload
async function main() {
  try {
    console.log('Testing video upload to server...')

    // Use the original video file for testing
    const videoPath = './videos/01.mov'
    const videoId = `uploaded-test-${Date.now()}`

    console.log(`Uploading ${videoPath} with ID: ${videoId}`)

    const result = await uploadVideo(videoPath, videoId)

    console.log('Upload test completed successfully!')
    console.log('Final result:', JSON.stringify(result, null, 2))

    // Verify the uploaded file exists
    const expectedPath = `./videos/uploaded_videos/${videoId}.mov`
    if (fs.existsSync(expectedPath)) {
      const uploadedSize = fs.statSync(expectedPath).size
      const originalSize = fs.statSync(videoPath).size
      console.log(`✅ Uploaded file verified at: ${expectedPath}`)
      console.log(`📊 Original size: ${originalSize} bytes`)
      console.log(`📊 Uploaded size: ${uploadedSize} bytes`)
      console.log(`${originalSize === uploadedSize ? '✅' : '❌'} Size match: ${originalSize === uploadedSize}`)
    } else {
      console.log(`❌ Uploaded file not found at: ${expectedPath}`)
    }

  } catch (error) {
    console.error('Upload test failed:', error)
  }

  // Close the client
  setTimeout(() => {
    process.exit(0)
  }, 1000)
}

main()