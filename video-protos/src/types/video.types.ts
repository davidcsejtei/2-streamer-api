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