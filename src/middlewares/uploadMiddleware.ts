import { UploadApiOptions, UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const uploadImageFromBuffer = (buffer: Buffer, options?: UploadApiOptions): Promise<UploadApiResponse> => {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'moji-chat/avatars',
        resource_type: 'image',
        transformation: [
          {
            width: 300,
            height: 300,
            crop: 'fill'
          }
        ],
        ...options
      },

      (error, result) => {
        if (error) {
          reject(error);
        } else if (!result) {
          reject(new Error('Cloudinary upload returned no result'));
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};
