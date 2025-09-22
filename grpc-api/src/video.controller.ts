import { Controller } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { VideoService, VideoChunk, ProcessingStatus, ProcessingResult } from './video.service';
import type { DownloadRequest } from './video.service';

@Controller()
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @GrpcStreamMethod('VideoProcessor', 'ProcessVideo')
  processVideo(chunks$: Observable<VideoChunk>): Observable<ProcessingStatus> {
    return this.videoService.processVideo(chunks$);
  }

  @GrpcStreamMethod('VideoProcessor', 'ProcessVideoSimple')
  async processVideoSimple(chunks$: Observable<VideoChunk>): Promise<ProcessingResult> {
    console.log('ProcessVideoSimple method called');
    return this.videoService.processVideoSimple(chunks$);
  }

  getOriginalVideo(): { path: string; exists: boolean } {
    return this.videoService.getOriginalVideo();
  }

  getVideoChunks(videoId: string): VideoChunk[] {
    return this.videoService.getVideoChunks(videoId);
  }

  @GrpcMethod('VideoProcessor', 'DownloadVideo')
  downloadVideo(request: DownloadRequest): Observable<VideoChunk> {
    return this.videoService.downloadVideo(request);
  }
}