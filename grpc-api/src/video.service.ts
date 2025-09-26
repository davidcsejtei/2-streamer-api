import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import { VideoChunk, ProcessingStatus, DownloadRequest } from 'video-protos';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private videoChunks = new Map<string, VideoChunk[]>();

  /**
   * Visszaadja egy adott videó ID-hoz tartozó összes chunk-ot a memóriából.
   * Ha nincs ilyen videó, üres tömböt ad vissza.
   */
  getVideoChunks(videoId: string): VideoChunk[] {
    this.logger.log(`Getting video chunks for videoId: ${videoId}`);
    return this.videoChunks.get(videoId) || [];
  }

  /**
   * Beolvas egy videó fájlt és 64KB-os chunk-okra bontja.
   * Visszaadja a chunk-ok tömbjét Buffer formátumban.
   */
  streamVideo(videoPath: string): Buffer[] {
    this.logger.log(`Streaming video from path: ${videoPath}`);
    if (!fs.existsSync(videoPath)) {
      this.logger.error(`Video file not found: ${videoPath}`);
      throw new Error(`Video file not found: ${videoPath}`);
    }

    const data = fs.readFileSync(videoPath);
    const chunkSize = 64 * 1024;
    const chunks: Buffer[] = [];

    this.logger.log(`Video file size: ${data.length} bytes, will create ${Math.ceil(data.length / chunkSize)} chunks`);

    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.subarray(i, i + chunkSize));
    }

    this.logger.log(`Created ${chunks.length} chunks for streaming`);
    return chunks;
  }

  /**
   * Visszaadja az eredeti teszt videó fájl elérési útját és létezési státuszát.
   * A '../../videos/01.mov' fájlra hivatkozik.
   */
  getOriginalVideo(): { path: string; exists: boolean } {
    const videoPath = path.join(__dirname, '../../videos/01.mov');
    this.logger.log(`Getting original video info: ${videoPath}`);
    return {
      path: videoPath,
      exists: fs.existsSync(videoPath),
    };
  }

  /**
   * Stream-ben küldi vissza egy videó chunk-jait letöltéshez.
   * Először feldolgozott videót keres, ha nincs, az eredeti videóra vált vissza.
   * Aszinkron módon küldi a chunk-okat kis késleltetéssel.
   */
  downloadVideo(request: DownloadRequest): Observable<VideoChunk> {
    const { videoId } = request;
    this.logger.log(`Starting download for videoId: ${videoId}`);
    const subject = new Subject<VideoChunk>();

    // Check for processed video first
    const processedVideoPath = path.join(
      __dirname,
      '../../videos/processed',
      `${videoId}.mov`,
    );

    let videoPath: string;
    if (fs.existsSync(processedVideoPath)) {
      this.logger.log(`Using processed video: ${processedVideoPath}`);
      videoPath = processedVideoPath;
    } else {
      // Fallback to original video if videoId matches
      const originalVideoPath = path.join(__dirname, '../../videos/01.mov');
      if (fs.existsSync(originalVideoPath)) {
        this.logger.log(`Using original video as fallback: ${originalVideoPath}`);
        videoPath = originalVideoPath;
      } else {
        this.logger.error(`Video not found: ${videoId}`);
        subject.error(new Error(`Video not found: ${videoId}`));
        return subject.asObservable();
      }
    }

    try {
      const chunks = this.streamVideo(videoPath);

      // Stream chunks asynchronously with a small delay
      let chunkIndex = 0;
      const totalChunks = chunks.length;
      const streamChunks = () => {
        if (chunkIndex < chunks.length) {
          const progress = ((chunkIndex + 1) / totalChunks * 100).toFixed(1);
          this.logger.log(`Streaming chunk ${chunkIndex + 1}/${totalChunks} (${progress}%) for video ${videoId}`);

          subject.next({
            videoId,
            chunkIndex,
            data: chunks[chunkIndex],
          });
          chunkIndex++;
          setTimeout(streamChunks, 0);
        } else {
          this.logger.log(`Streaming completed for video ${videoId} - sent ${totalChunks} chunks`);
          subject.complete();
        }
      };

      // Add a small delay before starting to ensure client is ready
      setTimeout(streamChunks, 10);
    } catch (error) {
      this.logger.error(`Error streaming video ${videoId}:`, error);
      subject.error(error);
    }

    return subject.asObservable();
  }
}
