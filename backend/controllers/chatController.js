const Message = require('../models/Message');
const User = require('../models/User');
const Room = require('../models/Room');
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

// Helper to cleanup images from Cloudinary & local storage
const deleteMessageImages = async (messages) => {
  for (const msg of messages) {
    if (!msg.imageUrl) continue;

    try {
      if (isCloudinaryConfigured() && msg.imageUrl.includes('res.cloudinary.com')) {
        // Extract public_id (e.g. "chatme_uploads/filename")
        const urlParts = msg.imageUrl.split('/');
        const fileNameWithExt = urlParts.pop();
        const folderName = urlParts.pop();
        const publicId = `${folderName}/${fileNameWithExt.split('.')[0]}`;

        await cloudinary.uploader.destroy(publicId);
        console.log(`[Cloudinary Cleanup] Destroyed image: ${publicId}`);
      } else if (msg.imageUrl.includes('/uploads/')) {
        // Local file storage cleanup
        const filename = path.basename(msg.imageUrl);
        const localPath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          console.log(`[Local File Cleanup] Deleted file: ${filename}`);
        }
      }
    } catch (err) {
      console.error(`[Image Cleanup Error] Failed for ${msg.imageUrl}:`, err.message);
    }
  }
};

exports.clearPrivateChat = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId } = req.params;

    const messagesToDelete = await Message.find({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
      imageUrl: { $ne: '' },
    });

    await deleteMessageImages(messagesToDelete);

    await Message.deleteMany({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
    });

    res.json({ message: 'Chat history & images cleared permanently.' });
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({ message: 'Error clearing chat' });
  }
};

exports.clearRoomChat = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messagesToDelete = await Message.find({
      room: roomId,
      imageUrl: { $ne: '' },
    });

    await deleteMessageImages(messagesToDelete);

    await Message.deleteMany({ room: roomId });

    res.json({ message: 'Room chat & images cleared permanently.' });
  } catch (error) {
    console.error('Clear room chat error:', error);
    res.status(500).json({ message: 'Error clearing room chat' });
  }
};

exports.getUnreadCounts = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Unread direct messages
    const unreadDirect = await Message.aggregate([
      {
        $match: {
          receiver: currentUserId,
          isRead: false,
          clearedFor: { $ne: currentUserId },
        },
      },
      {
        $group: {
          _id: '$sender',
          count: { $sum: 1 },
        },
      },
    ]);

    // Unread room messages
    const userRooms = await Room.find({ members: currentUserId }).select('_id');
    const userRoomIds = userRooms.map((r) => r._id);

    const unreadRooms = await Message.aggregate([
      {
        $match: {
          room: { $in: userRoomIds },
          sender: { $ne: currentUserId },
          clearedFor: { $ne: currentUserId },
        },
      },
      {
        $group: {
          _id: '$room',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {};
    unreadDirect.forEach((item) => {
      counts[`direct_${item._id}`] = item.count;
    });

    unreadRooms.forEach((item) => {
      counts[`room_${item._id}`] = item.count;
    });

    res.json(counts);
  } catch (error) {
    console.error('Get unread counts error:', error);
    res.status(500).json({ message: 'Error fetching unread counts' });
  }
};
