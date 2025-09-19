import { Controller } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { VideoService } from './video.service';

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

@Controller()
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @GrpcStreamMethod('VideoProcessor', 'ProcessVideo')
  processVideo(chunks$: Observable<VideoChunk>): Observable<ProcessingStatus> {
    return this.videoService.processVideo(chunks$);
  }

  @GrpcStreamMethod('VideoProcessor', 'ProcessVideoSimple')
  async processVideoSimple(chunks$: Observable<VideoChunk>): Promise<ProcessingResult> {
    return this.videoService.processVideoSimple(chunks$);
  }
}