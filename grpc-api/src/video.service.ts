import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

interface VideoChunk {
  videoId: string;
  chunkIndex: number;
  data: Buffer;
}

interface ProcessingStatus {
  videoId: string;
  chunkIndex: number;
  status: string;
  errorMessage?: string;
}

interface ProcessingResult {
  videoId: string;
  success: boolean;
  outputUrl?: string;
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

        setTimeout(() => {
          statusSubject.next({
            videoId,
            chunkIndex,
            status: 'DONE',
          });
        }, 100);
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
    const chunks: VideoChunk[] = [];

    return new Promise((resolve, reject) => {
      chunks$.subscribe({
        next: (chunk) => {
          chunks.push(chunk);
        },
        error: (error) => {
          reject({
            videoId: chunks[0]?.videoId || 'unknown',
            success: false,
            outputUrl: undefined,
          });
        },
        complete: () => {
          if (chunks.length === 0) {
            resolve({
              videoId: 'unknown',
              success: false,
              outputUrl: undefined,
            });
            return;
          }

          const videoId = chunks[0].videoId;
          this.videoChunks.set(videoId, chunks);

          setTimeout(() => {
            resolve({
              videoId,
              success: true,
              outputUrl: `/videos/${videoId}/processed.mp4`,
            });
          }, 1000);
        },
      });
    });
  }

  getVideoChunks(videoId: string): VideoChunk[] {
    return this.videoChunks.get(videoId) || [];
  }
}