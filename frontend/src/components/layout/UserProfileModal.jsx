import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Home, Calendar, Shield, Key, Edit2, Save, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { useToast } from '../ui/ToastProvider';
const InputField = ({ field, value, onChange }) => (
  <input 
    type="text" 
    value={value} 
    onChange={e => onChange(field, e.target.value)}
    className="bg-[var(--bg-card)] border border-[var(--border-glass)] focus:border-cyan-400 rounded-md px-2 py-1 text-sm text-[var(--text-primary)] outline-none w-full transition-colors font-medium shadow-inner"
  />
);

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const handleStartEdit = () => {
    setTempProfile({
      name: user.name || '',
      role: user.role || 'viewer',
      email: user.email || '',
      phone: user.phone || '',
      facility: user.facility || ''
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(tempProfile);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setTempProfile(prev => ({ ...prev, [field]: value }));
  };

  const formattedDate = user.createdAt 
    ? format(new Date(user.createdAt), 'MMMM dd, yyyy')
    : 'Unknown';
    
  const displayRole = user.role === 'admin' ? 'Primary Administrator' : 'System Viewer';
  const displayStatus = user.role === 'admin' ? 'Active / Cleared' : 'Standard Access';

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (isEditing) handleCancelEdit();
              onClose();
            }}
            className="absolute inset-0 bg-[#0B0F1A]/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[var(--bg-page)] border border-[var(--border-glass)] shadow-[0_0_40px_rgba(34,211,238,0.15)] rounded-2xl overflow-hidden"
          >
            {/* Header Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

            <div className="p-6 relative">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                  <User className="text-cyan-400" size={24} />
                  User Profile
                </h2>
                <div className="flex gap-2">
                  {!isEditing && (
                    <button 
                      onClick={handleStartEdit}
                      className="text-[var(--text-secondary)] hover:text-cyan-400 transition-colors p-1"
                      title="Edit Profile"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (isEditing) handleCancelEdit();
                      onClose();
                    }}
                    className="text-[var(--text-muted)] hover:text-rose-500 transition-colors p-1 ml-2"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Profile Avatar & Top Info */}
              <div className="flex items-center gap-5 mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-[2px] shadow-[0_0_20px_rgba(34,211,238,0.3)] select-none shrink-0">
                  <div className="w-full h-full bg-[var(--bg-active)] rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-black tracking-widest text-white">
                      {(user.name || 'U').substring(0,2).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <InputField field="name" value={tempProfile.name} onChange={handleChange} />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)] shrink-0" />
                        <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 truncate">{displayRole}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight truncate">{user.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)] shrink-0" />
                        <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 truncate">{displayRole}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <div className="bg-[var(--bg-active)] border border-[var(--border-subtle)] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Email */}
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] flex items-center gap-1 mb-1">
                      <Mail size={12} /> Email Address
                    </span>
                    {isEditing ? <InputField field="email" value={tempProfile.email} onChange={handleChange} /> : <span className="text-sm font-medium text-[var(--text-secondary)] truncate">{user.email}</span>}
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] flex items-center gap-1 mb-1">
                      <Phone size={12} /> Contact Number
                    </span>
                    {isEditing ? <InputField field="phone" value={tempProfile.phone} onChange={handleChange} /> : <span className="text-sm font-medium text-[var(--text-secondary)] truncate">{user.phone || 'Not set'}</span>}
                  </div>

                  {/* Facility / House Name */}
                  <div className="flex flex-col sm:col-span-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] flex items-center gap-1 mb-1">
                      <Home size={12} /> Assigned Facility
                    </span>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <InputField field="facility" value={tempProfile.facility} onChange={handleChange} />
                      ) : (
                        <span className="text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 truncate">
                          {user.facility || 'Not Assigned'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Account Status (Non-editable) */}
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] flex items-center gap-1 mb-1 opacity-70">
                      <Shield size={12} /> Clearance Level
                    </span>
                    <span className="text-sm font-medium text-[var(--text-secondary)] opacity-70">{displayStatus}</span>
                  </div>

                  {/* Joined Date (Non-editable) */}
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] flex items-center gap-1 mb-1 opacity-70">
                      <Calendar size={12} /> System Entry
                    </span>
                    <span className="text-sm font-medium text-[var(--text-secondary)] opacity-70">{formattedDate}</span>
                  </div>

                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-8 flex justify-end gap-3 transition-all">
                {isEditing ? (
                  <>
                    <button 
                      className="btn-ghost"
                      onClick={handleCancelEdit}
                    >
                      <XCircle size={16} />
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all shrink-0 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn-ghost"
                      onClick={onClose}
                    >
                      Close Profile
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all shrink-0">
                      <Key size={16} />
                      Reset Credentials
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
