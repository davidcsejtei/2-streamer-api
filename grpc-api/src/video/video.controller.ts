import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { VideoService } from './video.service';
import { VideoChunk, ProcessingStatus } from 'video-protos';
import type { DownloadRequest } from 'video-protos';

@Controller()
export class VideoController {
  private readonly logger = new Logger(VideoController.name);

  constructor(private readonly videoService: VideoService) {}

  @GrpcMethod('VideoProcessor', 'DownloadVideo')
  downloadVideo(request: DownloadRequest): Observable<VideoChunk> {
    this.logger.log(`Downloading video: ${request.videoId}`);
    return this.videoService.downloadVideo(request);
  }

  getOriginalVideo(): { path: string; exists: boolean } {
    return this.videoService.getOriginalVideo();
  }

  getVideoChunks(videoId: string): VideoChunk[] {
    return this.videoService.getVideoChunks(videoId);
  }
}
