const User = require('../models/User');
const Message = require('../models/Message');

const socketHandler = (io) => {
  // Store connected user socket IDs: userId -> socketId
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Setup User Room & Mark Online
    socket.on('setup', async (userData) => {
      if (!userData || !userData._id) return;
      const userId = userData._id.toString();

      socket.userId = userId;
      socket.join(userId);
      onlineUsers.set(userId, socket.id);

      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        socket.broadcast.emit('user_online', { userId });
      } catch (err) {
        console.error('Socket setup error:', err);
      }
    });

    // Send 1-on-1 Private Message
    socket.on('send_private_message', async (data) => {
      const { senderId, receiverId, text, imageUrl } = data;

      try {
        const sender = await User.findById(senderId);
        if (!sender || !sender.friends.includes(receiverId)) {
          return socket.emit('error_message', {
            message: 'Cannot send message. You must be connected friends.',
          });
        }

        const message = await Message.create({
          sender: senderId,
          receiver: receiverId,
          text: text || '',
          imageUrl: imageUrl || '',
        });

        const populatedMsg = await Message.findById(message._id)
          .populate('sender', 'username avatar')
          .populate('receiver', 'username avatar');

        // Emit to receiver's socket room and sender's socket room
        io.to(receiverId).emit('receive_private_message', populatedMsg);
        io.to(senderId).emit('receive_private_message', populatedMsg);
      } catch (err) {
        console.error('Send private message error:', err);
        socket.emit('error_message', { message: 'Failed to send message.' });
      }
    });

    // Mark Private Messages as Read
    socket.on('mark_read', async ({ senderId }) => {
      if (!senderId || !socket.userId) return;
      try {
        const targetId = senderId.toString();
        const myId = socket.userId.toString();

        await Message.updateMany(
          { sender: targetId, receiver: myId, isRead: false },
          { $set: { isRead: true } }
        );

        // Notify sender in their socket room that their messages were read
        io.to(targetId).emit('messages_read', { chatPartnerId: myId });
      } catch (err) {
        console.error('Mark read error:', err);
      }
    });

    // Join Room Socket Channel
    socket.on('join_room_channel', (roomId) => {
      socket.join(`room_${roomId}`);
      console.log(`[Socket] User ${socket.userId} joined room_${roomId}`);
    });

    // Leave Room Socket Channel
    socket.on('leave_room_channel', (roomId) => {
      socket.leave(`room_${roomId}`);
    });

    // Send Room Message
    socket.on('send_room_message', async (data) => {
      const { senderId, roomId, text, imageUrl } = data;

      try {
        const message = await Message.create({
          sender: senderId,
          room: roomId,
          text: text || '',
          imageUrl: imageUrl || '',
        });

        const populatedMsg = await Message.findById(message._id)
          .populate('sender', 'username avatar');

        // Emit to all users in room channel
        io.to(`room_${roomId}`).emit('receive_room_message', populatedMsg);
      } catch (err) {
        console.error('Send room message error:', err);
        socket.emit('error_message', { message: 'Failed to send room message.' });
      }
    });

    // Real-Time Typing Notifications
    socket.on('typing', ({ receiverId, roomId, senderUsername }) => {
      if (receiverId) {
        io.to(receiverId).emit('typing', { senderId: socket.userId, senderUsername });
      } else if (roomId) {
        socket.to(`room_${roomId}`).emit('typing', { senderId: socket.userId, senderUsername, roomId });
      }
    });

    socket.on('stop_typing', ({ receiverId, roomId }) => {
      if (receiverId) {
        io.to(receiverId).emit('stop_typing', { senderId: socket.userId });
      } else if (roomId) {
        socket.to(`room_${roomId}`).emit('stop_typing', { senderId: socket.userId, roomId });
      }
    });

    // Notify user kicked from room
    socket.on('kick_member', ({ memberId, roomId }) => {
      io.to(memberId).emit('member_kicked', { roomId });
    });

    // Notify follow request updates
    socket.on('follow_request_sent', ({ recipientId, requesterName }) => {
      io.to(recipientId).emit('follow_request_notification', { requesterName });
    });

    // Handle Disconnect
    socket.on('disconnect', async () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        try {
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date(),
          });
          socket.broadcast.emit('user_offline', {
            userId: socket.userId,
            lastSeen: new Date(),
          });
        } catch (err) {
          console.error('Socket disconnect error:', err);
        }
      }
    });
  });
};

module.exports = socketHandler;
