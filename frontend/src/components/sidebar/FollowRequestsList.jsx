import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Avatar from '../ui/Avatar';
import { UserCheck, UserX, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FollowRequestsList = ({ onRequestAccepted, onRequestProcessed }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { reloadUser } = useAuth();

  const fetchRequests = async () => {
    try {
      const res = await api.get('/users/follow-requests');
      setRequests(res.data || []);
      if (onRequestProcessed) onRequestProcessed(res.data?.length || 0);
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (requestId) => {
    setProcessingId(requestId);
    try {
      await api.put(`/users/follow-request/${requestId}/accept`);
      setRequests((prev) => {
        const next = prev.filter((r) => r._id !== requestId);
        if (onRequestProcessed) onRequestProcessed(next.length);
        return next;
      });
      reloadUser();
      if (onRequestAccepted) onRequestAccepted();
    } catch (err) {
      alert('Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    try {
      await api.put(`/users/follow-request/${requestId}/reject`);
      setRequests((prev) => {
        const next = prev.filter((r) => r._id !== requestId);
        if (onRequestProcessed) onRequestProcessed(next.length);
        return next;
      });
    } catch (err) {
      alert('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-[#8696a0]">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#111b21]">
      <h3 className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider mb-2">
        Pending Requests ({requests.length})
      </h3>

      {requests.length === 0 ? (
        <div className="text-center text-[#8696a0] text-xs py-8">
          No pending follow requests.
        </div>
      ) : (
        requests.map((req) => (
          <div
            key={req._id}
            className="flex items-center justify-between p-3 rounded-xl bg-[#1f2c34]/60 border border-white/5 hover:bg-[#1f2c34] transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={req.requester.avatar}
                name={req.requester.username}
                isOnline={req.requester.isOnline}
              />
              <div className="truncate">
                <h4 className="text-sm font-semibold text-white truncate">
                  {req.requester.username}
                </h4>
                <p className="text-xs text-[#8696a0] truncate">{req.requester.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAccept(req._id)}
                disabled={processingId === req._id}
                className="p-2 bg-[#00a884] hover:bg-[#06cf9c] text-[#0b141a] rounded-lg transition font-bold"
                title="Accept Request"
              >
                {processingId === req._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => handleReject(req._id)}
                disabled={processingId === req._id}
                className="p-2 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition"
                title="Reject Request"
              >
                <UserX className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FollowRequestsList;
