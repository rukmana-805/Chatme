const Message = require('../models/Message');
const User = require('../models/User');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

exports.getPrivateMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId } = req.params;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser.friends.includes(targetUserId)) {
      return res.status(403).json({
        message: 'You can only message users who have accepted your follow request.',
        isBlocked: true,
      });
    }

    // Mark unread messages sent by targetUserId to currentUserId as read
    await Message.updateMany(
      { sender: targetUserId, receiver: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
      clearedFor: { $ne: currentUserId },
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar');

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    let imageUrl = '';

    if (isCloudinaryConfigured()) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'chatme_uploads',
        });
        imageUrl = result.secure_url;

        // Clean up local temp file after upload to Cloudinary
        fs.unlink(req.file.path, () => {});
      } catch (cloudErr) {
        console.error('Cloudinary upload failed, falling back to local storage:', cloudErr.message);
        imageUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(req.file.path)}`;
      }
    } else {
      // Fallback local storage URL
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(req.file.path)}`;
    }

    res.json({ imageUrl });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
};

exports.clearPrivateChat = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId } = req.params;

    await Message.deleteMany({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
    });

    res.json({ message: 'Chat history cleared from database.' });
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({ message: 'Error clearing chat' });
  }
};

exports.clearRoomChat = async (req, res) => {
  try {
    const { roomId } = req.params;

    await Message.deleteMany({ room: roomId });

    res.json({ message: 'Room chat cleared from database.' });
  } catch (error) {
    console.error('Clear room chat error:', error);
    res.status(500).json({ message: 'Error clearing room chat' });
  }
};
