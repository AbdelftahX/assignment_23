import { createImageMulterOptions } from './image-upload.multer';

export const PROFILE_PIC_URL_PREFIX = '/uploads/profile-pics';

export const profilePicMulterOptions = createImageMulterOptions('profile-pics');
