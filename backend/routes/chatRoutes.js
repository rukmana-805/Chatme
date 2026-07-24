const express = require('express');
const router = express.Router();
const {
  getPrivateMessages,
  uploadImage,
  clearPrivateChat,
  clearRoomChat,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/messages/:targetUserId', protect, getPrivateMessages);
router.post('/upload', protect, upload.single('image'), uploadImage);
router.delete('/clear/private/:targetUserId', protect, clearPrivateChat);
router.delete('/clear/room/:roomId', protect, clearRoomChat);

module.exports = router;
