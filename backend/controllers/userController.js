const User = require('../models/User');
const FollowRequest = require('../models/FollowRequest');
const mongoose = require('mongoose');

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.json([]);
    }

    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);

    let searchFilter = {
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: query.trim(), $options: 'i' } },
        { email: { $regex: query.trim(), $options: 'i' } },
      ],
    };

    if (mongoose.Types.ObjectId.isValid(query.trim())) {
      searchFilter.$or.push({ _id: query.trim() });
    }

    const users = await User.find(searchFilter).select('username email avatar bio isOnline lastSeen');

    const formattedUsers = await Promise.all(
      users.map(async (u) => {
        const isFriend = currentUser.friends.includes(u._id);

        const sentReq = await FollowRequest.findOne({
          requester: currentUserId,
          recipient: u._id,
          status: 'pending',
        });

        const receivedReq = await FollowRequest.findOne({
          requester: u._id,
          recipient: currentUserId,
          status: 'pending',
        });

        return {
          _id: u._id,
          username: u.username,
          email: u.email,
          avatar: u.avatar,
          bio: u.bio,
          isOnline: u.isOnline,
          lastSeen: u.lastSeen,
          isFriend,
          hasSentRequest: !!sentReq,
          hasReceivedRequest: !!receivedReq,
          requestId: sentReq ? sentReq._id : receivedReq ? receivedReq._id : null,
        };
      })
    );

    res.json(formattedUsers);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
};

exports.sendFollowRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user._id;

    if (requesterId.toString() === recipientId) {
      return res.status(400).json({ message: 'You cannot send a follow request to yourself.' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    const currentUser = await User.findById(requesterId);
    if (currentUser.friends.includes(recipientId)) {
      return res.status(400).json({ message: 'You are already connected with this user.' });
    }

    const existingReq = await FollowRequest.findOne({
      requester: requesterId,
      recipient: recipientId,
    });

    if (existingReq) {
      if (existingReq.status === 'pending') {
        return res.status(400).json({ message: 'Follow request already sent and pending.' });
      } else if (existingReq.status === 'accepted') {
        return res.status(400).json({ message: 'Follow request already accepted.' });
      } else {
        existingReq.status = 'pending';
        await existingReq.save();
        return res.json({ message: 'Follow request sent again successfully.', followRequest: existingReq });
      }
    }

    const followReq = await FollowRequest.create({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending',
    });

    res.status(201).json({ message: 'Follow request sent successfully.', followRequest: followReq });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ message: 'Error sending follow request' });
  }
};

exports.getFollowRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const pendingRequests = await FollowRequest.find({
      recipient: userId,
      status: 'pending',
    }).populate('requester', 'username email avatar bio isOnline');

    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching follow requests' });
  }
};

exports.acceptFollowRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FollowRequest.findById(requestId);
    if (!request || request.recipient.toString() !== userId.toString()) {
      return res.status(404).json({ message: 'Follow request not found or unauthorized.' });
    }

    request.status = 'accepted';
    await request.save();

    await User.findByIdAndUpdate(request.requester, {
      $addToSet: { friends: request.recipient },
    });

    await User.findByIdAndUpdate(request.recipient, {
      $addToSet: { friends: request.requester },
    });

    res.json({ message: 'Follow request accepted!', request });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Error accepting follow request' });
  }
};

exports.rejectFollowRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FollowRequest.findById(requestId);
    if (!request || request.recipient.toString() !== userId.toString()) {
      return res.status(404).json({ message: 'Follow request not found or unauthorized.' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Follow request rejected', request });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting follow request' });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'username email avatar bio isOnline lastSeen');
    res.json(user.friends || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching connected friends' });
  }
};
