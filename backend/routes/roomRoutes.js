const express = require('express');
const router = express.Router();
const {
  createRoom,
  joinRoomByCode,
  getUserRooms,
  getRoomDetails,
  removeMember,
  getRoomMessages,
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createRoom);
router.post('/join', protect, joinRoomByCode);
router.get('/my-rooms', protect, getUserRooms);
router.get('/:roomId', protect, getRoomDetails);
router.post('/:roomId/remove-member', protect, removeMember);
router.get('/:roomId/messages', protect, getRoomMessages);

module.exports = router;
