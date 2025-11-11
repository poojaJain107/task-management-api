const upload = require('../config/multer');

// Middleware to handle single file upload for profile picture
// Field name: 'profilePicture'
const uploadProfilePictureMiddleware = upload.single('profilePicture');

module.exports = uploadProfilePictureMiddleware;
