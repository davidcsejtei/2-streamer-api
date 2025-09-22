import { Injectable } from '@nestjs/common';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { toArray } from 'rxjs/operators';
import * as fs from 'fs';
import * as path from 'path';

export interface VideoChunk {
  videoId: string;
  chunkIndex: number;
  data: Buffer;
}

export interface ProcessingStatus {
  videoId: string;
  chunkIndex: number;
  status: string;
  errorMessage?: string;
}

export interface ProcessingResult {
  videoId: string;
  success: boolean;
  outputUrl?: string;
}

export interface DownloadRequest {
  videoId: string;
}

@Injectable()
export class VideoService {
  private videoChunks = new Map<string, VideoChunk[]>();

  processVideo(chunks$: Observable<VideoChunk>): Observable<ProcessingStatus> {
    const statusSubject = new Subject<ProcessingStatus>();

    chunks$.subscribe({
      next: (chunk) => {
        const { videoId, chunkIndex } = chunk;

        if (!this.videoChunks.has(videoId)) {
          this.videoChunks.set(videoId, []);
        }

        this.videoChunks.get(videoId)!.push(chunk);

        statusSubject.next({
          videoId,
          chunkIndex,
          status: 'IN_PROGRESS',
        });

        statusSubject.next({
          videoId,
          chunkIndex,
          status: 'DONE',
        });
      },
      error: (error) => {
        statusSubject.error(error);
      },
      complete: () => {
        statusSubject.complete();
      },
    });

    return statusSubject.asObservable();
  }

  async processVideoSimple(chunks$: Observable<VideoChunk>): Promise<ProcessingResult> {
    console.log('processVideoSimple service method called');

    try {
      console.log('Converting stream to array using firstValueFrom and toArray');
      const chunks = await firstValueFrom(chunks$.pipe(toArray()));
      console.log(`Received ${chunks.length} chunks from stream`);

      if (chunks.length === 0) {
        console.log('No chunks received, returning failure');
        return {
          videoId: 'unknown',
          success: false,
          outputUrl: undefined,
        };
      }

      const videoId = chunks[0].videoId;
      this.videoChunks.set(videoId, chunks);

      try {
        this.saveVideoFile(videoId, chunks);
        console.log(`Video file saved successfully: ${videoId}.mov`);
        return {
          videoId,
          success: true,
          outputUrl: `/videos/${videoId}.mov`,
        };
      } catch (error) {
        console.error(`Error saving video file ${videoId}:`, error);
        return {
          videoId,
          success: false,
          outputUrl: undefined,
        };
      }
    } catch (error) {
      console.error('Error processing video stream:', error);
      return {
        videoId: 'unknown',
        success: false,
        outputUrl: undefined,
      };
    }
  }

  getVideoChunks(videoId: string): VideoChunk[] {
    return this.videoChunks.get(videoId) || [];
  }

  private saveVideoFile(videoId: string, chunks: VideoChunk[]): void {
    const outputDir = path.join(__dirname, '../../videos/processed');
    const outputPath = path.join(outputDir, `${videoId}.mov`);

    console.log(`Attempting to save video file: ${outputPath}`);
    console.log(`Number of chunks to save: ${chunks.length}`);

    if (!fs.existsSync(outputDir)) {
      console.log(`Creating output directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    const videoData = Buffer.concat(sortedChunks.map(chunk => chunk.data));

    console.log(`Total video data size: ${videoData.length} bytes`);
    fs.writeFileSync(outputPath, videoData);
    console.log(`Video file written to: ${outputPath}`);
  }

  streamVideo(videoPath: string): Buffer[] {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    const data = fs.readFileSync(videoPath);
    const chunkSize = 64 * 1024;
    const chunks: Buffer[] = [];

    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.subarray(i, i + chunkSize));
    }

    return chunks;
  }

  getOriginalVideo(): { path: string; exists: boolean } {
    const videoPath = path.join(__dirname, '../../videos/01.mov');
    return {
      path: videoPath,
      exists: fs.existsSync(videoPath)
    };
  }

  downloadVideo(request: DownloadRequest): Observable<VideoChunk> {
    const { videoId } = request;
    const subject = new Subject<VideoChunk>();

    // Check for processed video first
    const processedVideoPath = path.join(__dirname, '../../videos/processed', `${videoId}.mov`);

    let videoPath: string;
    if (fs.existsSync(processedVideoPath)) {
      videoPath = processedVideoPath;
    } else {
      // Fallback to original video if videoId matches
      const originalVideoPath = path.join(__dirname, '../../videos/01.mov');
      if (fs.existsSync(originalVideoPath)) {
        videoPath = originalVideoPath;
      } else {
        subject.error(new Error(`Video not found: ${videoId}`));
        return subject.asObservable();
      }
    }

    try {
      const chunks = this.streamVideo(videoPath);

      // Stream chunks asynchronously with a small delay
      let chunkIndex = 0;
      const streamChunks = () => {
        if (chunkIndex < chunks.length) {
          subject.next({
            videoId,
            chunkIndex,
            data: chunks[chunkIndex]
          });
          chunkIndex++;
          setTimeout(streamChunks, 0); // Use setTimeout instead of setImmediate
        } else {
          subject.complete();
        }
      };

      // Add a small delay before starting to ensure client is ready
      setTimeout(streamChunks, 10);
    } catch (error) {
      subject.error(error);
    }

    return subject.asObservable();
  }
}