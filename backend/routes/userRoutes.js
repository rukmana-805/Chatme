const express = require('express');
const router = express.Router();
const {
  searchUsers,
  sendFollowRequest,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  getFriends,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, searchUsers);
router.post('/follow-request', protect, sendFollowRequest);
router.get('/follow-requests', protect, getFollowRequests);
router.put('/follow-request/:requestId/accept', protect, acceptFollowRequest);
router.put('/follow-request/:requestId/reject', protect, rejectFollowRequest);
router.get('/friends', protect, getFriends);

module.exports = router;
