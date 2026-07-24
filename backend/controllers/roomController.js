const Room = require('../models/Room');
const Message = require('../models/Message');

const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'RM-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

exports.createRoom = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Room name is required.' });
    }

    let code = generateRoomCode();
    let existingRoom = await Room.findOne({ code });
    while (existingRoom) {
      code = generateRoomCode();
      existingRoom = await Room.findOne({ code });
    }

    const room = await Room.create({
      name: name.trim(),
      code,
      admin: req.user._id,
      members: [req.user._id],
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}`,
    });

    const populatedRoom = await Room.findById(room._id)
      .populate('admin', 'username email avatar')
      .populate('members', 'username email avatar isOnline');

    res.status(201).json(populatedRoom);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Error creating room' });
  }
};

exports.joinRoomByCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || code.trim() === '') {
      return res.status(400).json({ message: 'Room code is required.' });
    }

    const room = await Room.findOne({ code: code.trim().toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Invalid Room Code. Room not found.' });
    }

    if (!room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }

    const populatedRoom = await Room.findById(room._id)
      .populate('admin', 'username email avatar')
      .populate('members', 'username email avatar isOnline');

    res.json(populatedRoom);
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Error joining room' });
  }
};

exports.getUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate('admin', 'username email avatar')
      .populate('members', 'username email avatar isOnline');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user rooms' });
  }
};

exports.getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId)
      .populate('admin', 'username email avatar')
      .populate('members', 'username email avatar isOnline');

    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    if (!room.members.some((m) => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You are not a member of this room.' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room details' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { memberId } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    if (room.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only Room Admin can remove members.' });
    }

    if (memberId === room.admin.toString()) {
      return res.status(400).json({ message: 'Admin cannot remove themselves from room.' });
    }

    room.members = room.members.filter((m) => m.toString() !== memberId);
    await room.save();

    const updatedRoom = await Room.findById(roomId)
      .populate('admin', 'username email avatar')
      .populate('members', 'username email avatar isOnline');

    res.json({ message: 'Member removed successfully.', room: updatedRoom, removedMemberId: memberId });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Error removing member from room' });
  }
};

exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);

    if (!room || !room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const messages = await Message.find({
      room: roomId,
      clearedFor: { $ne: req.user._id },
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username avatar');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room messages' });
  }
};
